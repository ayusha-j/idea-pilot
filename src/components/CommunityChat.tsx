'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCommunityMessages, sendCommunityMessage, subscribeToCommunityMessages, checkRealtimeStatus, CommunityMessage } from '@/lib/supabase-chat';
import { toast } from 'react-hot-toast';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Extend the User type to include user_metadata
interface ExtendedUser extends SupabaseUser {
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
    [key: string]: any;
  };
}

export default function CommunityChat() {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading } = useAuth();
  const extendedUser = user as ExtendedUser | null;

  // Load initial messages
  useEffect(() => {
    let mounted = true;

    async function loadMessages() {
      if (authLoading) return; // Don't load messages while auth is loading
      
      console.log('Starting to load messages...');
      setLoading(true);
      setError(null);
      
      try {
        console.log('Calling getCommunityMessages...');
        const result = await getCommunityMessages(50, 0);
        console.log('getCommunityMessages returned:', result);
        
        if (!mounted) return;

        if (result.error) {
          console.error('Error from getCommunityMessages:', result.error);
          setError(result.error);
          toast.error(`Failed to load messages: ${result.error}`);
        } else if (!result.messages) {
          console.error('No messages array in result:', result);
          setError('Unexpected response format');
          toast.error('Unexpected response format');
        } else {
          console.log(`Successfully loaded ${result.messages.length} messages`);
          // Sort messages by created_at in ascending order for display
          setMessages(result.messages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ));
        }
      } catch (error) {
        if (!mounted) return;
        
        console.error('Exception in loadMessages:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          setError(error.message);
        }
        toast.error('An unexpected error occurred while loading messages');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      mounted = false;
    };
  }, [authLoading]); // Only run when auth loading state changes

  // Subscribe to new messages
  useEffect(() => {
    console.log('Setting up message subscription');
    let unsubscribe = () => {};
    let retryCount = 0;
    let retryTimeout: NodeJS.Timeout;
    let mounted = true;

    const setupSubscription = () => {
      try {
        // Clear any existing retry timeouts
        if (retryTimeout) clearTimeout(retryTimeout);
        
        // Setup new subscription
        unsubscribe = subscribeToCommunityMessages((newMessage) => {
          if (!mounted) return;
          
          console.log('Received new message via subscription:', newMessage);
          setMessages(currentMessages => {
            // Check if message already exists to prevent duplicates
            if (currentMessages.some(m => m.id === newMessage.id)) {
              console.log('Message already exists in state, skipping');
              return currentMessages;
            }
            
            console.log('Adding new message to state');
            // Add new message and sort by date
            const updatedMessages = [...currentMessages, newMessage];
            return updatedMessages.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        });
      } catch (error) {
        console.error('Error setting up subscription:', error);
        
        // Implement retry logic with exponential backoff
        if (mounted && retryCount < 5) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          console.log(`Retrying subscription in ${delay}ms (attempt ${retryCount + 1}/5)`);
          
          retryCount++;
          retryTimeout = setTimeout(setupSubscription, delay);
        } else if (mounted) {
          console.error('Failed to set up subscription after 5 attempts');
          setError('Unable to connect to real-time updates. Messages may not appear immediately.');
          toast.error('Connection issue: Real-time updates are unavailable');
        }
      }
    };

    // Initial setup
    setupSubscription();

    // Cleanup subscription when component unmounts
    return () => {
      console.log('Cleaning up message subscription');
      mounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      unsubscribe();
    };
  }, []);

  // Check realtime connection status
  useEffect(() => {
    let mounted = true;
    let statusCheckInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        if (!mounted) return;
        
        const { working, error } = await checkRealtimeStatus();
        if (mounted) {
          console.log('Realtime connection status:', { working, error });
          if (!working) {
            console.error('Realtime connection not working:', error);
            
            // Show error to user only on persistent failures
            if (error && error.includes('timeout')) {
              setError('Connection to real-time service is unstable. Some messages may be delayed.');
            }
          } else {
            // Clear error if connection is working now
            setError(null);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Error checking realtime status:', err);
        }
      }
    };
    
    // Check status initially and then every 30 seconds
    checkStatus();
    statusCheckInterval = setInterval(checkStatus, 30000);

    return () => {
      mounted = false;
      clearInterval(statusCheckInterval);
    };
  }, []);

  // Use polling as fallback when realtime fails
  useEffect(() => {
    let mounted = true;
    let pollingInterval: NodeJS.Timeout | null = null;
    let consecutiveFailures = 0;
    
    // Only start polling if there's an error with realtime
    if (error && error.includes('timeout') || error?.includes('WebSocket')) {
      console.log('Starting polling fallback due to realtime connection issues');
      
      const pollForNewMessages = async () => {
        if (!mounted) return;
        
        try {
          // Get last message timestamp
          const lastMessageTime = messages.length > 0 
            ? new Date(messages[messages.length - 1].created_at).getTime() 
            : 0;
          
          // Fetch only messages newer than our last one
          const { messages: newMessages, error: fetchError } = await getCommunityMessages(10, 0);
          
          if (fetchError) {
            console.error('Error polling for messages:', fetchError);
            consecutiveFailures++;
            
            if (consecutiveFailures > 5) {
              console.error('Too many consecutive polling failures, stopping polling');
              if (pollingInterval) clearInterval(pollingInterval);
            }
            return;
          }
          
          // Reset failure counter on success
          consecutiveFailures = 0;
          
          // Filter for only new messages
          const newerMessages = newMessages.filter(msg => {
            return new Date(msg.created_at).getTime() > lastMessageTime;
          });
          
          // If we have new messages, add them to state
          if (newerMessages.length > 0) {
            console.log(`Polling found ${newerMessages.length} new messages`);
            setMessages(currentMessages => {
              const combinedMessages = [...currentMessages];
              
              // Add each new message if it doesn't already exist
              newerMessages.forEach(newMsg => {
                if (!combinedMessages.some(m => m.id === newMsg.id)) {
                  combinedMessages.push(newMsg);
                }
              });
              
              // Sort by timestamp
              return combinedMessages.sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          }
        } catch (err) {
          console.error('Error in polling fallback:', err);
        }
      };
      
      // Start polling every 5 seconds
      pollingInterval = setInterval(pollForNewMessages, 5000);
    }
    
    return () => {
      mounted = false;
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [messages, error]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You need to be logged in to send messages');
      return;
    }
    
    if (!newMessage.trim()) {
      return;
    }
    
    setSending(true);
    
    try {
      console.log(`Sending message: ${newMessage.substring(0, 20)}...`);
      const { message, error } = await sendCommunityMessage(user.id, newMessage.trim());
      
      if (error) {
        throw new Error(error);
      }
      
      console.log('Message sent successfully:', message);
      
      // Clear the input field
      setNewMessage('');
      
      // If the message isn't automatically added by the subscription,
      // we'll add it manually after a short delay
      setTimeout(() => {
        setMessages(currentMessages => {
          // Check if the message was already added by the subscription
          if (message && !currentMessages.some(m => m.id === message.id)) {
            console.log('Adding sent message manually (not added by subscription)');
            const updatedMessages = [...currentMessages, message];
            return updatedMessages.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          }
          return currentMessages;
        });
      }, 1000);
    } catch (err) {
      toast.error('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Determine if a message was sent by the current user
  const isCurrentUser = (userId: string) => {
    return user?.id === userId;
  };

  // Generate user initials for avatar
  const getUserInitials = (fullName?: string, email?: string) => {
    if (fullName) {
      return fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    
    return 'UN';
  };

  return (
    <div className="bg-dark-card rounded-lg shadow-md border border-dark-border overflow-hidden h-[75vh] flex flex-col">
      {/* Header */}
      <div className="bg-dark-element p-4 border-b border-dark-border">
        <h2 className="text-xl font-bold text-dark-text font-cabin">Community Chat</h2>
        <p className="text-dark-text-secondary text-sm">
          Connect with other developers and share ideas
        </p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-purple"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-dark-text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex items-start ${isCurrentUser(message.user_id) ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser(message.user_id) && (
                  <div className="flex-shrink-0 mr-3">
                    {message.profiles?.avatar_url ? (
                      <img 
                        src={message.profiles.avatar_url} 
                        alt={message.profiles.full_name || message.profiles.email || 'User'}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-purple flex items-center justify-center text-dark-text text-xs">
                        {getUserInitials(message.profiles?.full_name, message.profiles?.email)}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`
                  max-w-xs sm:max-w-md px-4 py-2 rounded-lg
                  ${isCurrentUser(message.user_id) 
                    ? 'bg-primary-purple text-dark-text rounded-tr-none' 
                    : 'bg-dark-element text-dark-text rounded-tl-none'}
                `}>
                  {!isCurrentUser(message.user_id) && (
                    <div className="text-xs text-dark-text-secondary mb-1">
                      {message.profiles?.full_name || message.profiles?.email || 'Unknown user'}
                    </div>
                  )}
                  
                  <div className="break-words">
                    {message.content}
                  </div>
                  
                  <div className="text-xs mt-1 text-right text-dark-text-secondary">
                    {formatTimestamp(message.created_at)}
                  </div>
                </div>
                
                {isCurrentUser(message.user_id) && (
                  <div className="flex-shrink-0 ml-3">
                    {extendedUser?.user_metadata?.avatar_url ? (
                      <img 
                        src={extendedUser.user_metadata.avatar_url}
                        alt={extendedUser.user_metadata?.full_name || extendedUser.email || 'User'}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-purple flex items-center justify-center text-dark-text text-xs">
                        {getUserInitials(extendedUser?.user_metadata?.full_name, extendedUser?.email)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Message Input */}
      <div className="p-4 border-t border-dark-border">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending || !user}
            className="flex-1 bg-dark-element border border-dark-border rounded-md px-4 py-2 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-purple disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || !user}
            className="bg-primary-purple text-dark-text px-4 py-2 rounded-md hover:bg-accent-pink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-dark-text border-t-transparent"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        {!user && (
          <p className="text-center text-dark-text-secondary mt-2 text-sm">
            You need to be logged in to send messages
          </p>
        )}
      </div>
    </div>
  );
}