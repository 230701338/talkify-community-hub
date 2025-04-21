
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ChatState, Chat, Message, User } from '@/types';
import { useSocket } from '@/components/SocketProvider';

// Define action types
type ChatAction = 
  | { type: 'FETCH_CHATS_REQUEST' }
  | { type: 'FETCH_CHATS_SUCCESS'; payload: Chat[] }
  | { type: 'FETCH_CHATS_FAILURE'; payload: string }
  | { type: 'SELECT_CHAT'; payload: Chat }
  | { type: 'FETCH_MESSAGES_REQUEST' }
  | { type: 'FETCH_MESSAGES_SUCCESS'; payload: Message[] }
  | { type: 'FETCH_MESSAGES_FAILURE'; payload: string }
  | { type: 'NEW_MESSAGE'; payload: Message }
  | { type: 'CLEAR_CHAT' };

// Chat context interface
interface ChatContextType {
  state: ChatState;
  fetchChats: () => Promise<void>;
  selectChat: (chat: Chat) => void;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  createChat: (userId: string) => Promise<void>;
  createGroupChat: (name: string, users: string[]) => Promise<void>;
  clearChat: () => void;
}

// Initial state
const initialState: ChatState = {
  chats: [],
  selectedChat: null,
  messages: [],
  isLoading: false,
  error: null
};

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Reducer function
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'FETCH_CHATS_REQUEST':
    case 'FETCH_MESSAGES_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'FETCH_CHATS_SUCCESS':
      return {
        ...state,
        chats: action.payload,
        isLoading: false,
        error: null
      };
    case 'FETCH_MESSAGES_SUCCESS':
      return {
        ...state,
        messages: action.payload,
        isLoading: false,
        error: null
      };
    case 'FETCH_CHATS_FAILURE':
    case 'FETCH_MESSAGES_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'SELECT_CHAT':
      return {
        ...state,
        selectedChat: action.payload,
        messages: []
      };
    case 'NEW_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    case 'CLEAR_CHAT':
      return {
        ...initialState
      };
    default:
      return state;
  }
};

// Mock data
const mockUsers: User[] = [
  { _id: '1', name: 'John Doe', email: 'john@example.com', isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john' },
  { _id: '2', name: 'Jane Smith', email: 'jane@example.com', isOnline: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane' },
  { _id: '3', name: 'Bob Johnson', email: 'bob@example.com', isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob' },
  { _id: '4', name: 'Alice Williams', email: 'alice@example.com', isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice' },
];

const mockChats: Chat[] = [
  {
    _id: '1',
    chatName: 'Jane Smith',
    isGroupChat: false,
    users: [mockUsers[0], mockUsers[1]],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-05'),
  },
  {
    _id: '2',
    chatName: 'Bob Johnson',
    isGroupChat: false,
    users: [mockUsers[0], mockUsers[2]],
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2023-01-15'),
  },
  {
    _id: '3',
    chatName: 'Project Team',
    isGroupChat: true,
    users: [mockUsers[0], mockUsers[1], mockUsers[2]],
    admin: mockUsers[0],
    createdAt: new Date('2023-01-20'),
    updatedAt: new Date('2023-01-25'),
  }
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      _id: '101',
      sender: mockUsers[1],
      content: 'Hey, how are you?',
      timestamp: new Date('2023-01-02T10:00:00'),
      chat: '1'
    },
    {
      _id: '102',
      sender: mockUsers[0],
      content: 'I\'m good, thanks! How about you?',
      timestamp: new Date('2023-01-02T10:05:00'),
      chat: '1'
    },
    {
      _id: '103',
      sender: mockUsers[1],
      content: 'Doing great! Working on a new project.',
      timestamp: new Date('2023-01-02T10:10:00'),
      chat: '1'
    }
  ],
  '2': [
    {
      _id: '201',
      sender: mockUsers[2],
      content: 'Did you check that document I sent?',
      timestamp: new Date('2023-01-11T14:00:00'),
      chat: '2'
    },
    {
      _id: '202',
      sender: mockUsers[0],
      content: 'Yes, I did. It looks good!',
      timestamp: new Date('2023-01-11T14:15:00'),
      chat: '2'
    }
  ],
  '3': [
    {
      _id: '301',
      sender: mockUsers[0],
      content: 'Welcome to the project team!',
      timestamp: new Date('2023-01-21T09:00:00'),
      chat: '3'
    },
    {
      _id: '302',
      sender: mockUsers[1],
      content: 'Thanks! Excited to work with everyone.',
      timestamp: new Date('2023-01-21T09:05:00'),
      chat: '3'
    },
    {
      _id: '303',
      sender: mockUsers[2],
      content: 'Let\'s get started!',
      timestamp: new Date('2023-01-21T09:10:00'),
      chat: '3'
    }
  ]
};

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket } = useSocket();
  
  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Listen for incoming messages
    socket.on('message received', (newMessageReceived) => {
      // If chat is open, add message to state
      if (state.selectedChat?._id === newMessageReceived.chat._id) {
        dispatch({ type: 'NEW_MESSAGE', payload: newMessageReceived });
      }
      
      // TODO: Show notification for messages in other chats
    });
    
    // Clean up
    return () => {
      socket.off('message received');
    };
  }, [socket, state.selectedChat]);

  // Mock functions
  const fetchChats = async () => {
    try {
      dispatch({ type: 'FETCH_CHATS_REQUEST' });
      // Mock API call
      setTimeout(() => {
        dispatch({ type: 'FETCH_CHATS_SUCCESS', payload: mockChats });
      }, 500);
    } catch (error) {
      dispatch({ type: 'FETCH_CHATS_FAILURE', payload: 'Failed to fetch chats' });
    }
  };

  const selectChat = (chat: Chat) => {
    dispatch({ type: 'SELECT_CHAT', payload: chat });
  };

  const fetchMessages = async (chatId: string) => {
    try {
      dispatch({ type: 'FETCH_MESSAGES_REQUEST' });
      // Mock API call
      setTimeout(() => {
        const messages = mockMessages[chatId] || [];
        dispatch({ type: 'FETCH_MESSAGES_SUCCESS', payload: messages });
      }, 500);
    } catch (error) {
      dispatch({ type: 'FETCH_MESSAGES_FAILURE', payload: 'Failed to fetch messages' });
    }
  };

  const sendMessage = async (content: string) => {
    if (!state.selectedChat) return;
    
    try {
      // Mock sending message
      const newMessage: Message = {
        _id: Math.random().toString(36).substring(7),
        sender: mockUsers[0], // Current user
        content,
        timestamp: new Date(),
        chat: state.selectedChat._id
      };
      
      // Add to mock messages
      mockMessages[state.selectedChat._id] = [
        ...(mockMessages[state.selectedChat._id] || []),
        newMessage
      ];
      
      // Update state
      dispatch({ type: 'NEW_MESSAGE', payload: newMessage });
      
      // If socket is available, emit the message
      if (socket) {
        socket.emit('new message', {
          ...newMessage,
          chat: state.selectedChat
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const createChat = async (userId: string) => {
    // Find the user
    const user = mockUsers.find(u => u._id === userId);
    if (!user) return;
    
    // Check if chat already exists
    const existingChat = mockChats.find(c => 
      !c.isGroupChat && c.users.some(u => u._id === userId)
    );
    
    if (existingChat) {
      selectChat(existingChat);
      return;
    }
    
    // Create new chat
    const newChat: Chat = {
      _id: Math.random().toString(36).substring(7),
      chatName: user.name,
      isGroupChat: false,
      users: [mockUsers[0], user], // Current user and selected user
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to mock chats
    mockChats.push(newChat);
    
    // Update state
    dispatch({ type: 'FETCH_CHATS_SUCCESS', payload: [...mockChats] });
    selectChat(newChat);
  };

  const createGroupChat = async (name: string, userIds: string[]) => {
    // Find the users
    const users = [
      mockUsers[0], // Current user
      ...mockUsers.filter(u => userIds.includes(u._id))
    ];
    
    // Create new group chat
    const newChat: Chat = {
      _id: Math.random().toString(36).substring(7),
      chatName: name,
      isGroupChat: true,
      users,
      admin: mockUsers[0], // Current user is admin
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to mock chats
    mockChats.push(newChat);
    
    // Update state
    dispatch({ type: 'FETCH_CHATS_SUCCESS', payload: [...mockChats] });
    selectChat(newChat);
  };

  const clearChat = () => {
    dispatch({ type: 'CLEAR_CHAT' });
  };

  return (
    <ChatContext.Provider value={{ 
      state, 
      fetchChats, 
      selectChat, 
      fetchMessages, 
      sendMessage, 
      createChat, 
      createGroupChat, 
      clearChat 
    }}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
