// lib/supabase-chat.ts
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase-client';

// Types
export interface CommunityMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // Join with profiles
  profiles?: {
    full_name: string;
    avatar_url: string;
    email: string;
  };
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  created_at: string;
  updated_at: string;
  // Join with profiles
  participant1?: {
    full_name: string;
    avatar_url: string;
    email: string;
  };
  participant2?: {
    full_name: string;
    avatar_url: string;
    email: string;
  };
}

export interface PrivateMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  // Join with profiles
  sender?: {
    full_name: string;
    avatar_url: string;
    email: string;
  };
}

// Helper function to check if a table exists
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error) {
      console.error(`Table check failed for ${tableName}:`, error);
      return false;
    }
    
    console.log(`Table ${tableName} exists and is accessible`);
    return true;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Community Chat Functions
export async function getCommunityMessages(limit = 50, page = 0) {
  console.log('Fetching community messages with params:', { limit, page });
  try {
    // First fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('community_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return { messages: [], error: messagesError.message };
    }

    if (!messages || messages.length === 0) {
      return { messages: [], error: null };
    }

    // Then fetch profiles for these messages
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return { messages, error: null }; // Return messages without profiles
    }

    // Map profiles to messages
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const messagesWithProfiles = messages.map(msg => ({
      ...msg,
      profiles: profileMap.get(msg.user_id) || null
    }));

    console.log(`Retrieved ${messagesWithProfiles.length} community messages`);
    return { messages: messagesWithProfiles, error: null };
  } catch (error: any) {
    console.error('Error in getCommunityMessages:', error);
    return { messages: [], error: error?.message || 'Unknown error fetching messages' };
  }
}

export function subscribeToCommunityMessages(callback: (message: CommunityMessage) => void) {
  console.log('[REALTIME] Starting subscription setup...');
  
  // First, verify that the Supabase client is initialized properly
  if (!supabase?.realtime) {
    console.error('[REALTIME] Supabase realtime client not initialized');
    return () => {}; // Return empty cleanup function
  }
  
  try {
    // Generate a unique channel name for this subscription
    const channelName = `community_messages_${Date.now()}`;
    
    // Remove any existing channels to avoid duplication
    const existingChannels = supabase.getChannels();
    for (const ch of existingChannels) {
      console.log('[REALTIME] Found existing channel:', ch.topic);
      supabase.removeChannel(ch);
    }
    
    // Create new channel with unique name
    const channel = supabase.channel(channelName);
    
    console.log('[REALTIME] Channel created:', channel?.topic);
    
    // Simple subscription to postgres changes
    channel
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'community_messages' 
        },
        async (payload: any) => {
          // Basic validation
          if (!payload.new?.id) {
            console.warn('[REALTIME] Invalid payload:', payload);
            return;
          }
          
          console.log('[REALTIME] Message received:', payload.new.id);
          
          // Fetch profile if user_id exists
          let profile = null;
          if (payload.new.user_id) {
            try {
              const { data } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, email')
                .eq('id', payload.new.user_id)
                .maybeSingle();
                
              profile = data;
            } catch (e) {
              console.error('[REALTIME] Error fetching profile:', e);
              // Continue without profile data
            }
          }
          
          // Construct the message with profile
          const message: CommunityMessage = {
            ...payload.new,
            profiles: profile
          };
          
          // Call the callback with the message
          callback(message);
        }
      );
      
    // Subscribe with minimal error handling
    channel.subscribe((status) => {
      console.log('[REALTIME] Subscription status:', status);
    });
    
    // Return clean-up function
    return () => {
      console.log('[REALTIME] Cleaning up subscription...');
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.error('[REALTIME] Error removing channel:', e);
      }
    };
  } catch (e) {
    console.error('[REALTIME] Error creating subscription:', e);
    return () => {};
  }
}

export async function sendCommunityMessage(userId: string, content: string) {
  try {
    console.log(`Sending community message from user ${userId}: ${content.substring(0, 20)}...`);
    
    // Check if user exists
    const { data: userExists, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking if user exists:', userError);
      throw new Error(`Failed to validate user: ${userError.message}`);
    }
    
    if (!userExists && userError.code === 'PGRST116') {
      console.warn(`User with ID ${userId} not found in profiles table. Message might fail due to foreign key constraints.`);
    }
    
    // Insert the message
    const { data, error } = await supabase
      .from('community_messages')
      .insert([{ user_id: userId, content }])
      .select();

    if (error) {
      console.error('Supabase error sending community message:', error);
      throw error;
    }
    
    console.log('Community message sent successfully', data?.[0]?.id);
    
    // If the message was sent successfully but data is null,
    // try to fetch the message to return it
    if (!data || data.length === 0) {
      console.log('Message was sent but no data returned, trying to fetch it');
      const { data: recentMessage, error: fetchError } = await supabase
        .from('community_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (fetchError) {
        console.warn('Failed to fetch recently sent message:', fetchError);
      } else if (recentMessage && recentMessage.length > 0) {
        console.log('Found recently sent message:', recentMessage[0].id);
        return { message: recentMessage[0], error: null };
      }
    }
    
    return { message: data?.[0] || null, error: null };
  } catch (error: any) {
    console.error('Error sending community message:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
      stack: error.stack
    });
    return { message: null, error: error.message || 'Unknown error sending message' };
  }
}

// Private Chat Functions
export async function getOrCreateConversation(userId: string, otherUserId: string) {
  try {
    console.log(`Getting or creating conversation between ${userId} and ${otherUserId}`);
    
    // Check if conversations table exists
    const tableExists = await checkTableExists('conversations');
    if (!tableExists) {
      console.error('The conversations table does not exist or is not accessible');
      return { 
        conversation: null, 
        error: 'The conversations table does not exist or is not accessible. Make sure to run the SQL setup commands.' 
      };
    }
    
    // Check if conversation exists (in either direction)
    const { data: existingConversations, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .or(`participant1_id.eq.${otherUserId},participant2_id.eq.${otherUserId}`);

    if (fetchError) {
      console.error('Error fetching existing conversations:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${existingConversations?.length || 0} conversations for this user`);

    // Find conversation between these two specific users
    const conversation = existingConversations?.find(
      conv => 
        (conv.participant1_id === userId && conv.participant2_id === otherUserId) || 
        (conv.participant1_id === otherUserId && conv.participant2_id === userId)
    );

    if (conversation) {
      console.log('Found existing conversation:', conversation.id);
      return { conversation, error: null };
    }

    console.log('Creating new conversation...');
    // Create a new conversation if none exists
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert([
        {
          participant1_id: userId,
          participant2_id: otherUserId
        }
      ])
      .select();

    if (createError) {
      console.error('Error creating conversation:', createError);
      throw createError;
    }

    console.log('Created new conversation:', newConversation?.[0]?.id);
    return { conversation: newConversation?.[0] || null, error: null };
  } catch (error: any) {
    console.error('Error getting/creating conversation:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
      stack: error.stack
    });
    return { conversation: null, error: error.message || 'Unknown error' };
  }
}

export async function getConversations(userId: string) {
  try {
    console.log(`Fetching conversations for user ${userId}...`);
    
    // First, verify userId is valid
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Check if conversations table exists
    const tableExists = await checkTableExists('conversations');
    if (!tableExists) {
      console.error('The conversations table does not exist or is not accessible');
      return { 
        conversations: [], 
        error: 'The conversations table does not exist or is not accessible. Make sure to run the SQL setup commands.' 
      };
    }
    
    // Get all conversations for this user with the other participant's profile
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:participant1_id (
          full_name,
          avatar_url,
          email
        ),
        participant2:participant2_id (
          full_name,
          avatar_url,
          email
        )
      `)
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching conversations:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} conversations`);
    return { conversations: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
      stack: error.stack
    });
    return { conversations: [], error: error.message || 'Unknown error' };
  }
}

export async function getPrivateMessages(conversationId: string, limit = 50, page = 0) {
  try {
    console.log(`Fetching private messages for conversation ${conversationId}...`);
    
    // Check if private_messages table exists
    const tableExists = await checkTableExists('private_messages');
    if (!tableExists) {
      console.error('The private_messages table does not exist or is not accessible');
      return { 
        messages: [], 
        error: 'The private_messages table does not exist or is not accessible. Make sure to run the SQL setup commands.' 
      };
    }
    
    const { data, error } = await supabase
      .from('private_messages')
      .select(`
        *,
        sender:sender_id (
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      console.error('Supabase error fetching private messages:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} private messages`);
    return { messages: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching private messages:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
      stack: error.stack
    });
    return { messages: [], error: error.message || 'Unknown error' };
  }
}

export async function sendPrivateMessage(conversationId: string, senderId: string, content: string) {
  try {
    console.log(`Sending private message in conversation ${conversationId} from user ${senderId}`);
    
    // Check if private_messages table exists
    const tableExists = await checkTableExists('private_messages');
    if (!tableExists) {
      console.error('The private_messages table does not exist or is not accessible');
      return { 
        message: null, 
        error: 'The private_messages table does not exist or is not accessible. Make sure to run the SQL setup commands.' 
      };
    }
    
    // Insert the message
    const { data, error } = await supabase
      .from('private_messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: senderId,
          content
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error sending private message:', error);
      throw error;
    }
    
    console.log('Private message sent successfully', data?.[0]?.id);
    
    // Update the conversation's updated_at timestamp
    const updateResult = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
      
    if (updateResult.error) {
      console.warn('Warning: Failed to update conversation timestamp', updateResult.error);
    }
    
    return { message: data?.[0] || null, error: null };
  } catch (error: any) {
    console.error('Error sending private message:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
      stack: error.stack
    });
    return { message: null, error: error.message || 'Unknown error' };
  }
}

export async function markMessagesAsRead(conversationId: string, userId: string) {
  try {
    console.log(`Marking messages as read in conversation ${conversationId} for user ${userId}`);
    
    // Check if necessary tables exist
    const convTableExists = await checkTableExists('conversations');
    const msgTableExists = await checkTableExists('private_messages');
    
    if (!convTableExists || !msgTableExists) {
      console.error('Required tables do not exist or are not accessible');
      return { 
        success: false, 
        error: 'Required tables do not exist or are not accessible. Make sure to run the SQL setup commands.' 
      };
    }
    
    // Get the conversation to find the other participant's ID
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('Supabase error fetching conversation:', convError);
      throw convError;
    }
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Determine the other user's ID
    const otherUserId = conversation.participant1_id === userId 
      ? conversation.participant2_id 
      : conversation.participant1_id;
      
    console.log(`Other user ID is ${otherUserId}`);
      
    // Mark all messages from the other user as read
    const { error } = await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('sender_id', otherUserId)
      .eq('is_read', false);

    if (error) {
      console.error('Supabase error marking messages as read:', error);
      throw error;
    }
    
    console.log('Messages marked as read successfully');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
      stack: error.stack
    });
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export function subscribeToPrivateMessages(
  conversationId: string, 
  callback: (message: PrivateMessage) => void
) {
  console.log(`Setting up subscription to private messages for conversation ${conversationId}...`);
  try {
    const subscription = supabase
      .channel(`private_messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload: any) => {
          console.log('Received new private message:', payload.new?.id);
          // Fetch the message with sender info
          try {
            const { data, error } = await supabase
              .from('private_messages')
              .select(`
                *,
                sender:sender_id (
                  full_name,
                  avatar_url,
                  email
                )
              `)
              .eq('id', payload.new?.id)
              .single();
              
            if (error) {
              console.error('Error fetching new private message details:', error);
              return;
            }
              
            if (data) {
              console.log('Passing new private message to callback');
              callback(data as PrivateMessage);
            } else if (payload.new) {
              console.log('Using payload data as fallback for private message');
              callback({
                id: payload.new.id,
                conversation_id: payload.new.conversation_id,
                sender_id: payload.new.sender_id,
                content: payload.new.content,
                created_at: payload.new.created_at,
                is_read: payload.new.is_read
              } as PrivateMessage);
            }
          } catch (error) {
            console.error('Error in private message subscription callback:', error);
          }
        }
      )
      .subscribe((status: string) => {
        console.log('Private messages subscription status:', status);
        if (status !== 'SUBSCRIBED') {
          console.warn(`Private messages subscription status is ${status}, not SUBSCRIBED. Realtime updates may not work.`);
        }
      });

    return () => {
      console.log(`Unsubscribing from private messages for conversation ${conversationId}`);
      supabase.removeChannel(subscription);
    };
  } catch (error) {
    console.error('Error setting up private messages subscription:', error);
    return () => {}; // Return empty cleanup function
  }
}

export async function getAllUsers() {
  try {
    console.log('Fetching all users...');
    
    // Check if profiles table exists
    const tableExists = await checkTableExists('profiles');
    if (!tableExists) {
      console.error('The profiles table does not exist or is not accessible');
      return { 
        users: [], 
        error: 'The profiles table does not exist or is not accessible. Make sure to run the SQL setup commands.' 
      };
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Supabase error fetching users:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} users`);
    return { users: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
      stack: error.stack
    });
    return { users: [], error: error.message || 'Unknown error' };
  }
}

export async function getUnreadMessageCount(userId: string) {
  try {
    console.log(`Getting unread message count for user ${userId}...`);
    
    // Check if necessary tables exist
    const convTableExists = await checkTableExists('conversations');
    const msgTableExists = await checkTableExists('private_messages');
    
    if (!convTableExists || !msgTableExists) {
      console.error('Required tables do not exist or are not accessible');
      return { 
        count: 0, 
        error: 'Required tables do not exist or are not accessible. Make sure to run the SQL setup commands.' 
      };
    }
    
    // Find all conversations for this user
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);

    if (convError) {
      console.error('Supabase error fetching conversations for unread count:', convError);
      throw convError;
    }
    
    if (!conversations || conversations.length === 0) {
      console.log('No conversations found for unread count');
      return { count: 0, error: null };
    }
    
    console.log(`Found ${conversations.length} conversations to check for unread messages`);
    
    // Get the conversation IDs
    const conversationIds = conversations.map(conv => conv.id);
    
    // Count unread messages sent by other users
    const { data, error } = await supabase
      .from('private_messages')
      .select('id', { count: 'exact' })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Supabase error counting unread messages:', error);
      throw error;
    }
    
    console.log(`User has ${data.length} unread messages`);
    return { count: data.length, error: null };
  } catch (error: any) {
    console.error('Error getting unread message count:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
      stack: error.stack
    });
    return { count: 0, error: error.message || 'Unknown error' };
  }
}

// Function to check if Supabase Realtime is working
export async function checkRealtimeStatus(): Promise<{ working: boolean; error?: string }> {
  console.log('[STATUS] Starting realtime status check...');
  
  // First check if the client is properly initialized
  if (!supabase?.realtime) {
    return { 
      working: false,
      error: 'Supabase Realtime client not initialized' 
    };
  }
  
  try {
    // Get realtime client status
    const isConnected = supabase.realtime.isConnected();
    const currentChannels = supabase.getChannels();
    
    console.log('[STATUS] Current realtime state:', {
      isConnected, 
      channels: currentChannels.length,
      connectionIds: supabase.realtime?.connection?.connectionStates?.map(c => c.id)
    });
    
    // Create a temporary test channel with explicit parameters
    const testChannel = supabase.channel('status_check_' + Date.now(), {
      config: {
        broadcast: { self: true },
        presence: { key: '' }
      }
    });
    
    let statusSuccess = false;
    let statusError: string | undefined;
    
    // Handle subscription events
    testChannel.on('subscription', { event: 'SUBSCRIBED' }, () => {
      console.log('[STATUS] Subscription status: SUBSCRIBED');
      statusSuccess = true;
    });
    
    testChannel.on('subscription', { event: 'CHANNEL_ERROR' }, (error) => {
      console.error('[STATUS] Channel error:', error);
      statusError = error ? (typeof error === 'object' ? JSON.stringify(error) : String(error)) : 'Unknown channel error';
    });

    // Track system connection events
    testChannel.on('system', { event: 'connection_error' }, (error) => {
      console.error('[STATUS] Connection error:', error);
      statusError = error ? (typeof error === 'object' ? JSON.stringify(error) : String(error)) : 'Connection error';
    });
    
    // Broadcast dummy message for testing
    testChannel.on('broadcast', { event: 'test' }, () => {
      console.log('[STATUS] Received test broadcast');
      statusSuccess = true;
    });
    
    // Subscribe to channel
    console.log('[STATUS] Subscribing to test channel...');
    testChannel.subscribe(status => {
      console.log('[STATUS] Channel status update:', status);
    });
    
    // Send test message after brief delay
    setTimeout(() => {
      try {
        testChannel.send({
          type: 'broadcast',
          event: 'test',
          payload: { test: true }
        });
        console.log('[STATUS] Sent test broadcast');
      } catch (e) {
        console.error('[STATUS] Error sending test broadcast:', e);
      }
    }, 1000);
    
    // Wait for subscription result with timeout
    const timeout = 7000; // 7 seconds
    const startTime = Date.now();
    
    while (!statusSuccess && !statusError && (Date.now() - startTime < timeout)) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Check if we timed out
    if (!statusSuccess && !statusError && (Date.now() - startTime >= timeout)) {
      console.error('[STATUS] Connection attempt timed out');
      
      // Check WebSocket state
      const wsState = supabase.realtime?.connection?.socket?.conn?.readyState;
      let wsStateString = 'Unknown';
      
      if (wsState === 0) wsStateString = 'CONNECTING';
      else if (wsState === 1) wsStateString = 'OPEN';
      else if (wsState === 2) wsStateString = 'CLOSING';
      else if (wsState === 3) wsStateString = 'CLOSED';
      
      console.error('[STATUS] WebSocket state:', wsStateString);
      statusError = `Connection timeout (WebSocket: ${wsStateString})`;
    }
    
    // Always clean up the test channel
    try {
      supabase.removeChannel(testChannel);
    } catch (e) {
      console.error('[STATUS] Error removing test channel:', e);
    }
    
    return {
      working: statusSuccess,
      error: statusError
    };
  } catch (error) {
    console.error('[STATUS] Error checking realtime status:', error);
    return {
      working: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Export all functions as a default object
export default {
  getCommunityMessages,
  sendCommunityMessage,
  subscribeToCommunityMessages,
  getOrCreateConversation,
  getConversations,
  getPrivateMessages,
  sendPrivateMessage,
  markMessagesAsRead,
  subscribeToPrivateMessages,
  getAllUsers,
  getUnreadMessageCount,
  checkRealtimeStatus,
  checkTableExists
};