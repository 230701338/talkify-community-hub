
import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Message, User } from '@/types';
import { format } from 'date-fns';
import { 
  Info, 
  MoreVertical, 
  Send, 
  Smile,
  ArrowLeft 
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import { useSocket } from './SocketProvider';
import MessageInput from './MessageInput';

const ChatWindow: React.FC = () => {
  const { state: chatState, fetchMessages, sendMessage, selectChat } = useChat();
  const { state: authState } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch messages when a chat is selected
  useEffect(() => {
    if (chatState.selectedChat) {
      fetchMessages(chatState.selectedChat._id);
    }
  }, [chatState.selectedChat]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);
  
  // Set up socket typing listeners
  useEffect(() => {
    if (!socket) return;
    
    socket.on('typing', (room: string) => {
      if (chatState.selectedChat?._id === room) {
        setIsTyping(true);
      }
    });
    
    socket.on('stop typing', (room: string) => {
      if (chatState.selectedChat?._id === room) {
        setIsTyping(false);
      }
    });
    
    return () => {
      socket.off('typing');
      socket.off('stop typing');
    };
  }, [socket, chatState.selectedChat]);
  
  const typingHandler = () => {
    if (!socket || !chatState.selectedChat) return;
    
    // If not already typing, emit typing event
    socket.emit('typing', chatState.selectedChat._id);
    
    // Clear existing timeout
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Set new timeout
    const timeout = setTimeout(() => {
      socket.emit('stop typing', chatState.selectedChat._id);
    }, 3000);
    
    setTypingTimeout(timeout);
  };
  
  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    sendMessage(content);
    setMessage('');
    
    // Stop typing indicator
    if (socket && chatState.selectedChat) {
      socket.emit('stop typing', chatState.selectedChat._id);
    }
  };
  
  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };
  
  const getChatName = () => {
    if (!chatState.selectedChat) return '';
    
    if (chatState.selectedChat.isGroupChat) {
      return chatState.selectedChat.chatName;
    }
    
    // For one-on-one chats, show the other user's name
    const otherUser = chatState.selectedChat.users.find(
      u => u._id !== authState.user?._id
    );
    
    return otherUser?.name || '';
  };
  
  const getChatAvatar = () => {
    if (!chatState.selectedChat || chatState.selectedChat.isGroupChat) {
      return null;
    }
    
    // For one-on-one chats, show the other user's avatar
    const otherUser = chatState.selectedChat.users.find(
      u => u._id !== authState.user?._id
    );
    
    return otherUser;
  };
  
  if (!chatState.selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <div className="max-w-md text-center p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome to Talkify</h2>
          <p className="text-muted-foreground mb-4">
            Select a chat or start a new conversation to begin messaging.
          </p>
        </div>
      </div>
    );
  }

  const getSenderUser = (message: Message): User => {
    return message.sender;
  };
  
  const isSameUser = (messages: Message[], m: Message, i: number): boolean => {
    return i > 0 && messages[i - 1].sender._id === m.sender._id;
  };
  
  const formatTime = (date: Date | string): string => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return format(date, 'h:mm a');
  };
  
  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat header */}
      <div className="px-4 py-3 border-b flex items-center">
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden mr-2"
          onClick={() => selectChat(null)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center">
          {getChatAvatar() ? (
            <UserAvatar 
              user={getChatAvatar() as User} 
              size="sm" 
              showStatus={true}
              isOnline={isUserOnline(getChatAvatar()?._id || '')}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-talkify-secondary text-white flex items-center justify-center">
              <Info className="h-5 w-5" />
            </div>
          )}
          <div className="ml-3">
            <div className="font-medium">{getChatName()}</div>
            {chatState.selectedChat.isGroupChat ? (
              <div className="text-xs text-muted-foreground">
                {chatState.selectedChat.users.length} members
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                {isUserOnline(getChatAvatar()?._id || '') ? 'Online' : 'Offline'}
              </div>
            )}
          </div>
        </div>
        <div className="ml-auto">
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {chatState.messages.map((msg, i) => {
            const isSender = msg.sender._id === authState.user?._id;
            const showAvatar = !isSameUser(chatState.messages, msg, i);
            
            return (
              <div 
                key={msg._id} 
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`flex ${isSender ? 'flex-row-reverse' : 'flex-row'} max-w-[70%]`}
                >
                  {!isSender && showAvatar && (
                    <div className="flex flex-col justify-end mb-1 mr-2">
                      <UserAvatar user={getSenderUser(msg)} size="sm" />
                    </div>
                  )}
                  <div>
                    {!isSender && showAvatar && (
                      <div className="text-xs text-muted-foreground mb-1 ml-1">
                        {getSenderUser(msg).name}
                      </div>
                    )}
                    <div 
                      className={`px-4 py-2 rounded-lg ${
                        isSender 
                          ? 'bg-talkify-primary text-white rounded-tr-none' 
                          : 'bg-muted rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div 
                      className={`text-xs text-muted-foreground mt-1 ${
                        isSender ? 'text-right' : 'text-left'
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Message input */}
      <div className="p-4 border-t">
        <MessageInput onSendMessage={handleSendMessage} onTyping={typingHandler} />
      </div>
    </div>
  );
};

export default ChatWindow;
