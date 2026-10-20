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
  activeChatRoom: { taskId: number; otherUserId: number } | null;

  setActiveChatRoom: (room: { taskId: number; otherUserId: number } | null) => void;
  dismissNotification: () => void;
  triggerNotification: (notif: InAppNotification) => void;
  markConversationAsRead: (taskId: number, otherUserId: number) => void;
  fetchConversations: (currentUserId?: number) => Promise<void>;
  fetchMessages: (taskId: number, otherUserId: number) => Promise<void>;
  connectWebSocket: (taskId: number, otherUserId: number, token: string) => void;
  disconnectWebSocket: () => void;
  sendMessage: (content: string) => void;
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

  markConversationAsRead: (taskId: number, otherUserId: number) => {
    set((state) => {
      const updated = state.conversations.map((c) => {
        if (c.task_id === taskId && c.other_user.id === otherUserId) {
          return { ...c, unread_count: 0 };
        }
        return c;
      });
      const totalUnread = updated.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      return { conversations: updated, unreadCount: totalUnread };
    });
  },

  fetchConversations: async (currentUserId?: number) => {
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
              state.activeChatRoom?.taskId === c.task_id &&
              state.activeChatRoom?.otherUserId === c.other_user.id;

            if (isFromOther && isNewer && !isCurrentlyInThisRoom) {
              set({
                activeNotification: {
                  id: String(c.last_message.id),
                  title: c.task_title,
                  senderName: c.other_user.full_name || 'Neighbor',
                  message: c.last_message.content,
                  taskId: c.task_id,
                  taskTitle: c.task_title,
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
    } catch (err) {
      console.error('Failed to load conversations', err);
      set({ isLoading: false });
    }
  },

  fetchMessages: async (taskId: number, otherUserId: number) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get<Message[]>(`/chat/task/${taskId}/history`, {
        params: { other_user_id: otherUserId },
      });
      set({ messages: response.data, isLoading: false });
      // Mark as read in local conversation state
      get().markConversationAsRead(taskId, otherUserId);
    } catch (err) {
      console.error('Failed to load message history', err);
      set({ isLoading: false });
    }
  },

  connectWebSocket: (taskId: number, otherUserId: number, token: string) => {
    // Clean up any existing connection
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.close();
    }

    const wsUrl = getWebSocketUrl(taskId, otherUserId, token);
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

  sendMessage: (content: string) => {
    const ws = get().socket;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ content }));
    }
  },
}));
