import { EnhancedResource, ResourceProcessingResponse } from '@/types/resource';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export class ResourceService {
  static async processResources(
    urls: string[], 
    projectContext: any, 
    projectId?: string
  ): Promise<ResourceProcessingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/process-resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls,
          projectContext,
          projectId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing resources:', error);
      throw error;
    }
  }

  static async getEnhancedResources(projectId: string): Promise<EnhancedResource[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/enhanced-resources/${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting enhanced resources:', error);
      throw error;
    }
  }
}