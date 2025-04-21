
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
}

export interface Message {
  _id: string;
  sender: User;
  content: string;
  timestamp: Date;
  chat: string;
}

export interface Chat {
  _id: string;
  chatName: string;
  isGroupChat: boolean;
  users: User[];
  admin?: User;
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ChatState {
  chats: Chat[];
  selectedChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
