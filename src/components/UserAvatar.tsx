
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from '@/types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  showStatus = false,
  className = ''
}) => {
  const sizeClass = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  };

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`relative ${className}`}>
      <Avatar className={`${sizeClass[size]}`}>
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-talkify-primary text-white">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      
      {showStatus && (
        <span className={`status-dot ${user.isOnline ? 'status-online' : 'status-offline'}`}></span>
      )}
    </div>
  );
};

export default UserAvatar;
