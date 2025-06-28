'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getConversations, 
  getPrivateMessages, 
  sendPrivateMessage, 
  markMessagesAsRead,
  subscribeToPrivateMessages,
  getAllUsers,
  getOrCreateConversation,
  Conversation,
  PrivateMessage
} from '@/lib/supabase-chat';
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

// ConversationList component
export function ConversationList({ 
  onSelectConversation 
}: { 
  onSelectConversation: (conversation: Conversation) => void 
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const { user } = useAuth();

  // Load conversations
  useEffect(() => {
    async function loadConversations() {
      if (!user) return;
      
      setLoading(true);
      const { conversations, error } = await getConversations(user.id);
      
      if (error) {
        toast.error('Failed to load conversations');
        console.error(error);
      } else {
        setConversations(conversations);
      }
      
      setLoading(false);
    }

    loadConversations();
  }, [user]);

  // Format the last message time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show date with year
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get the other participant in a conversation
  const getOtherParticipant = (conversation: Conversation) => {
    if (!user) return null;
    
    if (conversation.participant1_id === user.id) {
      return {
        id: conversation.participant2_id,
        ...conversation.participant2
      };
    } else {
      return {
        id: conversation.participant1_id,
        ...conversation.participant1
      };
    }
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
    <div className="w-full md:w-72 bg-dark-card rounded-lg border border-dark-border shadow-md overflow-hidden">
      <div className="p-4 bg-dark-element border-b border-dark-border flex justify-between items-center">
        <h3 className="font-bold text-dark-text">Private Messages</h3>
        <button 
          onClick={() => setShowNewChatModal(true)}
          className="bg-primary-purple text-dark-text p-2 rounded-full hover:bg-accent-pink transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="overflow-y-auto max-h-[calc(75vh-60px)]">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-purple"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-dark-text-secondary">
            <p>No conversations yet</p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="mt-2 text-primary-purple hover:text-accent-pink transition-colors"
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-dark-border">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              
              return (
                <li key={conversation.id}>
                  <button
                    onClick={() => onSelectConversation(conversation)}
                    className="w-full p-3 text-left hover:bg-dark-element transition-colors flex items-center space-x-3"
                  >
                    {otherParticipant?.avatar_url ? (
                      <img 
                        src={otherParticipant.avatar_url} 
                        alt={otherParticipant.full_name || otherParticipant.email || 'User'}
                        className="h-10 w-10 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary-purple flex items-center justify-center text-dark-text text-sm flex-shrink-0">
                        {getUserInitials(otherParticipant?.full_name, otherParticipant?.email)}
                      </div>
                    )}
                    
                    <div className="overflow-hidden">
                      <div className="font-medium text-dark-text truncate">
                        {otherParticipant?.full_name || otherParticipant?.email || 'Unknown User'}
                      </div>
                      <div className="text-sm text-dark-text-secondary truncate">
                        {formatTimestamp(conversation.updated_at)}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      {showNewChatModal && (
        <NewChatModal 
          onClose={() => setShowNewChatModal(false)} 
          onSelectUser={(selectedUser) => {
            setShowNewChatModal(false);
            if (user && selectedUser.id) {
              // Create a conversation and select it
              getOrCreateConversation(user.id, selectedUser.id)
                .then(({ conversation, error }) => {
                  if (error) {
                    toast.error('Failed to create conversation');
                    console.error(error);
                    return;
                  }
                  
                  if (conversation) {
                    // Add user info to the conversation object
                    const enrichedConversation = {
                      ...conversation,
                      participant1: user.id === conversation.participant1_id 
                        ? { email: user.email }
                        : { email: selectedUser.email, full_name: selectedUser.full_name, avatar_url: selectedUser.avatar_url },
                      participant2: user.id === conversation.participant1_id
                        ? { email: selectedUser.email, full_name: selectedUser.full_name, avatar_url: selectedUser.avatar_url }
                        : { email: user.email }
                    };
                    
                    // Update the conversations list
                    setConversations(prev => {
                      // Check if conversation already exists in the list
                      if (prev.some(c => c.id === conversation.id)) {
                        return prev;
                      }
                      return [enrichedConversation as Conversation, ...prev];
                    });
                    
                    // Select the conversation
                    onSelectConversation(enrichedConversation as Conversation);
                  }
                });
            }
          }}
        />
      )}
    </div>
  );
}

// NewChatModal component
function NewChatModal({ 
  onClose, 
  onSelectUser 
}: { 
  onClose: () => void;
  onSelectUser: (user: { id: string; email?: string; full_name?: string; avatar_url?: string }) => void;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Load users
  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      const { users, error } = await getAllUsers();
      
      if (error) {
        toast.error('Failed to load users');
        console.error(error);
      } else {
        // Filter out current user
        const filteredUsers = users.filter(u => u.id !== user?.id);
        setUsers(filteredUsers);
      }
      
      setLoading(false);
    }

    loadUsers();
  }, [user]);

  // Filter users by search term
  const filteredUsers = users.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(searchLower)) ||
      (u.email && u.email.toLowerCase().includes(searchLower))
    );
  });

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div 
        ref={modalRef}
        className="bg-dark-card rounded-lg shadow-lg max-w-md w-full mx-4"
      >
        <div className="p-4 border-b border-dark-border flex justify-between items-center">
          <h3 className="font-bold text-dark-text">New Conversation</h3>
          <button 
            onClick={onClose}
            className="text-dark-text-secondary hover:text-dark-text"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-dark-element border border-dark-border rounded-md px-4 py-2 text-dark-text mb-4 focus:outline-none focus:ring-2 focus:ring-primary-purple"
          />
          
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-purple"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center text-dark-text-secondary py-4">
                {searchTerm ? 'No users found' : 'No users available'}
              </div>
            ) : (
              <ul className="divide-y divide-dark-border">
                {filteredUsers.map((u) => (
                  <li key={u.id} className="py-2">
                    <button
                      onClick={() => onSelectUser(u)}
                      className="w-full text-left hover:bg-dark-element transition-colors rounded-md p-2 flex items-center space-x-3"
                    >
                      {u.avatar_url ? (
                        <img 
                          src={u.avatar_url} 
                          alt={u.full_name || u.email || 'User'}
                          className="h-10 w-10 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-purple flex items-center justify-center text-dark-text text-sm flex-shrink-0">
                          {getUserInitials(u.full_name, u.email)}
                        </div>
                      )}
                      
                      <div>
                        {u.full_name && (
                          <div className="font-medium text-dark-text">{u.full_name}</div>
                        )}
                        <div className="text-sm text-dark-text-secondary">{u.email}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ChatWindow component
export function ChatWindow({ 
  conversation,
  onBack
}: { 
  conversation: Conversation | null;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const extendedUser = user as ExtendedUser | null;

  // Get the other participant in the conversation
  const otherParticipant = user && conversation ? (
    conversation.participant1_id === user.id
      ? { id: conversation.participant2_id, ...conversation.participant2 }
      : { id: conversation.participant1_id, ...conversation.participant1 }
  ) : null;

  // Load messages when conversation changes
  useEffect(() => {
    async function loadMessages() {
      if (!conversation || !user) return;
      
      setLoading(true);
      
      // Mark messages as read
      await markMessagesAsRead(conversation.id, user.id);
      
      // Get messages
      const { messages, error } = await getPrivateMessages(conversation.id, 50, 0);
      
      if (error) {
        toast.error('Failed to load messages');
        console.error(error);
      } else {
        // Sort messages by created_at in ascending order for display
        setMessages(messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ));
      }
      
      setLoading(false);
    }

    loadMessages();
  }, [conversation, user]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversation) return;
    
    const unsubscribe = subscribeToPrivateMessages(conversation.id, (newMessage) => {
      setMessages(currentMessages => {
        // Check if message already exists to prevent duplicates
        if (currentMessages.some(m => m.id === newMessage.id)) {
          return currentMessages;
        }
        
        // Add new message and sort by date
        const updatedMessages = [...currentMessages, newMessage];
        return updatedMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      
      // Mark messages as read if from other user
      if (user && newMessage.sender_id !== user.id) {
        markMessagesAsRead(conversation.id, user.id);
      }
    });

    // Cleanup subscription when component unmounts or conversation changes
    return () => {
      unsubscribe();
    };
  }, [conversation, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !conversation) {
      toast.error('Cannot send message');
      return;
    }
    
    if (!newMessage.trim()) {
      return;
    }
    
    setSending(true);
    
    try {
      const { message, error } = await sendPrivateMessage(
        conversation.id,
        user.id,
        newMessage.trim()
      );
      
      if (error) {
        throw new Error(error);
      }
      
      // Clear the input field
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message');
      console.error(err);
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
  const isCurrentUser = (senderId: string) => {
    return user?.id === senderId;
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

  // If no conversation is selected
  if (!conversation) {
    return (
      <div className="flex-1 bg-dark-card rounded-lg shadow-md border border-dark-border flex items-center justify-center">
        <div className="text-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-dark-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="text-lg font-medium text-dark-text mb-1">No conversation selected</h3>
          <p className="text-dark-text-secondary">
            Select a conversation from the list or start a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-dark-card rounded-lg shadow-md border border-dark-border overflow-hidden flex flex-col h-[75vh]">
      {/* Header */}
      <div className="bg-dark-element p-4 border-b border-dark-border flex items-center">
        <button
          onClick={onBack}
          className="md:hidden mr-2 text-dark-text"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        <div className="flex items-center">
          {otherParticipant?.avatar_url ? (
            <img 
              src={otherParticipant.avatar_url} 
              alt={otherParticipant.full_name || otherParticipant.email || 'User'}
              className="h-10 w-10 rounded-full mr-3"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-purple flex items-center justify-center text-dark-text text-sm mr-3">
              {getUserInitials(otherParticipant?.full_name, otherParticipant?.email)}
            </div>
          )}
          
          <div>
            <h3 className="font-bold text-dark-text">
              {otherParticipant?.full_name || otherParticipant?.email || 'Unknown User'}
            </h3>
          </div>
        </div>
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
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex items-start ${isCurrentUser(message.sender_id) ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser(message.sender_id) && (
                  <div className="flex-shrink-0 mr-3">
                    {message.sender?.avatar_url ? (
                      <img 
                        src={message.sender.avatar_url} 
                        alt={message.sender.full_name || message.sender.email || 'User'}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-purple flex items-center justify-center text-dark-text text-xs">
                        {getUserInitials(message.sender?.full_name, message.sender?.email)}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`
                  max-w-xs sm:max-w-md px-4 py-2 rounded-lg
                  ${isCurrentUser(message.sender_id) 
                    ? 'bg-primary-purple text-dark-text rounded-tr-none' 
                    : 'bg-dark-element text-dark-text rounded-tl-none'}
                `}>
                  <div className="break-words">
                    {message.content}
                  </div>
                  
                  <div className="text-xs mt-1 text-right text-dark-text-secondary">
                    {formatTimestamp(message.created_at)}
                  </div>
                </div>
                
                {isCurrentUser(message.sender_id) && (
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
      </div>
    </div>
  );
}

// Main PrivateChat component that combines ConversationList and ChatWindow
export default function PrivateChat() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Handle selecting a conversation
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
  };

  // Handle going back to the conversation list on mobile
  const handleBack = () => {
    setShowMobileChat(false);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Conversation list (hidden on mobile when chat is shown) */}
      <div className={`${showMobileChat ? 'hidden md:block' : 'block'}`}>
        <ConversationList onSelectConversation={handleSelectConversation} />
      </div>
      
      {/* Chat window (hidden on mobile when list is shown) */}
      <div className={`${!showMobileChat ? 'hidden md:block' : 'block'} flex-1`}>
        <ChatWindow 
          conversation={selectedConversation} 
          onBack={handleBack}
        />
      </div>
    </div>
  );
}