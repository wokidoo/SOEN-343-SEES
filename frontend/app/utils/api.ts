// app/utils/api.ts - Updated with Event Service

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// User service functions
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

// Event types based on your Django model
export interface EventData {
  title: string;
  description: string;
  date: string; // ISO format
  event_type: "in_person" | "virtual" | "hybrid";
  location?: string;
  virtual_location?: string;
  organizers?: number[];
  speakers?: number[];
  attendees?: number[];
}

// Event service functions
export const eventService = {
  getEvents: async () => {
    const response = await api.get("/api/events/");
    return response.data;
  },

  getEvent: async (id: number) => {
    const response = await api.get(`/api/events/${id}/`);
    return response.data;
  },

  createEvent: async (eventData: EventData) => {
    const response = await api.post("/api/events/", eventData);
    return response.data;
  },

  updateEvent: async (id: number, eventData: Partial<EventData>) => {
    const response = await api.put(`/api/events/${id}/`, eventData);
    return response.data;
  },

  deleteEvent: async (id: number) => {
    const response = await api.delete(`/api/events/${id}/`);
    return response.data;
  },
};

// User type definition
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

// Export default API instance
export default api;
