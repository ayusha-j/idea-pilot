import { useState } from 'react';
import { generateProject } from '@/lib/api';
import { ProjectResponse } from '@/types/project';
import { toast } from 'react-hot-toast';

interface ProjectGeneratorFormProps {
  onProjectGenerated: (project: ProjectResponse) => void;
}

export default function ProjectGeneratorForm({ onProjectGenerated }: ProjectGeneratorFormProps) {
  const [conceptText, setConceptText] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<number>(3);
  const [domain, setDomain] = useState<string>('coding');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Call our API service to generate project
      const projectData = await generateProject(conceptText, experienceLevel, domain);
      
      // Pass the generated project to parent component
      onProjectGenerated(projectData);
      
      // Trigger confetti on successful generation
      if (window.confetti) {
        window.confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error('Error generating project:', error);
      toast.error('Failed to generate project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to get difficulty label color
  const getDifficultyColor = (level: number): string => {
    if (level <= 2) return '#10B981'; // Emerald Green - Beginner
    if (level <= 4) return '#F59E0B'; // Warm Orange - Intermediate
    return '#EF4444'; // Red - Advanced
  };
  
  const getExperienceLevelLabel = (level: number): string => {
    if (level <= 2) return 'Beginner';
    if (level <= 4) return 'Intermediate';
    return 'Advanced';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-dark-card rounded-lg shadow-md border border-dark-border">
      <h2 className="text-2xl font-bold text-dark-text mb-6 font-cabin">Generate Your Project</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="concept" className="block text-dark-text font-source font-medium mb-2">
            Enter a concept or paste a lecture transcript
          </label>
          <textarea
            id="concept"
            value={conceptText}
            onChange={(e) => setConceptText(e.target.value)}
            className="w-full p-3 bg-dark-element border border-dark-border rounded-md text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-purple font-source"
            rows={5}
            placeholder="e.g., machine learning or paste your lecture transcript here..."
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="experience" className="block text-dark-text font-source font-medium mb-2">
            Experience Level: <span style={{ color: getDifficultyColor(experienceLevel) }}>{getExperienceLevelLabel(experienceLevel)}</span>
          </label>
          <input
            id="experience"
            type="range"
            min={1}
            max={5}
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-dark-element rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-dark-text-secondary font-source mt-1">
            <span>Beginner</span>
            <span>Advanced</span>
          </div>
        </div>
        
        <div className="mb-8">
          <label className="block text-dark-text font-source font-medium mb-2">
            Area of Interest
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['coding', 'hardware', 'design', 'research'].map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setDomain(area)}
                className={`py-2 px-4 rounded-md transition-all duration-200 hover:scale-105 capitalize font-source ${
                  domain === area
                    ? 'bg-primary-purple text-dark-text'
                    : 'bg-dark-element text-dark-text border border-dark-border'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-accent-pink text-dark-text rounded-md font-cabin font-bold transition-all duration-200 hover:scale-105 hover:bg-primary-purple flex justify-center items-center"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-dark-text" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Generate Project Idea'
          )}
        </button>
      </form>
    </div>
  );
}