"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatMessage, ProjectDetails } from '@/types/project';

interface ChatContextProps {
  userId: string | null;
  setUserId: (id: string) => void;
  projectIds: Record<string, string>;
  setProjectId: (title: string, id: string) => void;
  activeSessions: string[];
}

const ChatContext = createContext<ChatContextProps>({
  userId: null,
  setUserId: () => {},
  projectIds: {},
  setProjectId: () => {},
  activeSessions: []
});

export const useChatContext = () => useContext(ChatContext);

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [projectIds, setProjectIds] = useState<Record<string, string>>({});
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  
  // Load stored user ID and project IDs on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('mentor_chat_user_id');
    if (storedUserId) {
      setUserIdState(storedUserId);
    }
    
    // Scan localStorage for project IDs
    const storedProjectIds: Record<string, string> = {};
    const sessions: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mentor_chat_project_id_')) {
        const projectTitle = key.replace('mentor_chat_project_id_', '');
        const projectId = localStorage.getItem(key);
        if (projectId) {
          storedProjectIds[projectTitle] = projectId;
          sessions.push(projectTitle);
        }
      }
    }
    
    setProjectIds(storedProjectIds);
    setActiveSessions(sessions);
  }, []);
  
  // Set user ID and store in localStorage
  const setUserId = (id: string) => {
    setUserIdState(id);
    localStorage.setItem('mentor_chat_user_id', id);
  };
  
  // Set project ID for a specific project title and store in localStorage
  const setProjectId = (title: string, id: string) => {
    setProjectIds(prev => ({ ...prev, [title]: id }));
    localStorage.setItem(`mentor_chat_project_id_${title}`, id);
    
    // Update active sessions
    if (!activeSessions.includes(title)) {
      setActiveSessions(prev => [...prev, title]);
    }
  };
  
  return (
    <ChatContext.Provider
      value={{
        userId,
        setUserId,
        projectIds,
        setProjectId,
        activeSessions
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}