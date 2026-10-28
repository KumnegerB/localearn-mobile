import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { getWebSocketUrl } from '../config/env';
import { Message, Conversation, InAppNotification } from '../types';

const CHAT_CONVERSATIONS_KEY = '@localearn_cached_conversations';
const CHAT_ROOMS_KEY = '@localearn_cached_chat_rooms';

export const getRoomKey = (taskId?: number | null, otherUserId?: number): string =>
  `${taskId || 0}_${otherUserId || 0}`;

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  messagesByRoom: Record<string, Message[]>;
  isLoading: boolean;
  isMessagesLoading: boolean;
  isConnected: boolean;
  socket: WebSocket | null;
  unreadCount: number;
  activeNotification: InAppNotification | null;
  lastKnownMessageId: number;
  activeChatRoom: { taskId?: number | null; otherUserId: number } | null;

  loadCachedChatData: () => Promise<void>;
  clearAllChatCache: () => Promise<void>;
  getRoomMessages: (taskId?: number | null, otherUserId?: number) => Message[];
  setActiveChatRoom: (room: { taskId?: number | null; otherUserId: number } | null) => void;
  clearMessages: () => void;
  dismissNotification: () => void;
  triggerNotification: (notif: InAppNotification) => void;
  markConversationAsRead: (taskId: number | undefined | null, otherUserId: number) => void;
  fetchConversations: (currentUserId?: number) => Promise<void>;
  fetchMessages: (taskId: number | undefined | null, otherUserId: number) => Promise<void>;
  connectWebSocket: (taskId: number | undefined | null, otherUserId: number, token: string) => void;
  disconnectWebSocket: () => void;
  sendMessage: (
    content: string,
    fallback?: {
      receiverId: number;
      taskId?: number | null;
      sender?: { id: number; full_name?: string; avatar_url?: string | null };
    }
  ) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: [],
  messagesByRoom: {},
  isLoading: false,
  isMessagesLoading: false,
  isConnected: false,
  socket: null,
  unreadCount: 0,
  activeNotification: null,
  lastKnownMessageId: 0,
  activeChatRoom: null,

  loadCachedChatData: async () => {
    try {
      const [convsRaw, roomsRaw] = await Promise.all([
        AsyncStorage.getItem(CHAT_CONVERSATIONS_KEY),
        AsyncStorage.getItem(CHAT_ROOMS_KEY),
      ]);

      const updates: Partial<ChatState> = {};
      if (convsRaw) {
        const parsed = JSON.parse(convsRaw);
        if (Array.isArray(parsed) && parsed.length > 0 && get().conversations.length === 0) {
          updates.conversations = parsed;
          updates.unreadCount = parsed.reduce((sum: number, c: Conversation) => sum + (c.unread_count || 0), 0);
        }
      }
      if (roomsRaw) {
        const parsedRooms = JSON.parse(roomsRaw);
        if (parsedRooms && typeof parsedRooms === 'object') {
          updates.messagesByRoom = { ...parsedRooms, ...get().messagesByRoom };
        }
      }
      if (Object.keys(updates).length > 0) {
        set(updates);
      }
    } catch (e) {
      // Ignore cache load failure
    }
  },

  clearAllChatCache: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CHAT_CONVERSATIONS_KEY),
        AsyncStorage.removeItem(CHAT_ROOMS_KEY),
      ]);
    } catch {
      // Ignore errors
    }
    set({
      conversations: [],
      messages: [],
      messagesByRoom: {},
      unreadCount: 0,
      activeChatRoom: null,
      lastKnownMessageId: 0,
      isLoading: false,
      isMessagesLoading: false,
    });
  },

  getRoomMessages: (taskId, otherUserId) => {
    const key = getRoomKey(taskId, otherUserId);
    return get().messagesByRoom[key] || [];
  },

  setActiveChatRoom: (room) => {
    const currentNotif = get().activeNotification;
    if (room) {
      const roomKey = getRoomKey(room.taskId, room.otherUserId);
      const cached = get().messagesByRoom[roomKey] || [];
      // Instantly hydrate messages from room cache with 0ms delay!
      set({
        activeChatRoom: room,
        messages: cached,
        isMessagesLoading: cached.length === 0,
        activeNotification: currentNotif?.otherUser?.id === room.otherUserId ? null : currentNotif,
      });
      get().markConversationAsRead(room.taskId, room.otherUserId);
    } else {
      set({ activeChatRoom: null });
    }
  },

  clearMessages: () => {
    // Preserve messagesByRoom cache so reopening is instant!
    set({ isMessagesLoading: false });
  },

  dismissNotification: () => {
    set({ activeNotification: null });
  },

  triggerNotification: (notif: InAppNotification) => {
    const state = get();
    // Do not show banner notification if user is currently inside this chat room
    if (state.activeChatRoom?.otherUserId === notif.otherUser?.id) {
      return;
    }
    set({ activeNotification: notif });
  },

  markConversationAsRead: (taskId: number | undefined | null, otherUserId: number) => {
    const ws = get().socket;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'read' }));
      } catch (e) {
        // ignore websocket send errors
      }
    }

    // Call REST endpoint to ensure DB has marked all messages as read
    apiClient.post('/chat/read', {
      other_user_id: otherUserId,
      task_id: taskId ?? 0,
    }).catch(() => {});

    set((state) => {
      const updated = state.conversations.map((c) => {
        if (c.other_user.id === otherUserId) {
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
      const state = get();

      // If user is currently in a chat room, treat that user's unread_count as 0
      const sanitizedConvs = convs.map((c) => {
        if (state.activeChatRoom?.otherUserId === c.other_user.id) {
          return { ...c, unread_count: 0 };
        }
        return c;
      });

      const totalUnread = sanitizedConvs.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      const maxMsgId = sanitizedConvs.reduce(
        (max, c) => Math.max(max, c.last_message?.id || 0),
        0
      );

      // If we already had an initial load and a user is logged in, check for incoming new messages
      if (currentUserId && state.lastKnownMessageId > 0) {
        for (const c of sanitizedConvs) {
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
        conversations: sanitizedConvs,
        unreadCount: totalUnread,
        lastKnownMessageId: Math.max(state.lastKnownMessageId, maxMsgId),
        isLoading: false,
      });

      // Persist conversations cache
      AsyncStorage.setItem(CHAT_CONVERSATIONS_KEY, JSON.stringify(sanitizedConvs)).catch(() => {});
    } catch (err: any) {
      if (err.response?.status === 401) {
        set({ conversations: [], unreadCount: 0, isLoading: false });
        return;
      }
      set({ isLoading: false });
    }
  },

  fetchMessages: async (taskId: number | undefined | null, otherUserId: number) => {
    const roomKey = getRoomKey(taskId, otherUserId);
    const existing = get().messagesByRoom[roomKey] || [];

    // If we have cached messages for this room, keep showing them! Only show spinner if 0 messages.
    if (existing.length === 0) {
      set({ isMessagesLoading: true });
    } else {
      set({ messages: existing, isMessagesLoading: false });
    }

    try {
      const safeTaskId = taskId ?? 0;
      const response = await apiClient.get<Message[]>(`/chat/task/${safeTaskId}/history`, {
        params: { other_user_id: otherUserId },
      });
      const freshMessages = response.data;
      set((state) => {
        const updatedRooms = {
          ...state.messagesByRoom,
          [roomKey]: freshMessages,
        };
        // Persist room cache asynchronously
        AsyncStorage.setItem(CHAT_ROOMS_KEY, JSON.stringify(updatedRooms)).catch(() => {});
        return {
          messages: freshMessages,
          messagesByRoom: updatedRooms,
          isMessagesLoading: false,
        };
      });
      // Mark as read in local conversation state
      get().markConversationAsRead(safeTaskId, otherUserId);
    } catch (err) {
      console.error('Failed to load message history', err);
      set({ isMessagesLoading: false });
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
        const state = get();

        // A message belongs to this conversation if either the sender or receiver is otherUserId
        const isFromPartner = newMsg.sender_id === otherUserId;
        const isToPartner = newMsg.receiver_id === otherUserId;

        // Is the user currently inside this chat room?
        const activeOtherId = state.activeChatRoom?.otherUserId;
        const isInThisRoom =
          activeOtherId === otherUserId ||
          activeOtherId === newMsg.sender_id ||
          activeOtherId === newMsg.receiver_id;

        const roomKey = getRoomKey(newMsg.task_id ?? safeTaskId, otherUserId);
        const currentRoomMsgs = state.messagesByRoom[roomKey] || [];

        if (isInThisRoom && isFromPartner) {
          newMsg.is_read = true;
          // Instantly tell backend and WebSocket that message is read
          get().markConversationAsRead(newMsg.task_id, otherUserId);
        }

        // Deduplicate or replace optimistic message (which had negative ID)
        const existingIdx = currentRoomMsgs.findIndex(
          (m) =>
            m.id === newMsg.id ||
            (m.id < 0 && m.content === newMsg.content && m.sender_id === newMsg.sender_id)
        );

        let updatedRoomMsgs: Message[];
        if (existingIdx >= 0) {
          updatedRoomMsgs = [...currentRoomMsgs];
          updatedRoomMsgs[existingIdx] = newMsg;
        } else {
          updatedRoomMsgs = [...currentRoomMsgs, newMsg];
        }

        set((s) => {
          let updatedMessages = s.messages;
          if (isInThisRoom) {
            const msgIdx = s.messages.findIndex(
              (m) =>
                m.id === newMsg.id ||
                (m.id < 0 && m.content === newMsg.content && m.sender_id === newMsg.sender_id)
            );
            if (msgIdx >= 0) {
              updatedMessages = [...s.messages];
              updatedMessages[msgIdx] = newMsg;
            } else {
              updatedMessages = [...s.messages, newMsg];
            }
          }

          return {
            messages: updatedMessages,
            messagesByRoom: {
              ...s.messagesByRoom,
              [roomKey]: updatedRoomMsgs,
            },
            lastKnownMessageId: Math.max(s.lastKnownMessageId, newMsg.id),
          };
        });

        AsyncStorage.setItem(CHAT_ROOMS_KEY, JSON.stringify(get().messagesByRoom)).catch(() => {});
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

  sendMessage: async (
    content: string,
    fallback?: {
      receiverId: number;
      taskId?: number | null;
      sender?: { id: number; full_name?: string; avatar_url?: string | null };
    }
  ) => {
    const ws = get().socket;
    const safeTaskId = fallback?.taskId ?? 0;
    const receiverId = fallback?.receiverId;

    let sender = fallback?.sender;
    if (!sender) {
      try {
        sender = require('./useAuthStore').useAuthStore?.getState?.()?.user;
      } catch {
        // ignore
      }
    }
    const senderId = sender?.id;

    // 1. Optimistic Update: Immediately add message to screen with 0ms delay
    if (receiverId && senderId) {
      const optimisticMsg: Message = {
        id: -Date.now(),
        content,
        sender_id: senderId,
        receiver_id: receiverId,
        task_id: safeTaskId,
        is_read: false,
        created_at: new Date().toISOString(),
        sender: {
          id: senderId,
          full_name: sender?.full_name || 'Me',
          avatar_url: sender?.avatar_url || null,
        },
      };

      const roomKey = getRoomKey(safeTaskId, receiverId);
      set((state) => {
        const currentRoomMsgs = state.messagesByRoom[roomKey] || [];
        return {
          messages: [...state.messages, optimisticMsg],
          messagesByRoom: {
            ...state.messagesByRoom,
            [roomKey]: [...currentRoomMsgs, optimisticMsg],
          },
        };
      });
    }

    // 2. Dispatch via active WebSocket connection
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ content }));
      return;
    }

    // 3. Fallback to REST API if WebSocket is offline
    if (receiverId) {
      try {
        const response = await apiClient.post<Message>('/chat/send', {
          content,
          receiver_id: receiverId,
          task_id: safeTaskId,
        });
        const newMsg = response.data;
        const roomKey = getRoomKey(safeTaskId, receiverId);
        set((state) => {
          const currentRoomMsgs = state.messagesByRoom[roomKey] || [];
          const updatedRoomMsgs = currentRoomMsgs.map((m) =>
            m.id < 0 && m.content === content ? newMsg : m
          );
          const updatedMessages = state.messages.map((m) =>
            m.id < 0 && m.content === content ? newMsg : m
          );

          AsyncStorage.setItem(
            CHAT_ROOMS_KEY,
            JSON.stringify({
              ...state.messagesByRoom,
              [roomKey]: updatedRoomMsgs,
            })
          ).catch(() => {});

          return {
            messages: updatedMessages,
            messagesByRoom: {
              ...state.messagesByRoom,
              [roomKey]: updatedRoomMsgs,
            },
            lastKnownMessageId: Math.max(state.lastKnownMessageId, newMsg.id),
          };
        });
      } catch (e) {
        console.error('Failed to send message via REST fallback', e);
      }
    }
  },
}));

// Automatically hydrate cached chat conversations and rooms upon launch
useChatStore.getState().loadCachedChatData();
