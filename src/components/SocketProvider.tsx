
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
        newSocket.emit('setup', authState.user);
        newSocket.emit('user online', authState.user?._id);
      });
      
      newSocket.on('connected', () => {
        console.log('Socket connected');
      });
      
      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });
      
      newSocket.on('user status', ({ userId, status }) => {
        if (status === 'online') {
          setOnlineUsers(prev => new Set(prev).add(userId));
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
