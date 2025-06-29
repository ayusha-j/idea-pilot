'use client';

import React, { useState, useRef } from 'react';
import { useProjectNotes } from '@/hooks/useProjectNotes';

interface HighlightableTextProps {
  text: string;
  projectId: string;
  projectTitle: string;
  targetType: 'milestone' | 'resource' | 'description';
  targetId: string;
  className?: string;
}

export const HighlightableText: React.FC<HighlightableTextProps> = ({
  text,
  projectId,
  projectTitle,
  targetType,
  targetId,
  className = ''
}) => {
  const { highlights, addHighlight, getHighlightsByTarget } = useProjectNotes(projectId, projectTitle);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const textRef = useRef<HTMLDivElement>(null);

  const existingHighlights = getHighlightsByTarget(targetType, targetId);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && textRef.current) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();
      
      // Calculate position relative to the text container
      const containerRect = textRef.current.getBoundingClientRect();
      const rangeRect = range.getBoundingClientRect();
      
      setSelectedText(selectedText);
      setSelectionRange({
        start: range.startOffset,
        end: range.endOffset
      });
      setMenuPosition({
        x: rangeRect.left - containerRect.left + rangeRect.width / 2,
        y: rangeRect.top - containerRect.top - 10
      });
      setShowHighlightMenu(true);
    }
  };

  const handleHighlight = (color: string) => {
    if (selectedText && selectionRange) {
      addHighlight(
        targetType,
        targetId,
        selectedText,
        selectionRange.start,
        selectionRange.end,
        color
      );
      setShowHighlightMenu(false);
      setSelectedText('');
      setSelectionRange(null);
      
      // Clear selection
      window.getSelection()?.removeAllRanges();
    }
  };

  const renderHighlightedText = () => {
    if (existingHighlights.length === 0) {
      return text;
    }

    // Sort highlights by start position
    const sortedHighlights = [...existingHighlights].sort((a, b) => a.startOffset - b.startOffset);
    
    let result = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.startOffset > lastIndex) {
        result.push(text.slice(lastIndex, highlight.startOffset));
      }

      // Add highlighted text
      result.push(
        <span
          key={`highlight-${index}`}
          className="px-1 rounded cursor-pointer"
          style={{ backgroundColor: `${highlight.color}40` }}
          title={highlight.note || 'Highlighted text'}
        >
          {text.slice(highlight.startOffset, highlight.endOffset)}
        </span>
      );

      lastIndex = highlight.endOffset;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    return result;
  };

  const highlightColors = [
    { name: 'Yellow', color: '#fbbf24' },
    { name: 'Green', color: '#10b981' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Pink', color: '#ec4899' },
    { name: 'Purple', color: '#6366f1' },
  ];

  return (
    <div className="relative">
      <div
        ref={textRef}
        className={`select-text cursor-text ${className}`}
        onMouseUp={handleTextSelection}
      >
        {renderHighlightedText()}
      </div>

      {showHighlightMenu && (
        <div
          className="absolute z-50 bg-dark-card border border-dark-border rounded-lg shadow-lg p-2"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-dark-text-secondary font-medium">Highlight:</span>
          </div>
          <div className="flex gap-1">
            {highlightColors.map(({ name, color }) => (
              <button
                key={color}
                onClick={() => handleHighlight(color)}
                className="w-6 h-6 rounded border-2 border-dark-border hover:border-dark-text transition-colors"
                style={{ backgroundColor: color }}
                title={`Highlight in ${name}`}
              />
            ))}
          </div>
          <button
            onClick={() => setShowHighlightMenu(false)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-dark-element border border-dark-border rounded-full flex items-center justify-center text-xs text-dark-text-secondary hover:text-dark-text"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};