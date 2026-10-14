import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_V1_URL } from '../config/env';

export const apiClient = axios.create({
  baseURL: API_V1_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to inject bearer token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@localearn_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get token from storage', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clean up token if invalid/expired
      await AsyncStorage.removeItem('@localearn_token');
    }
    return Promise.reject(error);
  }
);

