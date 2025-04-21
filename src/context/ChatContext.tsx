
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ChatState, Chat, Message, User } from '@/types';
import { useSocket } from '@/components/SocketProvider';
import { chatService, messageService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  | { type: 'CLEAR_CHAT' }
  | { type: 'UPDATE_CHAT'; payload: Chat };

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
    case 'UPDATE_CHAT': {
      const updatedChats = state.chats.map(chat => 
        chat._id === action.payload._id ? action.payload : chat
      );
      return {
        ...state,
        chats: updatedChats,
        selectedChat: state.selectedChat?._id === action.payload._id ? action.payload : state.selectedChat
      };
    }
    case 'CLEAR_CHAT':
      return {
        ...initialState
      };
    default:
      return state;
  }
};

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket } = useSocket();
  const { state: authState } = useAuth();
  const { toast } = useToast();
  
  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !authState.user) return;
    
    // Listen for incoming messages
    socket.on('message received', (newMessageReceived: Message) => {
      // If chat is open, add message to state
      if (state.selectedChat?._id === newMessageReceived.chat) {
        dispatch({ type: 'NEW_MESSAGE', payload: newMessageReceived });
      } else {
        // Show notification for messages in other chats
        toast({
          title: `New message from ${newMessageReceived.sender.name}`,
          description: newMessageReceived.content.length > 50 
            ? `${newMessageReceived.content.substring(0, 47)}...` 
            : newMessageReceived.content,
        });
      }
      
      // Update chats list to reflect new messages
      fetchChats();
    });
    
    // Clean up
    return () => {
      socket.off('message received');
    };
  }, [socket, state.selectedChat, authState.user]);

  const fetchChats = async () => {
    try {
      dispatch({ type: 'FETCH_CHATS_REQUEST' });
      const data = await chatService.getChats();
      dispatch({ type: 'FETCH_CHATS_SUCCESS', payload: data });
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      dispatch({ type: 'FETCH_CHATS_FAILURE', payload: 'Failed to fetch chats' });
    }
  };

  const selectChat = (chat: Chat) => {
    dispatch({ type: 'SELECT_CHAT', payload: chat });
    
    // Join chat room via socket
    if (socket) {
      socket.emit('join chat', chat._id);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      dispatch({ type: 'FETCH_MESSAGES_REQUEST' });
      const data = await messageService.getMessages(chatId);
      dispatch({ type: 'FETCH_MESSAGES_SUCCESS', payload: data });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      dispatch({ type: 'FETCH_MESSAGES_FAILURE', payload: 'Failed to fetch messages' });
    }
  };

  const sendMessage = async (content: string) => {
    if (!state.selectedChat) return;
    
    try {
      const newMessage = await messageService.sendMessage(content, state.selectedChat._id);
      
      // Update state
      dispatch({ type: 'NEW_MESSAGE', payload: newMessage });
      
      // If socket is available, emit the message
      if (socket) {
        socket.emit('new message', newMessage);
      }
      
      // Refresh chats to update latest message
      fetchChats();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const createChat = async (userId: string) => {
    try {
      const newChat = await chatService.createChat(userId);
      
      // Update chats list
      await fetchChats();
      
      // Select the new chat
      selectChat(newChat);
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create chat. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const createGroupChat = async (name: string, userIds: string[]) => {
    try {
      const newChat = await chatService.createGroupChat(name, userIds);
      
      // Update chats list
      await fetchChats();
      
      // Select the new chat
      selectChat(newChat);
      
      toast({
        title: 'Success',
        description: `Group chat "${name}" created successfully.`
      });
    } catch (error) {
      console.error('Failed to create group chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create group chat. Please try again.',
        variant: 'destructive'
      });
    }
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
