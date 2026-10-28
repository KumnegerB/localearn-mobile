import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { User, AuthResponse } from '../types';
import { useChatStore } from './useChatStore';
import { useTaskStore } from './useTaskStore';
import { useNotificationStore } from './useNotificationStore';
import { invalidateUserProfileCache } from '../screens/profile/UserProfileScreen';
import { clearPushTokenOnBackend } from '../services/notificationService';

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
  sendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (email: string, otpCode: string) => Promise<{ success: boolean; message: string }>;
  checkUsernameAvailability: (username: string) => Promise<{ available: boolean; reason?: string }>;
  setUsername: (username: string) => Promise<{ success: boolean; message: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const cleanEmail = email.trim().toLowerCase();
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { email: cleanEmail, password });
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
    const cleanEmail = email.trim().toLowerCase();
    try {
      await apiClient.post<AuthResponse>('/auth/register', {
        full_name: fullName.trim(),
        email: cleanEmail,
        password,
        phone_number: phoneNumber?.trim() || undefined,
      });
      // Do not store token or set user as logged in yet.
      // The user must first verify their email via OTP!
      set({ isLoading: false, error: null });
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
    try {
      await clearPushTokenOnBackend();
      await Promise.all([
        AsyncStorage.removeItem('@localearn_token'),
        useChatStore.getState().clearAllChatCache(),
        useTaskStore.getState().clearUserTaskCache(),
        useNotificationStore.getState().clearNotificationCache(),
      ]);
      invalidateUserProfileCache();
    } catch {
      // Ignore errors
    }
    set({ user: null, token: null, isLoading: false, error: null });
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
      try {
        await Promise.all([
          useChatStore.getState().clearAllChatCache(),
          useTaskStore.getState().clearUserTaskCache(),
          useNotificationStore.getState().clearNotificationCache(),
        ]);
        invalidateUserProfileCache();
      } catch {
        // Ignore errors
      }
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

  sendOTP: async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const response = await apiClient.post('/auth/send-otp', { email: cleanEmail });
      return { success: true, message: response.data?.message || 'Verification code sent.' };
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to send verification code.';
      return { success: false, message: typeof msg === 'string' ? msg : 'Failed to send code.' };
    }
  },

  verifyOTP: async (email: string, otpCode: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = otpCode.replace(/\s+/g, '').trim();
      const response = await apiClient.post('/auth/verify-otp', { email: cleanEmail, otp_code: cleanCode });
      const { user: updatedUser, access_token } = response.data;
      
      // Store token and activate user session upon successful verification
      if (access_token) {
        await AsyncStorage.setItem('@localearn_token', access_token);
        set({ token: access_token, user: updatedUser });
      } else if (updatedUser) {
        set({ user: updatedUser });
      }
      return { success: true, message: response.data?.message || 'Email verified successfully.' };
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Verification failed. Please check the code.';
      return { success: false, message: typeof msg === 'string' ? msg : 'Verification failed.' };
    }
  },

  checkUsernameAvailability: async (username: string) => {
    try {
      const response = await apiClient.get('/auth/check-username', {
        params: { username },
      });
      return {
        available: Boolean(response.data?.available),
        reason: response.data?.reason,
      };
    } catch (err: any) {
      const reason = err.response?.data?.detail || 'Unable to check username availability.';
      return {
        available: false,
        reason: typeof reason === 'string' ? reason : 'Verification error',
      };
    }
  },

  setUsername: async (username: string) => {
    try {
      const response = await apiClient.post<User>('/users/me/username', { username });
      set({ user: response.data });
      return { success: true, message: 'Username updated successfully.' };
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to set username.';
      return { success: false, message: typeof msg === 'string' ? msg : 'Failed to set username.' };
    }
  },
}));
