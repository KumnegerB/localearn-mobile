export interface User {
  id: number;
  email: string;
  full_name: string;
  bio?: string | null;
  skills?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  rating: number;
  rating_count: number;
  created_at: string;
}

export type TaskStatus = 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';

export interface Task {
  id: number;
  title: string;
  description: string;
  budget: number;
  currency?: string;
  category: string;
  status: TaskStatus;
  location_name?: string | null;
  latitude: number;
  longitude: number;
  images: string[];
  creator_id: number;
  helper_id?: number | null;
  creator?: User;
  helper?: User;
  created_at: string;
  updated_at?: string;
  distance_km?: number | null;
}

export interface Review {
  id: number;
  task_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment?: string | null;
  created_at: string;
  reviewer?: User;
}

export interface Message {
  id: number;
  task_id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: number;
    full_name: string;
    avatar_url?: string | null;
  };
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

