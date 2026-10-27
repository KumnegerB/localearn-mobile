import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { Task, TaskStatus, TaskApplication } from '../types';
import { useChatStore } from './useChatStore';

const TASKS_CACHE_KEY = '@localearn_cached_tasks';
const MY_POSTED_CACHE_KEY = '@localearn_cached_my_posted';
const MY_APPLIED_CACHE_KEY = '@localearn_cached_my_applied';

const updateTasksByIdMap = (newTasks: Task[], existing: Record<number, Task> = {}) => {
  const map = { ...existing };
  for (const t of newTasks) {
    if (t?.id) map[t.id] = t;
  }
  return map;
};

interface TaskFilter {
  category?: string;
  status?: TaskStatus;
  lat?: number;
  lng?: number;
  radius_km?: number;
}

interface TaskState {
  tasks: Task[];
  tasksById: Record<number, Task>;
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

  loadCachedTaskData: () => Promise<void>;
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
  tasksById: {},
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

  loadCachedTaskData: async () => {
    try {
      const [tasksRaw, postedRaw, appliedRaw] = await Promise.all([
        AsyncStorage.getItem(TASKS_CACHE_KEY),
        AsyncStorage.getItem(MY_POSTED_CACHE_KEY),
        AsyncStorage.getItem(MY_APPLIED_CACHE_KEY),
      ]);

      const updates: Partial<TaskState> = {};
      let initialMap: Record<number, Task> = { ...get().tasksById };

      if (tasksRaw) {
        const parsed = JSON.parse(tasksRaw);
        if (Array.isArray(parsed) && parsed.length > 0 && get().tasks.length === 0) {
          updates.tasks = parsed;
          initialMap = updateTasksByIdMap(parsed, initialMap);
        }
      }
      if (postedRaw) {
        const parsedPosted = JSON.parse(postedRaw);
        if (Array.isArray(parsedPosted) && parsedPosted.length > 0 && get().myPostedTasks.length === 0) {
          updates.myPostedTasks = parsedPosted;
          initialMap = updateTasksByIdMap(parsedPosted, initialMap);
        }
      }
      if (appliedRaw) {
        const parsedApplied = JSON.parse(appliedRaw);
        if (Array.isArray(parsedApplied) && parsedApplied.length > 0 && get().myAppliedTasks.length === 0) {
          updates.myAppliedTasks = parsedApplied;
        }
      }

      updates.tasksById = initialMap;
      set(updates);
    } catch {
      // Ignore cache load failure
    }
  },

  fetchTasks: async (filters = {}) => {
    // Stale-While-Revalidate: only show spinner if cache is completely empty
    const hasCached = get().tasks.length > 0;
    if (!hasCached) {
      set({ isLoading: true, error: null });
    }
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
      const newTasks = response.data;
      set((state) => ({
        tasks: newTasks,
        tasksById: updateTasksByIdMap(newTasks, state.tasksById),
        isLoading: false,
      }));
      AsyncStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(newTasks.slice(0, 50))).catch(() => {});
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to load tasks',
        isLoading: false,
      });
    }
  },

  fetchMyPostedTasks: async () => {
    const token = await AsyncStorage.getItem('@localearn_token');
    if (!token) {
      set({ myPostedTasks: [], isLoading: false });
      return;
    }

    const hasCached = get().myPostedTasks.length > 0;
    if (!hasCached) {
      set({ isLoading: true, error: null });
    }
    try {
      const response = await apiClient.get<Task[]>('/tasks/my-posted');
      const list = response.data;
      set((state) => ({
        myPostedTasks: list,
        tasksById: updateTasksByIdMap(list, state.tasksById),
        isLoading: false,
      }));
      AsyncStorage.setItem(MY_POSTED_CACHE_KEY, JSON.stringify(list)).catch(() => {});
    } catch (err: any) {
      if (err.response?.status === 401) {
        set({ myPostedTasks: [], isLoading: false });
        return;
      }
      set({ error: err.response?.data?.detail || 'Failed to fetch my posted jobs', isLoading: false });
    }
  },

  fetchMyAppliedTasks: async () => {
    const token = await AsyncStorage.getItem('@localearn_token');
    if (!token) {
      set({ myAppliedTasks: [], isLoading: false });
      return;
    }

    const hasCached = get().myAppliedTasks.length > 0;
    if (!hasCached) {
      set({ isLoading: true, error: null });
    }

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
      if (err.response?.status === 401) {
        set({ myAppliedTasks: [], isLoading: false });
        return;
      }
      set({ error: err.response?.data?.detail || 'Failed to fetch applied jobs', isLoading: false });
    }
  },

  fetchReceivedApplications: async () => {
    const token = await AsyncStorage.getItem('@localearn_token');
    if (!token) {
      set({ receivedApplications: [] });
      return;
    }

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
    const state = get();
    const cached =
      state.tasksById[id] ||
      state.tasks.find((t) => t.id === id) ||
      state.myPostedTasks.find((t) => t.id === id) ||
      (state.currentTask?.id === id ? state.currentTask : null);

    if (cached) {
      // Instant SWR: display cached task immediately with 0ms delay!
      set({ currentTask: cached, isLoading: false, error: null });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const response = await apiClient.get<Task>(`/tasks/${id}`);
      const freshTask = response.data;
      set((s) => ({
        currentTask: freshTask,
        tasksById: { ...s.tasksById, [id]: freshTask },
        isLoading: false,
      }));
    } catch (err: any) {
      if (!cached) {
        set({
          error: err.response?.data?.detail || 'Failed to load task details',
          isLoading: false,
        });
      }
    }
  },

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<Task>('/tasks/', taskData);
      set((state) => ({
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

// Automatically hydrate cached tasks on boot
useTaskStore.getState().loadCachedTaskData();

