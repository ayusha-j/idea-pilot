// components/SupabaseDiagnostic.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkTableExists, checkRealtimeStatus } from '@/lib/supabase-chat';

export default function SupabaseDiagnostic() {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<{
    tables: {
      [key: string]: boolean;
    },
    realtime: {
      working: boolean;
      error: string | null;
    } | null;
  }>({
    tables: {},
    realtime: null
  });
  const { user } = useAuth();

  useEffect(() => {
    async function runDiagnostics() {
      if (!user) return;
      
      setLoading(true);
      
      // Check all required tables
      const tablesToCheck = [
        'community_messages',
        'conversations',
        'private_messages',
        'profiles'
      ];
      
      const tableStatuses: { [key: string]: boolean } = {};
      
      for (const table of tablesToCheck) {
        const exists = await checkTableExists(table);
        tableStatuses[table] = exists;
      }
      
      // Check realtime status
      const realtimeStatus = await checkRealtimeStatus();
      
      setDiagnostics({
        tables: tableStatuses,
        realtime: realtimeStatus
      });
      
      setLoading(false);
    }
    
    runDiagnostics();
  }, [user]);

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  if (!user) {
    return (
      <div className="bg-dark-card rounded-lg shadow-md border border-dark-border p-6">
        <h2 className="text-xl font-bold text-dark-text mb-4 font-cabin">Supabase Diagnostics</h2>
        <p className="text-dark-text-secondary">You need to be logged in to run diagnostics.</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-card rounded-lg shadow-md border border-dark-border p-6">
      <h2 className="text-xl font-bold text-dark-text mb-4 font-cabin">Supabase Diagnostics</h2>
      
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-purple"></div>
          <span className="ml-3 text-dark-text">Running diagnostics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-dark-text mb-2">Database Tables</h3>
            <div className="bg-dark-element rounded-lg p-4">
              <ul className="space-y-2">
                {Object.entries(diagnostics.tables).map(([table, exists]) => (
                  <li key={table} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(exists)}
                      <span className="ml-2 text-dark-text">{table}</span>
                    </div>
                    <span className={getStatusColor(exists)}>
                      {exists ? 'Available' : 'Missing'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-dark-text mb-2">Realtime Functionality</h3>
            <div className="bg-dark-element rounded-lg p-4">
              {diagnostics.realtime && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(diagnostics.realtime.working)}
                    <span className="ml-2 text-dark-text">Realtime Subscriptions</span>
                  </div>
                  <span className={getStatusColor(diagnostics.realtime.working)}>
                    {diagnostics.realtime.working ? 'Working' : 'Not Working'}
                  </span>
                </div>
              )}
              
              {diagnostics.realtime && !diagnostics.realtime.working && diagnostics.realtime.error && (
                <div className="mt-2 p-3 bg-red-100 bg-opacity-10 rounded text-dark-text-secondary text-sm">
                  <strong>Error:</strong> {diagnostics.realtime.error}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-dark-element rounded-lg p-4">
            <h3 className="text-lg font-medium text-dark-text mb-2">What to Do Next</h3>
            
            {Object.values(diagnostics.tables).some(exists => !exists) && (
              <div className="mb-4">
                <h4 className="font-medium text-dark-text mb-1">Missing Tables</h4>
                <p className="text-dark-text-secondary text-sm mb-2">
                  One or more required tables are missing. You need to run the SQL setup commands to create these tables.
                </p>
                <pre className="bg-dark-bg p-2 rounded text-xs text-dark-text-secondary overflow-x-auto">
                  -- Run these commands in your Supabase SQL editor:
                  {`
CREATE TABLE public.community_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID REFERENCES auth.users NOT NULL,
  participant2_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant1_id, participant2_id)
);

CREATE TABLE public.private_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations NOT NULL,
  sender_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community messages (public read, authenticated write)
CREATE POLICY "Anyone can view community messages" 
  ON public.community_messages 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create community messages" 
  ON public.community_messages 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own community messages" 
  ON public.community_messages 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" 
  ON public.conversations 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations" 
  ON public.conversations 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- RLS Policies for private messages
CREATE POLICY "Users can view messages in their conversations" 
  ON public.private_messages 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send private messages" 
  ON public.private_messages 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update read status of messages" 
  ON public.private_messages 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

-- Enable realtime for live chat functionality
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
ALTER TABLE public.private_messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;`}
                </pre>
              </div>
            )}
            
            {diagnostics.realtime && !diagnostics.realtime.working && (
              <div className="mb-4">
                <h4 className="font-medium text-dark-text mb-1">Realtime Not Working</h4>
                <p className="text-dark-text-secondary text-sm">
                  Supabase Realtime functionality is not working correctly. Make sure:
                </p>
                <ul className="list-disc list-inside text-dark-text-secondary text-sm ml-2 mt-1 space-y-1">
                  <li>Realtime is enabled in your Supabase project settings</li>
                  <li>The tables are added to the realtime publication</li>
                  <li>Your RLS policies allow access to the tables</li>
                  <li>Your browser allows WebSocket connections</li>
                </ul>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-dark-text mb-1">Verifying Supabase Configuration</h4>
              <p className="text-dark-text-secondary text-sm">
                Check your environment variables to ensure Supabase is configured correctly:
              </p>
              <ul className="list-disc list-inside text-dark-text-secondary text-sm ml-2 mt-1 space-y-1">
                <li>NEXT_PUBLIC_SUPABASE_URL should be set to your Supabase project URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY should be set to your public anon key</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}