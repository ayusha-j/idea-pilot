// lib/supabase.ts
import { createClient, SupabaseClient, PostgrestError, RealtimeChannel, User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Define types for authentication responses
export interface AuthError {
  message: string;
  status?: number;
}

// Local Json type (from Supabase docs)
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface AuthData {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
}

export interface AuthResponse {
  data: AuthData | null;
  error: AuthError | null;
}

// User type is now imported from Supabase
export interface User {
  id: string;
  email?: string;
  created_at: string;
  [key: string]: unknown;
}

export interface ProjectDetails {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  domain: string;
  vibe: string;
  milestones: Array<{
    task: string;
    description: string;
    estimatedTime: string;
    resourceLink: string;
  }>;
  tools: string[];
  codeSnippets: Array<{
    milestoneIndex: number;
    code: string;
    debugHint?: string;
  }>;
  resourcePack: {
    links: string[];
    wildcardLink: string;
    markdownContent: string;
  };
}

export interface SavedProject {
  id: string;
  user_id: string;
  concept: string;
  experience_level: number;
  domain: string;
  project_details: ProjectDetails;
  created_at: string;
  updated_at: string;
}

// Realtime payload type
export interface RealtimePayload<T> {
  new: T;
  old: T | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  [key: string]: unknown;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Ensure environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Authentication Functions
export const signUp = async (email: string, password: string, fullName?: string): Promise<AuthResponse> => {
  // Adding fullName parameter for better user profiles
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split('@')[0], // Default to username from email if no full name
      }
    }
  });
  
  return { data, error };
};

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
};

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async (): Promise<{ user: SupabaseUser | null, error: AuthError | null }> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user: user as SupabaseUser | null, error };
};

// Project Storage Functions
export const saveProject = async (
  userId: string, 
  projectData: { 
    concept: string; 
    experienceLevel: number; 
    domain: string; 
    project: ProjectDetails 
  }
): Promise<{ data: SavedProject | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('projects')
    .insert([
      { 
        user_id: userId,
        concept: projectData.concept,
        experience_level: projectData.experienceLevel,
        domain: projectData.domain,
        project_details: projectData.project as unknown as Json
      }
    ])
    .select()
    .single();
  
  return { data: data as SavedProject | null, error };
};

export const getUserProjects = async (userId: string): Promise<{ data: SavedProject[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data: data as SavedProject[] | null, error };
};

// Community Chat Functions
export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  project_id: string | null;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  projects?: {
    id: string;
    project_details: ProjectDetails;
  };
}

export const saveMessage = async (
  userId: string, 
  message: string, 
  projectId: string | null = null
): Promise<{ data: ChatMessage | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([
      { 
        user_id: userId,
        message: message,
        project_id: projectId
      }
    ])
    .select()
    .single();
  
  return { data: data as ChatMessage | null, error };
};

export const getChatMessages = async (limit: number = 50): Promise<{ data: ChatMessage[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      profiles(id, username, avatar_url),
      projects(id, project_details)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { data: data as ChatMessage[] | null, error };
};

// Realtime subscription for community chat
export const subscribeToChat = (callback: (payload: RealtimePayload<ChatMessage>) => void): RealtimeChannel => {
  return supabase
    .channel('public:chat_messages')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages' 
      }, 
      (payload) => {
        callback(payload as unknown as RealtimePayload<ChatMessage>);
      }
    )
    .subscribe();
};

// Private chat functions
export interface PrivateChat {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export interface PrivateMessage {
  id: string;
  chat_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export const getPrivateChats = async (userId: string): Promise<{ data: PrivateChat[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('private_chats')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
  
  return { data: data as PrivateChat[] | null, error };
};

export const getPrivateChatMessages = async (
  chatId: string, 
  limit: number = 50
): Promise<{ data: PrivateMessage[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('private_messages')
    .select(`
      *,
      profiles(id, username, avatar_url)
    `)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  return { data: data as PrivateMessage[] | null, error };
};

export const sendPrivateMessage = async (
  chatId: string, 
  userId: string, 
  message: string
): Promise<{ data: PrivateMessage | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('private_messages')
    .insert([
      { 
        chat_id: chatId,
        user_id: userId,
        message: message
      }
    ])
    .select()
    .single();
  
  return { data: data as PrivateMessage | null, error };
};

// Subscribe to private chat messages
export const subscribeToPrivateChat = (chatId: string, callback: (payload: RealtimePayload<PrivateMessage>) => void): RealtimeChannel => {
  return supabase
    .channel(`private:${chatId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'private_messages',
        filter: `chat_id=eq.${chatId}`
      }, 
      (payload) => {
        callback(payload as unknown as RealtimePayload<PrivateMessage>);
      }
    )
    .subscribe();
};