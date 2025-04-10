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
  searchUsers: async (searchTerm: string) => {
    const response = await api.get(`/api/users/search/?search=${encodeURIComponent(searchTerm)}`);
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

// Quiz option structure
export interface QuizOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
}

// Quiz question structure
export interface QuizQuestion {
  id?: number;
  question_text: string;
  question_type: "multiple_choice" | "true_false";
  options: QuizOption[];
}

// Quiz structure
export interface Quiz {
  id?: number;
  title: string;
  visible: boolean;
  questions: QuizQuestion[];
}

// Material structure
export interface Material {
  id?: number;
  title: string;
  file: File | string; // File for upload, string (URL) for retrieving
  visible: boolean;
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
  ticket_price: string | number; // Added ticket_price field
  organizers?: number[];
  speakers?: number[];
  attendees?: number[];
  has_unread_update?: boolean; // ✅ used for red dot
  organizers_details?: UserDetail[];
  speakers_details?: UserDetail[];
  attendees_details?: UserDetail[];
  updated_at?: string;
  quizzes?: Quiz[]; // Added quizzes
  materials?: Material[]; // Added materials
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
    // Create FormData for handling file uploads
    const formData = new FormData();
    
    // Add basic event information
    formData.append('title', eventData.title);
    formData.append('description', eventData.description);
    formData.append('date', eventData.date);
    formData.append('event_type', eventData.event_type);
    formData.append('ticket_price', String(eventData.ticket_price || '0.00'));
    
    // Add conditional fields
    if (eventData.location) {
      formData.append('location', eventData.location);
    }
    
    if (eventData.virtual_location) {
      formData.append('virtual_location', eventData.virtual_location);
    }
    
    // Add arrays of organizers and speakers
    if (eventData.organizers && eventData.organizers.length > 0) {
      eventData.organizers.forEach(org => {
        formData.append('organizers', String(org));
      });
    }
    
    if (eventData.speakers && eventData.speakers.length > 0) {
      eventData.speakers.forEach(speaker => {
        formData.append('speakers', String(speaker));
      });
    }
    
    // Add quizzes as JSON string
    if (eventData.quizzes && eventData.quizzes.length > 0) {
      // Create cleaned version of quizzes for backend
      const processedQuizzes = eventData.quizzes
        .filter(quiz => quiz.visible)
        .map(quiz => ({
          title: quiz.title,
          visible: quiz.visible,
          questions: quiz.questions.map(q => {
            // For multiple choice questions
            if (q.question_type === 'multiple_choice') {
              return {
                question_text: q.question_text,
                question_type: 'multiple_choice',
                options: q.options
              };
            }
            // For true/false questions 
            else {
              return {
                question_text: q.question_text,
                question_type: 'true_false',
                options: [
                  { option_text: 'True', is_correct: q.options[0].is_correct },
                  { option_text: 'False', is_correct: q.options[1].is_correct }
                ]
              };
            }
          })
        }));
      
      formData.append('quizzes', JSON.stringify(processedQuizzes));
    }
    
    // Add materials files and metadata
    if (eventData.materials && eventData.materials.length > 0) {
      // Add metadata
      const materialsMeta = eventData.materials.map(m => ({
        name: m.title,
        visible: m.visible
      }));
      
      formData.append('materials', JSON.stringify(materialsMeta));
      
      // Add files
      eventData.materials.forEach(material => {
        if (material.file && material.file instanceof File) {
          formData.append('files', material.file);
        }
      });
    }
    
    // Send the request with FormData
    const response = await api.post("/api/events/", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  updateEvent: async (id: number, eventData: Partial<EventData>): Promise<EventData> => {
    // Similar to createEvent, but for updates
    const formData = new FormData();
    
    // Add basic fields if they exist in the update data
    if (eventData.title !== undefined) formData.append('title', eventData.title);
    if (eventData.description !== undefined) formData.append('description', eventData.description);
    if (eventData.date !== undefined) formData.append('date', eventData.date);
    if (eventData.event_type !== undefined) formData.append('event_type', eventData.event_type);
    if (eventData.ticket_price !== undefined) formData.append('ticket_price', String(eventData.ticket_price));
    if (eventData.location !== undefined) formData.append('location', eventData.location || '');
    if (eventData.virtual_location !== undefined) formData.append('virtual_location', eventData.virtual_location || '');
    
    // Arrays
    if (eventData.organizers) {
      eventData.organizers.forEach(org => {
        formData.append('organizers', String(org));
      });
    }
    
    if (eventData.speakers) {
      eventData.speakers.forEach(speaker => {
        formData.append('speakers', String(speaker));
      });
    }
    
    // Quizzes
    if (eventData.quizzes) {
      const processedQuizzes = eventData.quizzes
        .filter(quiz => quiz.visible)
        .map(quiz => ({
          title: quiz.title,
          visible: quiz.visible,
          questions: quiz.questions.map(q => {
            if (q.question_type === 'multiple_choice') {
              return {
                question_text: q.question_text,
                question_type: 'multiple_choice',
                options: q.options
              };
            } else {
              return {
                question_text: q.question_text,
                question_type: 'true_false',
                options: [
                  { option_text: 'True', is_correct: q.options[0].is_correct },
                  { option_text: 'False', is_correct: q.options[1].is_correct }
                ]
              };
            }
          })
        }));
        
      formData.append('quizzes', JSON.stringify(processedQuizzes));
      
      // Flag for backend to know if we're replacing all quizzes
      formData.append('replace_quizzes', 'true');
    }
    
    // Materials
    if (eventData.materials) {
      // Materials metadata
      const materialsMeta = eventData.materials.map(m => ({
        name: m.title,
        visible: m.visible
      }));
      
      formData.append('materials', JSON.stringify(materialsMeta));
      
      // Materials files
      eventData.materials.forEach(material => {
        if (material.file && material.file instanceof File) {
          formData.append('files', material.file);
        }
      });
      
      // Flag for backend to know if we're replacing all materials
      formData.append('replace_materials', 'true');
    }
    
    const response = await api.put(`/api/events/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  deleteEvent: async (id: number) => {
    const response = await api.delete(`/api/events/${id}/`);
    return response.data;
  },
  // Mark viewed for red dot
  markEventAsViewed: async (id: number) => {
    const response = await api.post(`/api/events/${id}/mark-viewed/`);
    return response.data;
  },

  checkoutEvent: async (eventId) => {
    const response = await api.post(`/api/events/${eventId}/checkout/`);
    return response.data;
  }
};

// Quiz service
export const quizService = {
  getQuiz: async (id: number): Promise<Quiz> => {
    const response = await api.get(`/api/quizzes/${id}/`);
    return response.data;
  },
  deleteQuiz: async (id: number) => {
    const response = await api.delete(`/api/quizzes/${id}/`);
    return response.data;
  },
};

// Material service
export const materialService = {
  getMaterial: async (id: number): Promise<Material> => {
    const response = await api.get(`/api/materials/${id}/`);
    return response.data;
  },
  deleteMaterial: async (id: number) => {
    const response = await api.delete(`/api/materials/${id}/`);
    return response.data;
  },
};
export default api;