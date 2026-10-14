import { create } from 'zustand';
import { apiClient } from '../api/client';
import { Task, TaskStatus } from '../types';

interface TaskFilter {
  category?: string;
  status?: TaskStatus;
  lat?: number;
  lng?: number;
  radius_km?: number;
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  fetchTasks: (filters?: TaskFilter) => Promise<void>;
  fetchTaskById: (id: number) => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<Task | null>;
  acceptTask: (id: number) => Promise<boolean>;
  completeTask: (id: number) => Promise<boolean>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,

  fetchTasks: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params: any = {};
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.lat !== undefined && filters.lng !== undefined) {
        params.lat = filters.lat;
        params.lng = filters.lng;
        params.radius_km = filters.radius_km || 25;
      }

      const response = await apiClient.get<Task[]>('/tasks/', { params });
      set({ tasks: response.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to load tasks',
        isLoading: false,
      });
    }
  },

  fetchTaskById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<Task>(`/tasks/${id}`);
      set({ currentTask: response.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to load task details',
        isLoading: false,
      });
    }
  },

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<Task>('/tasks/', taskData);
      set((state) => ({
        tasks: [response.data, ...state.tasks],
        isLoading: false,
      }));
      return response.data;
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to create task',
        isLoading: false,
      });
      return null;
    }
  },

  acceptTask: async (id: number) => {
    try {
      const response = await apiClient.post<Task>(`/tasks/${id}/accept`);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? response.data : t)),
        currentTask: state.currentTask?.id === id ? response.data : state.currentTask,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to accept task' });
      return false;
    }
  },

  completeTask: async (id: number) => {
    try {
      const response = await apiClient.post<Task>(`/tasks/${id}/complete`);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? response.data : t)),
        currentTask: state.currentTask?.id === id ? response.data : state.currentTask,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to complete task' });
      return false;
    }
  },
}));

