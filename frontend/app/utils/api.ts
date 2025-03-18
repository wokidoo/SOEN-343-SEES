// app/utils/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User service functions
export const userService = {
  register: async (userData: {
    email: string;
    first_name: string;
    last_name: string;
  }) => {
    const response = await api.post('/api/users/', userData);
    return response.data;
  },
  
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/api/login/', credentials);
    return response.data;
  },
};

export default api;