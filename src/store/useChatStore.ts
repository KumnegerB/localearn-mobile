import { create } from 'zustand';
import { apiClient } from '../api/client';
import { getWebSocketUrl } from '../config/env';
import { Message } from '../types';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  socket: WebSocket | null;
  fetchMessages: (taskId: number) => Promise<void>;
  connectWebSocket: (taskId: number, token: string) => void;
  disconnectWebSocket: () => void;
  sendMessage: (content: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  isConnected: false,
  socket: null,

  fetchMessages: async (taskId: number) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get<Message[]>(`/chat/task/${taskId}`);
      set({ messages: response.data, isLoading: false });
    } catch (err) {
      console.error('Failed to load message history', err);
      set({ isLoading: false });
    }
  },

  connectWebSocket: (taskId: number, token: string) => {
    // Clean up any existing connection
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.close();
    }

    const wsUrl = getWebSocketUrl(taskId, token);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      set({ isConnected: true, socket: ws });
    };

    ws.onmessage = (event) => {
      try {
        const newMsg: Message = JSON.parse(event.data);
        set((state) => ({
          messages: [...state.messages, newMsg],
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

