'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProjectNote, NoteHighlight, ProjectBookmark } from '@/types/notes';

export function useProjectNotes(projectId: string, projectTitle: string) {
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [highlights, setHighlights] = useState<NoteHighlight[]>([]);
  const [bookmarks, setBookmarks] = useState<ProjectBookmark[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes from localStorage
  useEffect(() => {
    const loadNotes = () => {
      try {
        // Load notes
        const storedNotes = localStorage.getItem(`project_notes_${projectId}`);
        if (storedNotes) {
          setNotes(JSON.parse(storedNotes));
        }

        // Load highlights
        const storedHighlights = localStorage.getItem(`project_highlights_${projectId}`);
        if (storedHighlights) {
          setHighlights(JSON.parse(storedHighlights));
        }

        // Load bookmarks
        const storedBookmarks = localStorage.getItem(`project_bookmarks_${projectId}`);
        if (storedBookmarks) {
          setBookmarks(JSON.parse(storedBookmarks));
        }
      } catch (error) {
        console.error('Error loading project notes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadNotes();
    }
  }, [projectId]);

  // Save notes to localStorage
  const saveNotes = useCallback((newNotes: ProjectNote[]) => {
    try {
      localStorage.setItem(`project_notes_${projectId}`, JSON.stringify(newNotes));
      setNotes(newNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }, [projectId]);

  // Save highlights to localStorage
  const saveHighlights = useCallback((newHighlights: NoteHighlight[]) => {
    try {
      localStorage.setItem(`project_highlights_${projectId}`, JSON.stringify(newHighlights));
      setHighlights(newHighlights);
    } catch (error) {
      console.error('Error saving highlights:', error);
    }
  }, [projectId]);

  // Save bookmarks to localStorage
  const saveBookmarks = useCallback((newBookmarks: ProjectBookmark[]) => {
    try {
      localStorage.setItem(`project_bookmarks_${projectId}`, JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }, [projectId]);

  // Add a new note
  const addNote = useCallback((
    type: ProjectNote['type'],
    content: string,
    targetId?: string,
    tags: string[] = []
  ) => {
    const newNote: ProjectNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      projectTitle,
      type,
      targetId,
      content,
      isHighlighted: false,
      isBookmarked: false,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [...notes, newNote];
    saveNotes(updatedNotes);
    return newNote;
  }, [notes, projectId, projectTitle, saveNotes]);

  // Update a note
  const updateNote = useCallback((noteId: string, updates: Partial<ProjectNote>) => {
    const updatedNotes = notes.map(note =>
      note.id === noteId
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    );
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  // Delete a note
  const deleteNote = useCallback((noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  // Add a highlight
  const addHighlight = useCallback((
    targetType: NoteHighlight['targetType'],
    targetId: string,
    text: string,
    startOffset: number,
    endOffset: number,
    color: string = '#fbbf24',
    note?: string
  ) => {
    const newHighlight: NoteHighlight = {
      id: `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      targetType,
      targetId,
      text,
      startOffset,
      endOffset,
      color,
      note,
      createdAt: new Date().toISOString(),
    };

    const updatedHighlights = [...highlights, newHighlight];
    saveHighlights(updatedHighlights);
    return newHighlight;
  }, [highlights, projectId, saveHighlights]);

  // Remove a highlight
  const removeHighlight = useCallback((highlightId: string) => {
    const updatedHighlights = highlights.filter(h => h.id !== highlightId);
    saveHighlights(updatedHighlights);
  }, [highlights, saveHighlights]);

  // Add a bookmark
  const addBookmark = useCallback((
    type: ProjectBookmark['type'],
    targetId: string,
    title: string,
    description?: string
  ) => {
    const newBookmark: ProjectBookmark = {
      id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      type,
      targetId,
      title,
      description,
      createdAt: new Date().toISOString(),
    };

    const updatedBookmarks = [...bookmarks, newBookmark];
    saveBookmarks(updatedBookmarks);
    return newBookmark;
  }, [bookmarks, projectId, saveBookmarks]);

  // Remove a bookmark
  const removeBookmark = useCallback((bookmarkId: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    saveBookmarks(updatedBookmarks);
  }, [bookmarks, saveBookmarks]);

  // Check if something is bookmarked
  const isBookmarked = useCallback((type: string, targetId: string) => {
    return bookmarks.some(b => b.type === type && b.targetId === targetId);
  }, [bookmarks]);

  // Get notes by type or target
  const getNotesByTarget = useCallback((type?: string, targetId?: string) => {
    return notes.filter(note => {
      if (type && note.type !== type) return false;
      if (targetId && note.targetId !== targetId) return false;
      return true;
    });
  }, [notes]);

  // Get highlights by target
  const getHighlightsByTarget = useCallback((targetType: string, targetId: string) => {
    return highlights.filter(h => h.targetType === targetType && h.targetId === targetId);
  }, [highlights]);

  // Export notes as markdown
  const exportAsMarkdown = useCallback(() => {
    const exportData = {
      projectTitle,
      projectDescription: '',
      exportDate: new Date().toISOString(),
      notes,
      highlights,
      bookmarks,
    };

    let markdown = `# ${projectTitle} - Notes & Annotations\n\n`;
    markdown += `**Exported:** ${new Date().toLocaleDateString()}\n\n`;

    // General notes
    const generalNotes = notes.filter(n => n.type === 'general');
    if (generalNotes.length > 0) {
      markdown += `## 📝 General Notes\n\n`;
      generalNotes.forEach(note => {
        markdown += `### ${new Date(note.createdAt).toLocaleDateString()}\n`;
        markdown += `${note.content}\n\n`;
        if (note.tags.length > 0) {
          markdown += `**Tags:** ${note.tags.map(tag => `#${tag}`).join(', ')}\n\n`;
        }
      });
    }

    // Milestone notes
    const milestoneNotes = notes.filter(n => n.type === 'milestone');
    if (milestoneNotes.length > 0) {
      markdown += `## 🎯 Milestone Notes\n\n`;
      milestoneNotes.forEach(note => {
        markdown += `### Milestone ${note.targetId}\n`;
        markdown += `${note.content}\n\n`;
      });
    }

    // Resource notes
    const resourceNotes = notes.filter(n => n.type === 'resource');
    if (resourceNotes.length > 0) {
      markdown += `## 📚 Resource Notes\n\n`;
      resourceNotes.forEach(note => {
        markdown += `### Resource Note\n`;
        markdown += `${note.content}\n\n`;
      });
    }

    // Bookmarks
    if (bookmarks.length > 0) {
      markdown += `## 🔖 Bookmarks\n\n`;
      bookmarks.forEach(bookmark => {
        markdown += `- **${bookmark.title}** (${bookmark.type})\n`;
        if (bookmark.description) {
          markdown += `  ${bookmark.description}\n`;
        }
      });
      markdown += '\n';
    }

    // Highlights
    if (highlights.length > 0) {
      markdown += `## ✨ Highlights\n\n`;
      highlights.forEach(highlight => {
        markdown += `- "${highlight.text}"\n`;
        if (highlight.note) {
          markdown += `  *Note: ${highlight.note}*\n`;
        }
      });
    }

    return markdown;
  }, [projectTitle, notes, highlights, bookmarks]);

  return {
    notes,
    highlights,
    bookmarks,
    loading,
    addNote,
    updateNote,
    deleteNote,
    addHighlight,
    removeHighlight,
    addBookmark,
    removeBookmark,
    isBookmarked,
    getNotesByTarget,
    getHighlightsByTarget,
    exportAsMarkdown,
  };
}