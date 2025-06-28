'use client';

import React from 'react';
import { DomainMismatchData } from '@/types/project';

interface DomainMismatchModalProps {
  data: DomainMismatchData;
  onSwitchDomain: (domain: string) => void;
  onModifyConcept: () => void;
  onClose: () => void;
}

const DomainMismatchModal: React.FC<DomainMismatchModalProps> = ({
  data,
  onSwitchDomain,
  onModifyConcept,
  onClose
}) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-dark-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-yellow bg-opacity-20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-accent-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dark-text font-cabin">
              We noticed something interesting...
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-element rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          <p className="text-dark-text leading-relaxed font-source">
            {data.message}
          </p>

          {/* Detected Keywords */}
          <div className="space-y-3">
            <h4 className="font-medium text-dark-text font-cabin">Detected keywords:</h4>
            <div className="flex flex-wrap gap-2">
              {data.detectedKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-blue bg-opacity-20 text-primary-blue rounded-full text-sm font-medium border border-primary-blue border-opacity-30"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="space-y-3">
            <h4 className="font-medium text-dark-text font-cabin">Your options:</h4>
            <ul className="space-y-2">
              {data.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-dark-text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary-purple mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="text-sm font-source">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onSwitchDomain(data.suggestedDomain)}
              className="w-full flex items-center justify-center gap-2 bg-primary-purple hover:bg-accent-pink text-dark-text font-medium py-3 px-4 rounded-lg transition-colors font-cabin"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Switch to {data.suggestedDomain}
            </button>
            
            <button
              onClick={onModifyConcept}
              className="w-full flex items-center justify-center gap-2 border border-primary-purple border-opacity-30 hover:bg-primary-purple hover:bg-opacity-10 text-primary-purple font-medium py-3 px-4 rounded-lg transition-colors font-cabin"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modify my concept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainMismatchModal;