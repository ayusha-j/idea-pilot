// src/types/project.ts
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
  role: 'user' | 'ai';
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  resourceLink?: string;
  followUpQuestions?: string[];
}