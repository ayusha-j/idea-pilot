// lib/api.ts
import { ProjectDetails, ChatMessage, ChatResponse } from '@/types/project';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://168.231.122.158/api';

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
  const response = await fetch(`${API_URL}/api/mentor-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      projectContext,
      messageHistory: messageHistory.map(m => ({
        sender: m.sender,
        text: m.text
      })),
      userId,
      projectId,
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

// src/lib/api.ts (add this function if you have an API service file)

export const regenerateProject = async (): Promise<unknown> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/regenerate-project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Includes cookies for session handling
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to regenerate project');
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('Error regenerating project:', error);
    throw error;
  }
};