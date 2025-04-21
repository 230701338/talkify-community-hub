
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { Message } from '@/types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { state: authState } = useAuth();
  
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      // Initialize socket connection
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);
      
      // Socket event listeners
      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected');
        
        // Set up the user in the socket
        newSocket.emit('setup', authState.user);
        
        // Let the server know this user is online
        newSocket.emit('user online', authState.user?._id);
      });
      
      newSocket.on('connected', () => {
        console.log('Socket connected to server');
      });
      
      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });
      
      // Handle online users
      newSocket.on('get online users', (onlineUserIds: string[]) => {
        console.log('Received online users:', onlineUserIds);
        setOnlineUsers(new Set(onlineUserIds));
      });
      
      newSocket.on('user status', ({ userId, status }) => {
        console.log(`User ${userId} is now ${status}`);
        if (status === 'online') {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(userId);
            return newSet;
          });
        } else {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      });
      
      // Cleanup on unmount
      return () => {
        if (newSocket) {
          newSocket.emit('user offline', authState.user?._id);
          newSocket.disconnect();
        }
      };
    }
  }, [authState.isAuthenticated, authState.user]);
  
  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
