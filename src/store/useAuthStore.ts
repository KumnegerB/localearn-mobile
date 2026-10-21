import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { User, AuthResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isCheckingAuth: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string, phoneNumber?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  verifyAccount: (telegramUsername?: string, phoneNumber?: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      const { access_token, user } = response.data;
      await AsyncStorage.setItem('@localearn_token', access_token);
      set({ token: access_token, user, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to sign in. Please verify your credentials.';
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  register: async (fullName, email, password, phoneNumber) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        full_name: fullName,
        email,
        password,
        phone_number: phoneNumber,
      });
      const { access_token, user } = response.data;
      await AsyncStorage.setItem('@localearn_token', access_token);
      set({ token: access_token, user, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      console.error('Registration failed:', err.response?.data || err.message || err);
      let errorMsg = 'Failed to create account.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map((e: any) => e.msg).join(', ');
        }
      } else if (err.message) {
        errorMsg = `${err.message} (Check network or server connection)`;
      }
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('@localearn_token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const token = await AsyncStorage.getItem('@localearn_token');
      if (token) {
        const response = await apiClient.get<User>('/users/me');
        set({ token, user: response.data, isCheckingAuth: false });
      } else {
        set({ user: null, token: null, isCheckingAuth: false });
      }
    } catch (error) {
      await AsyncStorage.removeItem('@localearn_token');
      set({ user: null, token: null, isCheckingAuth: false });
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await apiClient.put<User>('/users/me', data);
      set({ user: response.data });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to update profile' });
      return false;
    }
  },

  verifyAccount: async (telegramUsername, phoneNumber) => {
    try {
      const response = await apiClient.post<User>('/users/me/verify', {
        telegram_username: telegramUsername,
        phone_number: phoneNumber,
      });
      set({ user: response.data });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to verify account';
      set({ error: typeof msg === 'string' ? msg : 'Verification failed' });
      return false;
    }
  },
}));
