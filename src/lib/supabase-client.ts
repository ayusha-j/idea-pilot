import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for the entire application
console.log('Initializing Supabase client with URL:', supabaseUrl);

// Try to detect if running in a restricted environment
const mayHaveWebSocketRestrictions = 
  typeof window !== 'undefined' && 
  window?.location?.hostname !== 'localhost' && 
  // Check for common corporate proxy headers
  (document?.referrer?.includes('proxy') || navigator?.userAgent?.includes('MSIE'));

console.log('Environment check:', { 
  mayHaveWebSocketRestrictions,
  location: typeof window !== 'undefined' ? window.location.hostname : 'server-side'
});

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    // Add some resilience to realtime connections
    timeout: mayHaveWebSocketRestrictions ? 10000 : 30000, // Shorter timeout in restricted envs
    heartbeatIntervalMs: 15000,
    reconnectAfterMs: (tries) => {
      // Exponential backoff with max 10s delay
      return Math.min(1000 * Math.pow(2, tries), 10000);
    }
  },
  db: {
    schema: 'public'
  }
});

console.log('Supabase client initialized successfully', {
  hasRealtime: !!supabase.realtime,
  hasAuth: !!supabase.auth
});