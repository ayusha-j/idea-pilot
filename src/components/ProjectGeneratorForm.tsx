// src/components/ProjectGeneratorForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { ProjectResponse, DomainMismatchData, ProjectFormData } from '@/types/project';
import DomainMismatchModal from './DomainMismatchModal';

// Define the props interface properly
interface ProjectGeneratorFormProps {
  onProjectGenerated: (projectData: ProjectResponse, experienceLevel: number) => void;
}

export default function ProjectGeneratorForm({ onProjectGenerated }: ProjectGeneratorFormProps) {
  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
    conceptText: '',
    experienceLevel: 2,
    domain: 'coding'
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // New state for domain mismatch
  const [showDomainMismatch, setShowDomainMismatch] = useState(false);
  const [domainMismatchData, setDomainMismatchData] = useState<DomainMismatchData | null>(null);
  
  // Updated project generation function
  const generateProject = async (data: ProjectFormData = formData) => {
    setIsSubmitting(true);
    
    try {
      // Use local API endpoint instead of direct backend URL
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conceptText: data.conceptText,
          experienceLevel: data.experienceLevel,
          domain: data.domain
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // Check if it's a concept-domain mismatch (feature, not error)
        if (responseData.error === 'concept_domain_mismatch') {
          setShowDomainMismatch(true);
          setDomainMismatchData(responseData);
          return;
        } else {
          // Handle configuration errors with more helpful messages
          if (response.status === 503 || response.status === 502) {
            throw new Error(responseData.details || responseData.error || 'Backend server configuration error');
          } else {
            // Handle as actual error
            throw new Error(responseData.error || 'Failed to generate project');
          }
        }
      }
      
      // Success case
      const projectData: ProjectResponse = responseData;
      
      // Pass the data to parent component
      onProjectGenerated(projectData, data.experienceLevel);
      
      // Reset mismatch state on success
      setShowDomainMismatch(false);
      setDomainMismatchData(null);
      
    } catch (error) {
      console.error('Error generating project:', error);
      
      // Show more helpful error messages
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate project. Please try again.';
      
      if (errorMessage.includes('ngrok') || errorMessage.includes('Backend server')) {
        alert(`Configuration Error: ${errorMessage}\n\nPlease check that:\n1. Your Flask backend server is running\n2. ngrok is active and tunneling to your backend\n3. Update NEXT_PUBLIC_API_URL in .env.local with the current ngrok URL\n4. Restart the development server after updating .env.local`);
      } else {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    generateProject();
  };

  // Handler for switching domain
  const handleSwitchDomain = (suggestedDomain: string) => {
    const updatedFormData = { ...formData, domain: suggestedDomain };
    setFormData(updatedFormData);
    setShowDomainMismatch(false);
    
    // Auto-regenerate with new domain
    generateProject(updatedFormData);
  };

  // Handler for modifying concept
  const handleModifyConcept = () => {
    setShowDomainMismatch(false);
    // Focus on concept input field
    const conceptInput = document.getElementById('concept') as HTMLTextAreaElement;
    conceptInput?.focus();
  };

  // Handler for closing modal
  const handleCloseMismatch = () => {
    setShowDomainMismatch(false);
    setDomainMismatchData(null);
  };
  
  return (
    <>
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
              value={formData.conceptText}
              onChange={(e) => setFormData({ ...formData, conceptText: e.target.value })}
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
                value={formData.experienceLevel}
                onChange={(e) => setFormData({ ...formData, experienceLevel: parseInt(e.target.value) })}
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
                  onClick={() => setFormData({ ...formData, domain: area })}
                  className={`p-3 rounded-md border ${
                    formData.domain === area
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
            disabled={isSubmitting || !formData.conceptText.trim()}
            className={`w-full py-3 rounded-md font-bold font-cabin text-dark-text transition-all duration-200 ${
              isSubmitting || !formData.conceptText.trim()
                ? 'bg-dark-element cursor-not-allowed opacity-70'
                : 'bg-primary-purple hover:bg-accent-pink hover:scale-105'
            }`}
          >
            {isSubmitting ? 'Generating...' : 'Generate Project Idea'}
          </button>
        </form>
      </div>

      {/* Domain Mismatch Modal */}
      {showDomainMismatch && domainMismatchData && (
        <DomainMismatchModal
          data={domainMismatchData}
          onSwitchDomain={handleSwitchDomain}
          onModifyConcept={handleModifyConcept}
          onClose={handleCloseMismatch}
        />
      )}
    </>
  );
}