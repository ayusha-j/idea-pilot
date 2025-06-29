// lib/api.ts
import { ProjectDetails, ChatMessage, ChatResponse } from '@/types/project';

const API_URL = '/api'; // Use relative URL to work with proxied routes

/**
 * Generate a project idea
 */
export async function generateProject(
  conceptText: string,
  experienceLevel: number,
  domain: string
): Promise<{ project: ProjectDetails; chatResponse: ChatResponse }> {
  const response = await fetch(`${API_URL}/generate-project`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conceptText,
      experienceLevel,
      domain,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate project');
  }

  return await response.json();
}

/**
 * Send a message to the AI mentor
 */
export async function sendMentorMessage(
  message: string,
  projectContext: ProjectDetails,
  messageHistory: ChatMessage[],
  userId?: string,
  projectId?: string
): Promise<{ chatResponse: ChatResponse; userId: string; projectId: string }> {
  console.log('API: Sending mentor message with context:', {
    message: message.substring(0, 50) + '...',
    projectTitle: projectContext?.title,
    projectDescription: projectContext?.description,
    hasProjectContext: !!projectContext,
    messageHistoryLength: messageHistory.length
  });

  const requestBody = {
    message,
    projectContext: {
      title: projectContext?.title || '',
      description: projectContext?.description || '',
      difficulty: projectContext?.difficulty || 'Intermediate',
      domain: projectContext?.domain || '',
      vibe: projectContext?.vibe || '',
      milestones: projectContext?.milestones || [],
      tools: projectContext?.tools || [],
      codeSnippets: projectContext?.codeSnippets || [],
      resourcePack: projectContext?.resourcePack || { links: [], wildcardLink: '', markdownContent: '' }
    },
    messageHistory: messageHistory.map(m => ({
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp?.toISOString() || new Date().toISOString()
    })),
    userId,
    projectId,
  };

  console.log('API: Request body structure:', {
    hasMessage: !!requestBody.message,
    hasProjectContext: !!requestBody.projectContext,
    projectTitle: requestBody.projectContext.title,
    projectDescription: requestBody.projectContext.description,
    messageHistoryLength: requestBody.messageHistory.length
  });

  const response = await fetch(`${API_URL}/mentor-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API: Mentor chat error response:', error);
    throw new Error(error.error || 'Failed to get response');
  }

  const result = await response.json();
  console.log('API: Mentor chat success response:', {
    hasResponse: !!result.chatResponse,
    responseMessage: result.chatResponse?.message?.substring(0, 100) + '...',
    userId: result.userId,
    projectId: result.projectId
  });

  return result;
}

/**
 * Send a message to the AI mentor with resource context
 */
export async function mentorChatWithResources(
  message: string,
  projectContext: any,
  userId?: string,
  projectId?: string
): Promise<{ chatResponse: ChatResponse; userId: string; projectId: string; hasEnhancedResources?: boolean }> {
  const response = await fetch(`${API_URL}/mentor-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      projectContext,
      userId,
      projectId
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get response');
  }

  return await response.json();
}

/**
 * Get chat history
 */
export async function getChatHistory(
  userId: string,
  projectId: string
): Promise<{ history: ChatMessage[] }> {
  const response = await fetch(
    `${API_URL}/mentor-chat/history?userId=${userId}&projectId=${projectId}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get chat history');
  }

  return await response.json();
}

/**
 * Clear chat history
 */
export async function clearChatHistory(
  userId: string,
  projectId: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/mentor-chat/clear`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      projectId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to clear chat history');
  }

  return await response.json();
}

/**
 * Save a project to the user's profile
 */
export async function saveProject(
  userId: string,
  project: any,
  concept?: string,
  experienceLevel?: number
): Promise<{ success: boolean; message: string; projectId?: string }> {
  try {
    console.log('Saving project for user:', userId);
    
    const response = await fetch(`${API_URL}/save-project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        project,
        concept,
        experienceLevel
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      throw new Error(errorData.error || 'Failed to save project');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
}

/**
 * Get user's saved projects
 */
export async function getUserProjects(userId: string): Promise<any[]> {
  try {
    console.log('Getting projects for user:', userId);
    
    const response = await fetch(`${API_URL}/user-projects/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      throw new Error(errorData.error || 'Failed to get user projects');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
}

/**
 * Get a specific project by ID
 */
export async function getProject(projectId: string): Promise<any> {
  try {
    console.log('Getting project:', projectId);
    
    const response = await fetch(`${API_URL}/project/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      throw new Error(errorData.error || 'Failed to get project');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
}