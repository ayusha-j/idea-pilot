export interface ProjectNote {
  id: string;
  projectId: string;
  projectTitle: string;
  type: 'general' | 'milestone' | 'resource' | 'code';
  targetId?: string; // milestone index, resource URL, etc.
  content: string;
  isHighlighted: boolean;
  isBookmarked: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteHighlight {
  id: string;
  projectId: string;
  targetType: 'milestone' | 'resource' | 'description';
  targetId: string;
  text: string;
  startOffset: number;
  endOffset: number;
  color: string;
  note?: string;
  createdAt: string;
}

export interface ProjectBookmark {
  id: string;
  projectId: string;
  type: 'milestone' | 'resource' | 'tool' | 'code';
  targetId: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface NotesExport {
  projectTitle: string;
  projectDescription: string;
  exportDate: string;
  notes: ProjectNote[];
  highlights: NoteHighlight[];
  bookmarks: ProjectBookmark[];
}