
import React, { useEffect, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from './UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Chat, User } from '@/types';
import {
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Users,
  Loader2
} from 'lucide-react';
import { userService } from '@/services/api';
import { useSocket } from '@/components/SocketProvider';
import { useToast } from '@/hooks/use-toast';

const Sidebar: React.FC = () => {
  const { state: chatState, fetchChats, selectChat, createChat, createGroupChat } = useChat();
  const { state: authState, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);
  
  // Debounced search for users
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (userSearchTerm.trim()) {
        searchUsers(userSearchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchTerm]);

  const searchUsers = async (search: string) => {
    if (search.trim() === '') return;
    
    try {
      setIsSearching(true);
      const results = await userService.searchUsers(search);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    selectChat(chat);
  };

  const handleCreateChat = async (userId: string) => {
    setIsSubmitting(true);
    
    try {
      await createChat(userId);
      setIsCreateChatOpen(false);
      setUserSearchTerm('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create chat. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGroup = async () => {
    if (newGroupName.trim() === '' || selectedUsers.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      await createGroupChat(newGroupName, selectedUsers);
      setIsCreateGroupOpen(false);
      setNewGroupName('');
      setSelectedUsers([]);
      setUserSearchTerm('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error creating group chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create group chat. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserSelect = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  const filteredChats = chatState.chats.filter(chat => 
    chat.chatName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChatName = (chat: Chat) => {
    if (chat.isGroupChat) return chat.chatName;
    
    // For one-on-one chats, show the other user's name
    const otherUser = chat.users.find(u => u._id !== authState.user?._id);
    return otherUser?.name || chat.chatName;
  };

  const isUserOnline = (chat: Chat) => {
    if (chat.isGroupChat) return false;
    
    const otherUser = chat.users.find(u => u._id !== authState.user?._id);
    return otherUser ? onlineUsers.has(otherUser._id) : false;
  };

  return (
    <div className="w-72 h-screen border-r bg-white dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-talkify-primary">Talkify</h1>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Chat actions */}
      <div className="p-4 border-b flex justify-between">
        <Dialog open={isCreateChatOpen} onOpenChange={setIsCreateChatOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 mr-2">
              <MessageCircle className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a New Chat</DialogTitle>
              <DialogDescription>
                Search for users to start a conversation.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {searchResults.map(user => (
                    <div 
                      key={user._id}
                      className="flex items-center p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      onClick={() => handleCreateChat(user._id)}
                    >
                      <UserAvatar user={user} size="sm" showStatus />
                      <span className="ml-2">{user.name}</span>
                    </div>
                  ))}
                </div>
              ) : userSearchTerm ? (
                <p className="text-center text-sm text-muted-foreground py-2">
                  No users found. Try a different search term.
                </p>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group Chat</DialogTitle>
              <DialogDescription>
                Create a group chat to message multiple people at once.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="groupName" className="text-sm font-medium">
                  Group Name
                </label>
                <Input
                  id="groupName"
                  placeholder="Enter group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Users</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users to add..."
                    className="pl-8"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {selectedUsers.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selected Users ({selectedUsers.length})</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(userId => {
                      const user = searchResults.find(u => u._id === userId);
                      return user ? (
                        <div key={user._id} className="bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1 text-xs flex items-center">
                          <span>{user.name}</span>
                          <button
                            className="ml-2 text-gray-500 hover:text-gray-700"
                            onClick={() => toggleUserSelect(user._id)}
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {searchResults.map(user => (
                    <div 
                      key={user._id}
                      className={`flex items-center p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                        selectedUsers.includes(user._id) ? "bg-slate-100 dark:bg-slate-800" : ""
                      }`}
                      onClick={() => toggleUserSelect(user._id)}
                    >
                      <UserAvatar user={user} size="sm" showStatus />
                      <span className="ml-2">{user.name}</span>
                      {selectedUsers.includes(user._id) && (
                        <div className="ml-auto w-4 h-4 bg-talkify-primary rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : userSearchTerm ? (
                <p className="text-center text-sm text-muted-foreground py-2">
                  No users found. Try a different search term.
                </p>
              ) : null}
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleCreateGroup}
                disabled={newGroupName.trim() === '' || selectedUsers.length === 0 || isSubmitting}
                className="bg-talkify-primary hover:bg-talkify-hover"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Chat list */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">DIRECT MESSAGES</div>
          {filteredChats.filter(chat => !chat.isGroupChat).length > 0 ? (
            filteredChats.filter(chat => !chat.isGroupChat).map(chat => (
              <div 
                key={chat._id}
                className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  chatState.selectedChat?._id === chat._id ? 'bg-slate-100 dark:bg-slate-800' : ''
                }`}
                onClick={() => handleChatSelect(chat)}
              >
                <UserAvatar 
                  user={chat.users.find(u => u._id !== authState.user?._id) || chat.users[0]} 
                  showStatus={true}
                  isOnline={isUserOnline(chat)}
                />
                <div className="ml-3 overflow-hidden">
                  <div className="font-medium truncate">{getChatName(chat)}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {chat.latestMessage ? chat.latestMessage.content : 'No messages yet'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No direct messages yet
            </p>
          )}
          
          <Separator className="my-4" />
          
          <div className="text-xs font-medium text-muted-foreground mb-2">GROUP CHATS</div>
          {filteredChats.filter(chat => chat.isGroupChat).length > 0 ? (
            filteredChats.filter(chat => chat.isGroupChat).map(chat => (
              <div 
                key={chat._id}
                className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  chatState.selectedChat?._id === chat._id ? 'bg-slate-100 dark:bg-slate-800' : ''
                }`}
                onClick={() => handleChatSelect(chat)}
              >
                <div className="w-10 h-10 rounded-full bg-talkify-secondary text-white flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div className="ml-3 overflow-hidden">
                  <div className="font-medium truncate">{chat.chatName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {chat.users.length} members
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No group chats yet
            </p>
          )}
        </div>
      </ScrollArea>
      
      {/* User profile */}
      {authState.user && (
        <div className="p-4 border-t flex items-center">
          <UserAvatar user={authState.user} showStatus={true} isOnline={true} />
          <div className="ml-3 flex-1 truncate">
            <div className="font-medium">{authState.user.name}</div>
            <div className="text-xs text-muted-foreground">{authState.user.email}</div>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
