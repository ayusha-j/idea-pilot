'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMentorMessage, getChatHistory, clearChatHistory } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Define proper type interfaces aligned with ProjectDetails
interface ResourcePack {
  links: string[];
  wildcardLink: string;
  markdownContent: string;
}

interface Milestone {
  task: string;
  description: string;
  estimatedTime: string;
  resourceLink: string;
}

interface CodeSnippet {
  milestoneIndex: number;
  code: string;
  debugHint?: string;
}

interface ProjectDetails {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  domain: string;
  vibe: string;
  milestones: Milestone[];
  tools: string[];
  codeSnippets: CodeSnippet[];
  resourcePack: ResourcePack;
  
}

interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  resourceLink?: string;
  followUpQuestions?: string[];
}

interface ApiMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  resourceLink?: string;
  followUpQuestions?: string[];
}

interface AIMentorChatProps {
  projectContext: ProjectDetails;
  initialMessage?: string;
  followUpQuestions?: string[];
}

export default function AIMentorChat({
  projectContext,
  initialMessage,
  followUpQuestions
}: AIMentorChatProps) {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState<boolean>(false);
  
  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Debug: Log project context when component mounts or updates
  useEffect(() => {
    console.log('AIMentorChat: Project context received:', {
      hasProjectContext: !!projectContext,
      title: projectContext?.title,
      description: projectContext?.description,
      difficulty: projectContext?.difficulty,
      domain: projectContext?.domain,
      milestonesCount: projectContext?.milestones?.length || 0,
      toolsCount: projectContext?.tools?.length || 0,
      hasResourcePack: !!projectContext?.resourcePack
    });
  }, [projectContext]);

  // Create default greeting message using useCallback to avoid dependency issues
  const createDefaultGreeting = useCallback(() => {
    const projectTitle = projectContext?.title || 'your project';
    const projectDescription = projectContext?.description || '';
    
    let contextualGreeting = `Hi there! I'm your AI project mentor for "${projectTitle}".`;
    
    if (projectDescription) {
      contextualGreeting += ` I understand you're working on: ${projectDescription}`;
    }
    
    contextualGreeting += ` I'm here to help you with any questions about your project. What would you like to know?`;
    
    setMessages([
      {
        id: 1,
        role: 'ai',
        sender: 'ai',
        text: contextualGreeting,
        timestamp: new Date(),
        followUpQuestions: [
          "How do I get started with this project?",
          "What are the key challenges I should expect?",
          "Can you explain the technical requirements?",
          "What resources do you recommend?"
        ]
      }
    ]);
  }, [projectContext?.title, projectContext?.description]);

  // Initialize with the provided initial message if available
  useEffect(() => {
    if (initialMessage && messages.length === 0 && !isHistoryLoaded) {
      setMessages([
        {
          id: 1,
          role: 'ai',
          sender: 'ai',
          text: initialMessage,
          followUpQuestions: followUpQuestions || [],
          timestamp: new Date()
        }
      ]);
      setIsHistoryLoaded(true);
    }
  }, [initialMessage, followUpQuestions, messages.length, isHistoryLoaded]);

  // Load existing chat session from localStorage on component mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const storedUserId = localStorage.getItem('mentor_chat_user_id');
        const storedProjectId = localStorage.getItem(`mentor_chat_project_id_${projectContext?.title || 'default'}`);
        
        if (storedUserId) {
          setUserId(storedUserId);
        }
        
        if (storedProjectId) {
          setProjectId(storedProjectId);
        }
      } catch (error) {
        console.error('Error loading chat session from localStorage:', error);
      }
    };
    
    loadSession();
  }, [projectContext?.title]);
  
  // Load chat history when userId and projectId are available
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!projectContext?.title) return;
      
      if (userId && projectId && !isHistoryLoaded) {
        try {
          setIsLoading(true);
          const { history } = await getChatHistory(userId, projectId);
          
          // Convert server timestamps to Date objects
          const formattedHistory = (history as unknown as ApiMessage[]).map((msg, index) => ({
            id: index + 1,
            role: msg.role,
            sender: msg.role,
            text: msg.content,
            timestamp: new Date(msg.timestamp),
            resourceLink: msg.resourceLink,
            followUpQuestions: msg.followUpQuestions
          })) as ChatMessage[];
          
          if (formattedHistory.length > 0) {
            setMessages(formattedHistory);
          } else if (!initialMessage) {
            // Add default greeting if no history and no initial message
            createDefaultGreeting();
          }
          
          setIsHistoryLoaded(true);
        } catch (error) {
          console.error('Error loading chat history:', error);
          // Fall back to default greeting if no initial message
          if (!initialMessage) {
            createDefaultGreeting();
          }
          setIsHistoryLoaded(true);
        } finally {
          setIsLoading(false);
        }
      } else if (!isHistoryLoaded && !initialMessage) {
        // No stored session and no initial message, add default greeting
        createDefaultGreeting();
        setIsHistoryLoaded(true);
      }
    };
    
    loadChatHistory();
  }, [userId, projectId, projectContext, isHistoryLoaded, initialMessage, createDefaultGreeting]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Scroll to bottom of chat
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    const messageText = newMessage.trim();
    if (!messageText || isLoading) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: messages.length + 1,
      role: 'user',
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    
    try {
      console.log('Sending mentor message with project context:', {
        projectTitle: projectContext?.title,
        projectDescription: projectContext?.description,
        messageText: messageText,
        hasFullContext: !!projectContext
      });
      
      // Ensure we have a complete project context - this is the key fix
      const fullProjectContext = {
        title: projectContext?.title || '',
        description: projectContext?.description || '',
        difficulty: projectContext?.difficulty || 'Intermediate',
        domain: projectContext?.domain || '',
        vibe: projectContext?.vibe || '',
        milestones: projectContext?.milestones || [],
        tools: projectContext?.tools || [],
        codeSnippets: projectContext?.codeSnippets || [],
        resourcePack: projectContext?.resourcePack || { links: [], wildcardLink: '', markdownContent: '' }
      };
      
      console.log('Full project context being sent:', fullProjectContext);
      
      // Call API with current context - ensure we're passing the full project context
      const response = await sendMentorMessage(
        messageText,
        fullProjectContext, // This should contain the full project details
        messages,
        userId,
        projectId
      );
      
      console.log('Mentor response received:', response);
      
      // Store session IDs
      if (response.userId && response.userId !== userId) {
        setUserId(response.userId);
        localStorage.setItem('mentor_chat_user_id', response.userId);
      }
      
      if (response.projectId && response.projectId !== projectId) {
        setProjectId(response.projectId);
        localStorage.setItem(`mentor_chat_project_id_${projectContext?.title || 'default'}`, response.projectId);
      }
      
      // Add AI response
      const aiResponse: ChatMessage = {
        id: messages.length + 2,
        role: 'ai',
        sender: 'ai',
        text: response.chatResponse.message,
        resourceLink: response.chatResponse.resourceLink,
        followUpQuestions: response.chatResponse.followUpQuestions,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Show more helpful error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('ngrok') || errorMessage.includes('Backend server')) {
        toast.error('Backend connection error. Please check that your Flask server is running and ngrok URL is updated.');
      } else {
        toast.error('Failed to get AI response. Please try again.');
      }
      
      // Add error message
      const errorMessage2: ChatMessage = {
        id: messages.length + 2,
        role: 'ai',
        sender: 'ai',
        text: "Sorry, I'm having trouble connecting to the backend right now. Please check that the Flask server is running and the ngrok URL is current.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage2]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle clicking a quick reply button
  const handleQuickReply = (question: string): void => {
    setNewMessage(question);
    
    // Focus on input after setting the quick reply
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (input) {
      setTimeout(() => {
        input.focus();
      }, 0);
    }
  };
  
  // Clear chat history
  const handleClearChat = async (): Promise<void> => {
    if ((!userId || !projectId) && messages.length === 0) return;
    
    try {
      if (userId && projectId) {
        await clearChatHistory(userId, projectId);
      }
      
      // Reset messages to initial greeting
      if (initialMessage) {
        setMessages([
          {
            id: 1,
            role: 'ai',
            sender: 'ai',
            text: initialMessage,
            followUpQuestions: followUpQuestions || [],
            timestamp: new Date()
          }
        ]);
      } else {
        createDefaultGreeting();
      }
      
      toast.success('Chat history cleared');
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toast.error('Failed to clear chat history');
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-card rounded-lg shadow-md border border-dark-border overflow-hidden pb-10">
      {/* Chat header */}
      <div className="bg-dark-element text-dark-text p-4 font-cabin flex justify-between items-center">
        <div>
          <h3 className="font-bold">AI Project Mentor</h3>
          <p className="text-sm text-dark-text-secondary">
            {projectContext?.title ? `Helping with: ${projectContext.title}` : 'Ask questions about your project and get personalized guidance'}
          </p>
        </div>
        <button
          onClick={handleClearChat}
          className="text-xs px-2 py-1 bg-dark-element text-dark-text-secondary border border-dark-border rounded hover:text-dark-text transition-colors"
          title="Clear chat history"
        >
          Clear History
        </button>
      </div>
      
      {/* Messages container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto bg-dark-bg"
        style={{ maxHeight: 'calc(500px - 120px)' }}
      >
        {isHistoryLoaded ? (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary-purple bg-opacity-20 text-dark-text border border-primary-purple border-opacity-30'
                      : 'bg-dark-card text-dark-text border border-dark-border'
                  }`}
                >
                  <p className="font-source">{message.text}</p>
                  
                  {message.resourceLink && (
                    <a
                      href={message.resourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 text-sm text-primary-blue hover:underline"
                    >
                      View Resource
                    </a>
                  )}
                  
                  {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.followUpQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickReply(question)}
                          className="block w-full text-left text-sm p-2 bg-accent-yellow bg-opacity-20 rounded-md hover:bg-opacity-30 transition-colors"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <span className="block mt-1 text-right text-xs text-dark-text-secondary">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-dark-card text-dark-text border border-dark-border rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-dark-text-secondary animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-dark-text-secondary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-dark-text-secondary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-dark-text-secondary animate-bounce"></div>
              <div className="w-3 h-3 rounded-full bg-dark-text-secondary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 rounded-full bg-dark-text-secondary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSendMessage} className="border-t border-dark-border p-3 bg-dark-element">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
            placeholder={`Ask about ${projectContext?.title || 'your project'}...`}
            className="flex-1 p-4 bg-dark-card border border-dark-border text-dark-text rounded-md focus:outline-none focus:ring-2 focus:ring-primary-purple font-source"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className={`ml-2 p-2 ${
              isLoading || !newMessage.trim() 
                ? 'bg-dark-element text-dark-text-secondary cursor-not-allowed' 
                : 'bg-primary-purple text-dark-text hover:bg-accent-pink'
            } rounded-md transition-colors duration-200`}
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}