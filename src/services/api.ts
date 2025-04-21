
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  getUser: async () => {
    const response = await api.get('/auth/user');
    return response.data;
  }
};

// User services
export const userService = {
  searchUsers: async (search: string = '') => {
    const response = await api.get(`/users?search=${encodeURIComponent(search)}`);
    console.log('Search users response:', response.data);
    return response.data;
  },
  
  getOnlineUsers: async () => {
    const response = await api.get('/users/online');
    console.log('Online users response:', response.data);
    return response.data;
  },
  
  getAllUsers: async () => {
    const response = await api.get('/users');
    console.log('All users response:', response.data);
    return response.data;
  },
  
  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  updateProfile: async (userData: { name?: string; email?: string; password?: string }) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  }
};

// Chat services
export const chatService = {
  getChats: async () => {
    const response = await api.get('/chats');
    return response.data;
  },
  
  createChat: async (userId: string) => {
    const response = await api.post('/chats', { userId });
    return response.data;
  },
  
  createGroupChat: async (name: string, users: string[]) => {
    const response = await api.post('/chats/group', { name, users });
    return response.data;
  },
  
  renameGroup: async (chatId: string, chatName: string) => {
    const response = await api.put('/chats/rename', { chatId, chatName });
    return response.data;
  },
  
  addToGroup: async (chatId: string, userId: string) => {
    const response = await api.put('/chats/add', { chatId, userId });
    return response.data;
  },
  
  removeFromGroup: async (chatId: string, userId: string) => {
    const response = await api.put('/chats/remove', { chatId, userId });
    return response.data;
  },
  
  getChatById: async (chatId: string) => {
    const response = await api.get(`/chats/${chatId}`);
    return response.data;
  }
};

// Message services
export const messageService = {
  getMessages: async (chatId: string) => {
    const response = await api.get(`/messages/${chatId}`);
    return response.data;
  },
  
  sendMessage: async (content: string, chatId: string) => {
    const response = await api.post('/messages', { content, chatId });
    return response.data;
  }
};

export default api;
