'use client';

import React, { useState } from 'react';
import { useProjectNotes } from '@/hooks/useProjectNotes';

interface QuickNoteButtonProps {
  projectId: string;
  projectTitle: string;
  type: 'milestone' | 'resource' | 'code' | 'general';
  targetId?: string;
  className?: string;
}

export const QuickNoteButton: React.FC<QuickNoteButtonProps> = ({
  projectId,
  projectTitle,
  type,
  targetId,
  className = ''
}) => {
  const { addNote, getNotesByTarget } = useProjectNotes(projectId, projectTitle);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const existingNotes = getNotesByTarget(type, targetId);
  const hasNotes = existingNotes.length > 0;

  const handleAddNote = () => {
    if (noteContent.trim()) {
      addNote(type, noteContent.trim(), targetId);
      setNoteContent('');
      setShowNoteInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddNote();
    } else if (e.key === 'Escape') {
      setShowNoteInput(false);
      setNoteContent('');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowNoteInput(!showNoteInput)}
        className={`p-2 rounded-lg transition-colors ${
          hasNotes 
            ? 'text-primary-blue hover:text-primary-purple' 
            : 'text-dark-text-secondary hover:text-primary-blue'
        } ${className}`}
        title={hasNotes ? `${existingNotes.length} note(s)` : 'Add note'}
      >
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {hasNotes && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-blue text-dark-text text-xs rounded-full flex items-center justify-center">
              {existingNotes.length}
            </span>
          )}
        </div>
      </button>

      {showNoteInput && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-dark-card border border-dark-border rounded-lg shadow-lg p-4 z-50">
          <h4 className="font-medium text-dark-text mb-2 font-cabin">Add Note</h4>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your note here..."
            className="w-full p-3 bg-dark-element border border-dark-border rounded-lg text-dark-text resize-none h-24 font-source focus:outline-none focus:ring-2 focus:ring-primary-purple"
            autoFocus
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-dark-text-secondary">Ctrl+Enter to save, Esc to cancel</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNoteInput(false);
                  setNoteContent('');
                }}
                className="px-3 py-1 text-dark-text-secondary hover:text-dark-text transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!noteContent.trim()}
                className="px-3 py-1 bg-primary-purple text-dark-text rounded hover:bg-accent-pink transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};