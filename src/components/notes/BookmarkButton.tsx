'use client';

import React from 'react';
import { useProjectNotes } from '@/hooks/useProjectNotes';

interface BookmarkButtonProps {
  projectId: string;
  projectTitle: string;
  type: 'milestone' | 'resource' | 'tool' | 'code';
  targetId: string;
  title: string;
  description?: string;
  className?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  projectId,
  projectTitle,
  type,
  targetId,
  title,
  description,
  className = ''
}) => {
  const { isBookmarked, addBookmark, removeBookmark, bookmarks } = useProjectNotes(projectId, projectTitle);

  const bookmarked = isBookmarked(type, targetId);
  const bookmark = bookmarks.find(b => b.type === type && b.targetId === targetId);

  const handleToggleBookmark = () => {
    if (bookmarked && bookmark) {
      removeBookmark(bookmark.id);
    } else {
      addBookmark(type, targetId, title, description);
    }
  };

  return (
    <button
      onClick={handleToggleBookmark}
      className={`p-2 rounded-lg transition-colors ${
        bookmarked 
          ? 'text-accent-yellow hover:text-accent-yellow/80' 
          : 'text-dark-text-secondary hover:text-accent-yellow'
      } ${className}`}
      title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-5 h-5" 
        fill={bookmarked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
        />
      </svg>
    </button>
  );
};