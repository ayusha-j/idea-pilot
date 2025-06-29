'use client';

import React, { useState } from 'react';
import { ProjectNote } from '@/types/notes';
import { useProjectNotes } from '@/hooks/useProjectNotes';

interface NotesPanelProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  projectId,
  projectTitle,
  isOpen,
  onClose
}) => {
  const {
    notes,
    bookmarks,
    highlights,
    addNote,
    updateNote,
    deleteNote,
    exportAsMarkdown
  } = useProjectNotes(projectId, projectTitle);

  const [activeTab, setActiveTab] = useState<'notes' | 'bookmarks' | 'highlights'>('notes');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      const tags = newNoteTags.split(',').map(tag => tag.trim()).filter(Boolean);
      addNote('general', newNoteContent.trim(), undefined, tags);
      setNewNoteContent('');
      setNewNoteTags('');
    }
  };

  const handleUpdateNote = (noteId: string, content: string) => {
    updateNote(noteId, { content });
    setEditingNote(null);
  };

  const handleExportNotes = () => {
    const markdown = exportAsMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, '-').toLowerCase()}-notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-dark-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border bg-dark-element">
          <div>
            <h2 className="text-xl font-bold text-dark-text font-cabin">Project Notes & Annotations</h2>
            <p className="text-dark-text-secondary text-sm font-source">{projectTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportNotes}
              className="flex items-center gap-2 px-3 py-2 bg-primary-blue text-dark-text rounded-lg hover:bg-primary-purple transition-colors text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-border rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-border bg-dark-element">
          {[
            { id: 'notes', label: 'Notes', count: notes.length },
            { id: 'bookmarks', label: 'Bookmarks', count: bookmarks.length },
            { id: 'highlights', label: 'Highlights', count: highlights.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-purple border-b-2 border-primary-purple'
                  : 'text-dark-text-secondary hover:text-dark-text'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Add new note */}
              <div className="bg-dark-element rounded-lg p-4">
                <h3 className="font-medium text-dark-text mb-3 font-cabin">Add New Note</h3>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write your note here..."
                  className="w-full p-3 bg-dark-card border border-dark-border rounded-lg text-dark-text resize-none h-24 font-source"
                />
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="text"
                    value={newNoteTags}
                    onChange={(e) => setNewNoteTags(e.target.value)}
                    placeholder="Tags (comma-separated)"
                    className="flex-1 p-2 bg-dark-card border border-dark-border rounded-lg text-dark-text text-sm font-source"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim()}
                    className="px-4 py-2 bg-primary-purple text-dark-text rounded-lg hover:bg-accent-pink transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Notes list */}
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-dark-text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No notes yet. Add your first note above!</p>
                  </div>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className="bg-dark-element rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            note.type === 'general' ? 'bg-primary-blue bg-opacity-20 text-primary-blue' :
                            note.type === 'milestone' ? 'bg-secondary-green bg-opacity-20 text-secondary-green' :
                            note.type === 'resource' ? 'bg-secondary-orange bg-opacity-20 text-secondary-orange' :
                            'bg-accent-pink bg-opacity-20 text-accent-pink'
                          }`}>
                            {note.type}
                          </span>
                          <span className="text-xs text-dark-text-secondary">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingNote(editingNote === note.id ? null : note.id)}
                            className="p-1 hover:bg-dark-border rounded transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="p-1 hover:bg-dark-border rounded transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-badge-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {editingNote === note.id ? (
                        <div className="space-y-3">
                          <textarea
                            defaultValue={note.content}
                            className="w-full p-3 bg-dark-card border border-dark-border rounded-lg text-dark-text resize-none h-24 font-source"
                            onBlur={(e) => handleUpdateNote(note.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                handleUpdateNote(note.id, e.currentTarget.value);
                              }
                            }}
                            autoFocus
                          />
                          <p className="text-xs text-dark-text-secondary">Press Ctrl+Enter to save</p>
                        </div>
                      ) : (
                        <p className="text-dark-text font-source whitespace-pre-wrap">{note.content}</p>
                      )}
                      
                      {note.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {note.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-dark-border text-dark-text-secondary rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              {bookmarks.length === 0 ? (
                <div className="text-center py-8 text-dark-text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <p>No bookmarks yet. Bookmark important sections while reading!</p>
                </div>
              ) : (
                bookmarks.map(bookmark => (
                  <div key={bookmark.id} className="bg-dark-element rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            bookmark.type === 'milestone' ? 'bg-secondary-green bg-opacity-20 text-secondary-green' :
                            bookmark.type === 'resource' ? 'bg-secondary-orange bg-opacity-20 text-secondary-orange' :
                            bookmark.type === 'tool' ? 'bg-primary-blue bg-opacity-20 text-primary-blue' :
                            'bg-accent-pink bg-opacity-20 text-accent-pink'
                          }`}>
                            {bookmark.type}
                          </span>
                          <span className="text-xs text-dark-text-secondary">
                            {new Date(bookmark.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-medium text-dark-text font-cabin">{bookmark.title}</h4>
                        {bookmark.description && (
                          <p className="text-dark-text-secondary text-sm mt-1 font-source">{bookmark.description}</p>
                        )}
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-accent-yellow" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'highlights' && (
            <div className="space-y-4">
              {highlights.length === 0 ? (
                <div className="text-center py-8 text-dark-text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 3v10a1 1 0 001 1h8a1 1 0 001-1V7M9 7h6M9 11h6m-6 4h6" />
                  </svg>
                  <p>No highlights yet. Select text to highlight important parts!</p>
                </div>
              ) : (
                highlights.map(highlight => (
                  <div key={highlight.id} className="bg-dark-element rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        highlight.targetType === 'milestone' ? 'bg-secondary-green bg-opacity-20 text-secondary-green' :
                        highlight.targetType === 'resource' ? 'bg-secondary-orange bg-opacity-20 text-secondary-orange' :
                        'bg-primary-blue bg-opacity-20 text-primary-blue'
                      }`}>
                        {highlight.targetType}
                      </span>
                      <span className="text-xs text-dark-text-secondary">
                        {new Date(highlight.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div 
                      className="p-3 rounded border-l-4 font-source"
                      style={{ 
                        backgroundColor: `${highlight.color}20`,
                        borderLeftColor: highlight.color 
                      }}
                    >
                      <p className="text-dark-text italic">"{highlight.text}"</p>
                      {highlight.note && (
                        <p className="text-dark-text-secondary text-sm mt-2">{highlight.note}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};