import { create } from 'zustand';
import { apiClient } from '../api/client';
import { getWebSocketUrl } from '../config/env';
import { Message, Conversation, InAppNotification } from '../types';

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  socket: WebSocket | null;
  unreadCount: number;
  activeNotification: InAppNotification | null;
  lastKnownMessageId: number;
  activeChatRoom: { taskId?: number | null; otherUserId: number } | null;

  setActiveChatRoom: (room: { taskId?: number | null; otherUserId: number } | null) => void;
  dismissNotification: () => void;
  triggerNotification: (notif: InAppNotification) => void;
  markConversationAsRead: (taskId: number | undefined | null, otherUserId: number) => void;
  fetchConversations: (currentUserId?: number) => Promise<void>;
  fetchMessages: (taskId: number | undefined | null, otherUserId: number) => Promise<void>;
  connectWebSocket: (taskId: number | undefined | null, otherUserId: number, token: string) => void;
  disconnectWebSocket: () => void;
  sendMessage: (content: string, fallback?: { receiverId: number; taskId?: number | null }) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: [],
  isLoading: false,
  isConnected: false,
  socket: null,
  unreadCount: 0,
  activeNotification: null,
  lastKnownMessageId: 0,
  activeChatRoom: null,

  setActiveChatRoom: (room) => {
    set({ activeChatRoom: room });
    if (room) {
      get().markConversationAsRead(room.taskId, room.otherUserId);
    }
  },

  dismissNotification: () => {
    set({ activeNotification: null });
  },

  triggerNotification: (notif: InAppNotification) => {
    set({ activeNotification: notif });
  },

  markConversationAsRead: (taskId: number | undefined | null, otherUserId: number) => {
    set((state) => {
      const safeTaskId = taskId ?? 0;
      const updated = state.conversations.map((c) => {
        const cTaskId = c.task_id ?? 0;
        if (cTaskId === safeTaskId && c.other_user.id === otherUserId) {
          return { ...c, unread_count: 0 };
        }
        return c;
      });
      const totalUnread = updated.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      return { conversations: updated, unreadCount: totalUnread };
    });
  },

  fetchConversations: async (currentUserId?: number) => {
    // If not authenticated, do not fire network request to authenticated endpoint
    if (!currentUserId) {
      set({ conversations: [], unreadCount: 0, isLoading: false });
      return;
    }

    try {
      const response = await apiClient.get<Conversation[]>('/chat/conversations');
      const convs = response.data;
      const totalUnread = convs.reduce((sum, c) => sum + (c.unread_count || 0), 0);

      const state = get();
      const maxMsgId = convs.reduce(
        (max, c) => Math.max(max, c.last_message?.id || 0),
        0
      );

      // If we already had an initial load and a user is logged in, check for incoming new messages
      if (currentUserId && state.lastKnownMessageId > 0) {
        for (const c of convs) {
          if (c.unread_count > 0 && c.last_message) {
            const isFromOther = c.last_message.sender_id !== currentUserId;
            const isNewer = c.last_message.id > state.lastKnownMessageId;
            const isCurrentlyInThisRoom =
              state.activeChatRoom?.otherUserId === c.other_user.id;

            if (isFromOther && isNewer && !isCurrentlyInThisRoom) {
              set({
                activeNotification: {
                  id: String(c.last_message.id),
                  title: c.task_title || 'Direct Message',
                  senderName: c.other_user.full_name || 'Neighbor',
                  message: c.last_message.content,
                  taskId: c.task_id ?? 0,
                  taskTitle: c.task_title || 'Direct Message',
                  otherUser: c.other_user,
                },
              });
              break;
            }
          }
        }
      }

      set({
        conversations: convs,
        unreadCount: totalUnread,
        lastKnownMessageId: Math.max(state.lastKnownMessageId, maxMsgId),
        isLoading: false,
      });
    } catch (err: any) {
      if (err.response?.status === 401) {
        set({ conversations: [], unreadCount: 0, isLoading: false });
        return;
      }
      set({ isLoading: false });
    }
  },

  fetchMessages: async (taskId: number | undefined | null, otherUserId: number) => {
    set({ isLoading: true });
    try {
      const safeTaskId = taskId ?? 0;
      const response = await apiClient.get<Message[]>(`/chat/task/${safeTaskId}/history`, {
        params: { other_user_id: otherUserId },
      });
      set({ messages: response.data, isLoading: false });
      // Mark as read in local conversation state
      get().markConversationAsRead(safeTaskId, otherUserId);
    } catch (err) {
      console.error('Failed to load message history', err);
      set({ isLoading: false });
    }
  },

  connectWebSocket: (taskId: number | undefined | null, otherUserId: number, token: string) => {
    // Clean up any existing connection
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.close();
    }

    const safeTaskId = taskId ?? 0;
    const wsUrl = getWebSocketUrl(safeTaskId, otherUserId, token);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      set({ isConnected: true, socket: ws });
    };

    ws.onmessage = (event) => {
      try {
        const newMsg: Message = JSON.parse(event.data);
        set((state) => ({
          messages: [...state.messages, newMsg],
          lastKnownMessageId: Math.max(state.lastKnownMessageId, newMsg.id),
        }));
      } catch (e) {
        console.error('Failed to parse incoming WebSocket message', e);
      }
    };

    ws.onerror = (e) => {
      console.error('WebSocket error:', e);
      set({ isConnected: false });
    };

    ws.onclose = () => {
      set({ isConnected: false, socket: null });
    };

    set({ socket: ws });
  },

  disconnectWebSocket: () => {
    const ws = get().socket;
    if (ws) {
      ws.close();
      set({ socket: null, isConnected: false });
    }
  },

  sendMessage: async (content: string, fallback?: { receiverId: number; taskId?: number | null }) => {
    const ws = get().socket;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ content }));
      return;
    }

    // Fallback to REST if WebSocket is not currently connected
    if (fallback?.receiverId) {
      try {
        const response = await apiClient.post<Message>('/chat/send', {
          content,
          receiver_id: fallback.receiverId,
          task_id: fallback.taskId ?? 0,
        });
        const newMsg = response.data;
        set((state) => ({
          messages: [...state.messages, newMsg],
          lastKnownMessageId: Math.max(state.lastKnownMessageId, newMsg.id),
        }));
      } catch (e) {
        console.error('Failed to send message via REST fallback', e);
      }
    }
  },
}));
