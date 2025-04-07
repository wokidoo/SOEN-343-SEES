import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach token from localStorage to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
  }
  return config;
});

// User service
export const userService = {
  register: async (userData: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password2: string;
  }) => {
    const response = await api.post("/api/users/", userData);
    return response.data;
  },
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post("/api/login/", credentials);
    return response.data;
  },
};

// User structure
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

// Enhanced User interface for detailed user info in events
export interface UserDetail extends User {
  full_name?: string;
}

// Event model structure
export interface EventData {
  id?: number;
  title: string;
  description: string;
  date: string;
  event_type: "in_person" | "virtual" | "hybrid";
  location?: string;
  virtual_location?: string;
  organizers?: number[];
  speakers?: number[];
  attendees?: number[];
  has_unread_update?: boolean; // ✅ used for red dot
  organizers_details?: UserDetail[];
  speakers_details?: UserDetail[];
  attendees_details?: UserDetail[];
  updated_at?: string;
}

// Events response interface for categorized events
export interface EventsResponse {
  organized_events: EventData[];
  speaking_events: EventData[];
  attending_events: EventData[];
}

// Event service
export const eventService = {
  getEvents: async (): Promise<EventsResponse> => {
    const response = await api.get("/api/events/");
    return response.data;
  },
  getEvent: async (id: number): Promise<EventData> => {
    const response = await api.get(`/api/events/${id}/`);
    return response.data;
  },
  createEvent: async (eventData: EventData): Promise<EventData> => {
    const response = await api.post("/api/events/", eventData);
    return response.data;
  },
  updateEvent: async (id: number, eventData: Partial<EventData>): Promise<EventData> => {
    const response = await api.put(`/api/events/${id}/`, eventData);
    return response.data;
  },
  deleteEvent: async (id: number) => {
    const response = await api.delete(`/api/events/${id}/`);
    return response.data;
  },
  // mark viewed for red dot
  markEventAsViewed: async (id: number) => {
    const response = await api.post(`/api/events/${id}/mark-viewed/`);
    return response.data;
  },
};

export default api;