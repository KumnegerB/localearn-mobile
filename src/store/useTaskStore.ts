import { create } from 'zustand';
import { apiClient } from '../api/client';
import { Task, TaskStatus, TaskApplication } from '../types';
import { useChatStore } from './useChatStore';

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
  receivedApplications: TaskApplication[];
  currentTask: Task | null;
  notifiedAcceptedAppIds: Set<number>;
  notifiedCandidateAppIds: Set<number>;
  hasLoadedAppliedTasksOnce: boolean;
  hasLoadedReceivedApplicationsOnce: boolean;
  isLoading: boolean;
  error: string | null;
  fetchTasks: (filters?: TaskFilter) => Promise<void>;
  fetchTaskById: (id: number) => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<Task | null>;
  acceptTask: (id: number) => Promise<boolean>;
  completeTask: (id: number) => Promise<boolean>;
  fetchMyPostedTasks: () => Promise<void>;
  fetchMyAppliedTasks: () => Promise<void>;
  fetchReceivedApplications: () => Promise<void>;
  fetchCandidates: (taskId: number) => Promise<void>;
  applyForTask: (taskId: number, message?: string) => Promise<boolean>;
  cancelApplication: (taskId: number, applicationId?: number) => Promise<boolean>;
  acceptCandidate: (applicationId: number) => Promise<boolean>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  myPostedTasks: [],
  myAppliedTasks: [],
  candidates: [],
  receivedApplications: [],
  currentTask: null,
  notifiedAcceptedAppIds: new Set<number>(),
  notifiedCandidateAppIds: new Set<number>(),
  hasLoadedAppliedTasksOnce: false,
  hasLoadedReceivedApplicationsOnce: false,
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
    try {
      const response = await apiClient.get<TaskApplication[]>('/tasks/my-applied');
      const apps = response.data;
      const state = get();

      // Detect newly accepted applications
      if (state.hasLoadedAppliedTasksOnce) {
        for (const app of apps) {
          if (app.status === 'ACCEPTED' && !state.notifiedAcceptedAppIds.has(app.id)) {
            useChatStore.getState().triggerNotification({
              id: `accepted-${app.id}`,
              type: 'APPLICATION_ACCEPTED',
              title: '🎉 Application Accepted!',
              senderName: app.task?.creator?.full_name || 'Gig Poster',
              message: `You have been accepted for "${app.task?.title || 'Gig'}"! Tap to view details.`,
              taskId: app.task_id,
              taskTitle: app.task?.title || 'Gig',
              otherUser: app.task?.creator,
            });
            break;
          }
        }
      }

      const updatedSet = new Set(state.notifiedAcceptedAppIds);
      apps.filter((a) => a.status === 'ACCEPTED').forEach((a) => updatedSet.add(a.id));

      set({
        myAppliedTasks: apps,
        notifiedAcceptedAppIds: updatedSet,
        hasLoadedAppliedTasksOnce: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to fetch applied jobs', isLoading: false });
    }
  },

  fetchReceivedApplications: async () => {
    try {
      const response = await apiClient.get<TaskApplication[]>('/tasks/applications/received');
      const apps = response.data;
      const state = get();

      // Detect new candidates applied for my posted tasks
      if (state.hasLoadedReceivedApplicationsOnce) {
        for (const app of apps) {
          if (app.status === 'PENDING' && !state.notifiedCandidateAppIds.has(app.id)) {
            useChatStore.getState().triggerNotification({
              id: `candidate-${app.id}`,
              type: 'NEW_CANDIDATE',
              title: '👤 New Candidate Applied!',
              senderName: app.applicant?.full_name || 'New Candidate',
              message: `${app.applicant?.full_name || 'A neighbor'} applied for "${app.task?.title || 'your gig'}". Tap to review.`,
              taskId: app.task_id,
              taskTitle: app.task?.title || 'Gig',
              otherUser: app.applicant,
            });
            break;
          }
        }
      }

      const updatedSet = new Set(state.notifiedCandidateAppIds);
      apps.forEach((a) => updatedSet.add(a.id));

      set({
        receivedApplications: apps,
        notifiedCandidateAppIds: updatedSet,
        hasLoadedReceivedApplicationsOnce: true,
      });
    } catch {
      // Silently catch to not disrupt UI
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

  cancelApplication: async (taskId: number, applicationId?: number) => {
    try {
      if (applicationId) {
        await apiClient.delete(`/tasks/applications/${applicationId}`);
      } else {
        await apiClient.delete(`/tasks/${taskId}/apply`);
      }

      set((state) => ({
        currentTask:
          state.currentTask?.id === taskId
            ? { ...state.currentTask, has_applied: false }
            : state.currentTask,
        myAppliedTasks: state.myAppliedTasks.filter(
          (a) => a.task_id !== taskId && (!applicationId || a.id !== applicationId)
        ),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to cancel application' });
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

