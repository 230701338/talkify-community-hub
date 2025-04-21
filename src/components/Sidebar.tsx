
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
  Users
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { state: chatState, fetchChats, selectChat } = useChat();
  const { state: authState, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  
  // Mock users for creating group chat
  const mockUsers = [
    { _id: '2', name: 'Jane Smith', email: 'jane@example.com', isOnline: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane' },
    { _id: '3', name: 'Bob Johnson', email: 'bob@example.com', isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob' },
    { _id: '4', name: 'Alice Williams', email: 'alice@example.com', isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice' },
  ];

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchChats();
  }, []);

  const handleChatSelect = (chat: Chat) => {
    selectChat(chat);
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim() && selectedUsers.length > 0) {
      // In a real app, this would call an API
      console.log('Creating group:', newGroupName, selectedUsers);
      setIsCreateGroupOpen(false);
      setNewGroupName('');
      setSelectedUsers([]);
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
        <Button variant="outline" size="sm" className="flex-1 mr-2">
          <MessageCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        
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
                <label className="text-sm font-medium">Add Members</label>
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {mockUsers.map(user => (
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
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleCreateGroup}
                disabled={newGroupName.trim() === '' || selectedUsers.length === 0}
                className="bg-talkify-primary hover:bg-talkify-hover"
              >
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Chat list */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">DIRECT MESSAGES</div>
          {filteredChats.filter(chat => !chat.isGroupChat).map(chat => (
            <div 
              key={chat._id}
              className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                chatState.selectedChat?._id === chat._id ? 'bg-slate-100 dark:bg-slate-800' : ''
              }`}
              onClick={() => handleChatSelect(chat)}
            >
              <UserAvatar 
                user={chat.users.find(u => u._id !== authState.user?._id) || chat.users[0]} 
                showStatus 
              />
              <div className="ml-3 overflow-hidden">
                <div className="font-medium truncate">{chat.chatName}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {chat.lastMessage ? chat.lastMessage.content : 'No messages yet'}
                </div>
              </div>
            </div>
          ))}
          
          <Separator className="my-4" />
          
          <div className="text-xs font-medium text-muted-foreground mb-2">GROUP CHATS</div>
          {filteredChats.filter(chat => chat.isGroupChat).map(chat => (
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
          ))}
        </div>
      </ScrollArea>
      
      {/* User profile */}
      {authState.user && (
        <div className="p-4 border-t flex items-center">
          <UserAvatar user={authState.user} showStatus={true} />
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
