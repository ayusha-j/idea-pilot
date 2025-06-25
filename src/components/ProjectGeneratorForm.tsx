// src/components/ProjectGeneratorForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { ProjectResponse } from '@/types/project';

// Define the props interface properly
interface ProjectGeneratorFormProps {
  onProjectGenerated: (projectData: ProjectResponse) => void;
}

export default function ProjectGeneratorForm({ onProjectGenerated }: ProjectGeneratorFormProps) {
  // Form state
  const [conceptText, setConceptText] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<number>(2);
  const [domain, setDomain] = useState<string>('coding');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call your API service
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/generate-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conceptText,
          experienceLevel,
          domain,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate project');
      }
      
      const projectData: ProjectResponse = await response.json();
      
      // Pass the data to parent component
      onProjectGenerated(projectData);
      
      // Trigger confetti on successful generation
      if (typeof window !== 'undefined' && window.confetti) {
        window.confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error('Error generating project:', error);
      alert('Failed to generate project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-dark-card rounded-lg shadow-md border border-dark-border overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-primary-purple to-primary-blue text-dark-text">
        <h2 className="text-xl font-bold font-cabin">Generate Project Idea</h2>
      </div>
      
      <form className="p-6" onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="concept" className="block text-dark-text font-cabin font-medium mb-2">
            Concept or Learning Goal
          </label>
          <textarea
            id="concept"
            name="concept"
            value={conceptText}
            onChange={(e) => setConceptText(e.target.value)}
            required
            placeholder="Describe what you want to learn or build, e.g., 'A web app that helps track habits' or 'Learn TensorFlow by building something'"
            className="w-full p-3 bg-dark-element border border-dark-border rounded-md text-dark-text font-source focus:outline-none focus:ring-2 focus:ring-primary-purple resize-none min-h-[120px]"
          ></textarea>
        </div>
        
        <div className="mb-6">
          <label htmlFor="experience" className="block text-dark-text font-cabin font-medium mb-2">
            Experience Level
          </label>
          <div className="flex flex-col">
            <input
              id="experience"
              name="experience"
              type="range"
              min="1"
              max="3"
              step="1"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(parseInt(e.target.value))}
              className="w-full accent-primary-purple mb-2"
            />
            <div className="flex justify-between text-sm text-dark-text-secondary">
              <span>Beginner</span>
              <span>Intermediate</span>
              <span>Advanced</span>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-dark-text font-cabin font-medium mb-2">
            Project Domain
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['coding', 'hardware', 'design', 'research'].map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setDomain(area)}
                className={`p-3 rounded-md border ${
                  domain === area
                    ? 'bg-primary-purple border-primary-purple text-dark-text'
                    : 'bg-dark-element border-dark-border text-dark-text-secondary hover:border-primary-purple'
                } transition-colors flex items-center justify-center`}
              >
                <span className="text-sm font-medium capitalize font-source">{area}</span>
              </button>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !conceptText.trim()}
          className={`w-full py-3 rounded-md font-bold font-cabin text-dark-text transition-all duration-200 ${
            isSubmitting || !conceptText.trim()
              ? 'bg-dark-element cursor-not-allowed opacity-70'
              : 'bg-primary-purple hover:bg-accent-pink hover:scale-105'
          }`}
        >
          {isSubmitting ? 'Generating...' : 'Generate Project Idea'}
        </button>
      </form>
    </div>
  );
}