
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';

const Index: React.FC = () => {
  const { state } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state.isAuthenticated) {
      navigate('/auth');
    }
  }, [state.isAuthenticated, navigate]);

  if (!state.isAuthenticated) {
    return null; // Will redirect to auth
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <ChatWindow />
    </div>
  );
};

export default Index;
