
import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/components/SocketProvider';
import UserAvatar from './UserAvatar';
import MessageInput from './MessageInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Info, MoreVertical, Users } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from '@/types';

const ChatWindow: React.FC = () => {
  const { state, fetchMessages, sendMessage } = useChat();
  const { state: authState } = useAuth();
  const { socket } = useSocket();
  const [message, setMessage] = useState('');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (state.selectedChat) {
      fetchMessages(state.selectedChat._id);
      
      // Join the chat room via socket
      if (socket) {
        socket.emit('join chat', state.selectedChat._id);
      }
    }
  }, [state.selectedChat, socket]);
  
  // Set up socket typing event listeners
  useEffect(() => {
    if (!socket) return;
    
    socket.on('typing', (room) => {
      if (state.selectedChat?._id === room) {
        setIsTyping(true);
      }
    });
    
    socket.on('stop typing', (room) => {
      if (state.selectedChat?._id === room) {
        setIsTyping(false);
      }
    });
    
    return () => {
      socket.off('typing');
      socket.off('stop typing');
    };
  }, [socket, state.selectedChat]);
  
  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleTyping = () => {
    if (!socket || !state.selectedChat) return;
    
    // If user was already typing, clear the timeout
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Emit typing event
    socket.emit('typing', state.selectedChat._id);
    
    // Set timeout to stop typing after 3 seconds
    const timeout = setTimeout(() => {
      socket.emit('stop typing', state.selectedChat._id);
    }, 3000);
    
    setTypingTimeout(timeout);
  };
  
  const handleSendMessage = () => {
    if (message.trim()) {
      // Clear typing status
      if (socket && typingTimeout) {
        clearTimeout(typingTimeout);
        socket.emit('stop typing', state.selectedChat?._id);
      }
      
      sendMessage(message);
      setMessage('');
    }
  };
  
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date: Date) => {
    const messageDate = new Date(date);
    const today = new Date();
    
    // Check if same day
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise return date
    return messageDate.toLocaleDateString();
  };
  
  const getChatPartner = (): User | undefined => {
    if (!state.selectedChat || !authState.user) return undefined;
    
    if (state.selectedChat.isGroupChat) return undefined;
    
    return state.selectedChat.users.find(u => u._id !== authState.user?._id);
  };
  
  const renderDateSeparator = (date: Date, index: number) => {
    if (index === 0) return true;
    
    const prevDate = new Date(state.messages[index - 1].timestamp);
    const currDate = new Date(date);
    
    return prevDate.toDateString() !== currDate.toDateString();
  };
  
  if (!state.selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center p-6 max-w-md">
          <Users className="mx-auto h-12 w-12 text-talkify-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Welcome to Talkify</h3>
          <p className="text-muted-foreground">
            Select a chat from the sidebar or start a new conversation to begin messaging.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Chat header */}
      <div className="py-3 px-4 border-b flex items-center justify-between bg-white dark:bg-slate-950">
        <div className="flex items-center">
          {state.selectedChat.isGroupChat ? (
            <div className="w-10 h-10 rounded-full bg-talkify-secondary text-white flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          ) : (
            <UserAvatar 
              user={getChatPartner() || state.selectedChat.users[0]} 
              showStatus 
            />
          )}
          
          <div className="ml-3">
            <div className="font-medium">{state.selectedChat.chatName}</div>
            <div className="text-xs text-muted-foreground">
              {state.selectedChat.isGroupChat 
                ? `${state.selectedChat.users.length} members`
                : getChatPartner()?.isOnline ? 'Online' : 'Offline'
              }
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsInfoOpen(true)}
          >
            <Info className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Search in Chat</DropdownMenuItem>
              <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
              {state.selectedChat.isGroupChat && (
                <DropdownMenuItem>Leave Group</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500">
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-slate-900">
        <div className="space-y-4">
          {state.messages.map((msg, index) => (
            <React.Fragment key={msg._id}>
              {renderDateSeparator(msg.timestamp, index) && (
                <div className="flex justify-center my-4">
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-md">
                    {formatDate(msg.timestamp)}
                  </span>
                </div>
              )}
              
              <div className={`flex items-start ${msg.sender._id === authState.user?._id ? 'justify-end' : ''}`}>
                {msg.sender._id !== authState.user?._id && (
                  <UserAvatar user={msg.sender} size="sm" className="mt-1" />
                )}
                
                <div className={`flex flex-col ${msg.sender._id === authState.user?._id ? 'items-end' : 'items-start ml-2'}`}>
                  {state.selectedChat.isGroupChat && msg.sender._id !== authState.user?._id && (
                    <span className="text-xs text-muted-foreground ml-1 mb-1">
                      {msg.sender.name}
                    </span>
                  )}
                  
                  <div className={`message-bubble ${
                    msg.sender._id === authState.user?._id 
                      ? 'message-bubble-sent' 
                      : 'message-bubble-received'
                  }`}>
                    {msg.content}
                  </div>
                  
                  <span className="text-xs text-muted-foreground mt-1 mx-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Typing indicator */}
      {isTyping && (
        <div className="px-4 py-2 text-xs text-muted-foreground italic">
          Someone is typing...
        </div>
      )}
      
      {/* Message input */}
      <MessageInput 
        value={message}
        onChange={setMessage}
        onSend={handleSendMessage}
        onTyping={handleTyping}
      />
      
      {/* Chat info dialog */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{state.selectedChat.chatName}</DialogTitle>
            <DialogDescription>
              {state.selectedChat.isGroupChat 
                ? 'Group chat details' 
                : 'Chat with ' + state.selectedChat.chatName
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {state.selectedChat.isGroupChat && (
              <div>
                <h4 className="text-sm font-medium mb-2">Admin</h4>
                <div className="flex items-center p-2 rounded-md">
                  <UserAvatar user={state.selectedChat.admin || state.selectedChat.users[0]} size="sm" />
                  <div className="ml-2">
                    <div className="text-sm font-medium">
                      {state.selectedChat.admin?.name || state.selectedChat.users[0].name}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium mb-2">
                {state.selectedChat.isGroupChat ? 'Members' : 'Participant'}
              </h4>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {state.selectedChat.users.map(user => (
                  <div key={user._id} className="flex items-center p-2 rounded-md">
                    <UserAvatar user={user} size="sm" showStatus />
                    <div className="ml-2">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {state.selectedChat.isGroupChat && (
              <div>
                <h4 className="text-sm font-medium mb-2">Created</h4>
                <div className="text-sm text-muted-foreground">
                  {new Date(state.selectedChat.createdAt).toLocaleDateString()} at{' '}
                  {new Date(state.selectedChat.createdAt).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatWindow;
