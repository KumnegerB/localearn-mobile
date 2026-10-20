import { create } from 'zustand';
import { apiClient } from '../api/client';
import { Task, TaskStatus, TaskApplication } from '../types';

interface TaskFilter {
  category?: string;
  status?: TaskStatus;
  lat?: number;
  lng?: number;
  radius_km?: number;
}

interface TaskState {
  tasks: Task[];
  myPostedTasks: Task[];
  myAppliedTasks: TaskApplication[];
  candidates: TaskApplication[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  fetchTasks: (filters?: TaskFilter) => Promise<void>;
  fetchTaskById: (id: number) => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<Task | null>;
  acceptTask: (id: number) => Promise<boolean>;
  completeTask: (id: number) => Promise<boolean>;
  fetchMyPostedTasks: () => Promise<void>;
  fetchMyAppliedTasks: () => Promise<void>;
  fetchCandidates: (taskId: number) => Promise<void>;
  applyForTask: (taskId: number, message?: string) => Promise<boolean>;
  acceptCandidate: (applicationId: number) => Promise<boolean>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  myPostedTasks: [],
  myAppliedTasks: [],
  candidates: [],
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

  fetchMyPostedTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<Task[]>('/tasks/my-posted');
      set({ myPostedTasks: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to fetch my posted jobs', isLoading: false });
    }
  },

  fetchMyAppliedTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<TaskApplication[]>('/tasks/my-applied');
      set({ myAppliedTasks: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to fetch applied jobs', isLoading: false });
    }
  },

  fetchCandidates: async (taskId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<TaskApplication[]>(`/tasks/${taskId}/applications`);
      set({ candidates: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to fetch candidates', isLoading: false });
    }
  },

  applyForTask: async (taskId: number, message?: string) => {
    try {
      const response = await apiClient.post<TaskApplication>(`/tasks/${taskId}/apply`, { message });
      set((state) => ({
        currentTask:
          state.currentTask?.id === taskId
            ? { ...state.currentTask, has_applied: true }
            : state.currentTask,
        myAppliedTasks: [
          response.data,
          ...state.myAppliedTasks.filter((a) => a.task_id !== taskId),
        ],
      }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to apply for task' });
      return false;
    }
  },

  acceptCandidate: async (applicationId: number) => {
    try {
      const response = await apiClient.post<Task>(`/tasks/applications/${applicationId}/accept`);
      set((state) => ({
        currentTask: state.currentTask?.id === response.data.id ? response.data : state.currentTask,
        myPostedTasks: state.myPostedTasks.map((t) => (t.id === response.data.id ? response.data : t)),
        candidates: state.candidates.map((c) =>
          c.id === applicationId
            ? { ...c, status: 'ACCEPTED' as const }
            : { ...c, status: 'REJECTED' as const }
        ),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to accept candidate' });
      return false;
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
        myPostedTasks: [response.data, ...state.myPostedTasks],
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
        myPostedTasks: state.myPostedTasks.map((t) => (t.id === id ? response.data : t)),
        currentTask: state.currentTask?.id === id ? response.data : state.currentTask,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to complete task' });
      return false;
    }
  },
}));

