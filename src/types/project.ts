// types/project.ts

export interface Milestone {
  task: string;
  description: string;
  estimatedTime: string;
  resourceLink: string;
}

export interface CodeSnippet {
  milestoneIndex: number;
  code: string;
  debugHint?: string;
}

export interface ResourcePack {
  links: string[];
  wildcardLink: string;
  markdownContent: string;
}

export interface ProjectDetails {
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

export interface ChatResponse {
  message: string;
  followUpQuestions: string[];
  resourceLink: string;
}

export interface ProjectResponse {
  project: ProjectDetails;
  chatResponse: ChatResponse;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: Date;
  followUpQuestions?: string[];
}

export interface SavedProject {
  id: string;
  user_id: string;
  project_details: ProjectDetails;
  concept?: string;
  experience_level?: number;
  domain?: string;
  created_at: string;
  updated_at: string;
}