import { useState } from 'react';

// Add type declaration for window.confetti
declare global {
  interface Window {
    confetti: (options: {
      particleCount: number;
      spread: number;
      origin: { y: number };
      [key: string]: any;
    }) => void;
  }
}

// Define types for the project structure
interface CodeSnippet {
  milestoneIndex: number;
  code: string;
  debugHint?: string;
}

interface Milestone {
  task: string;
  description: string;
  estimatedTime: string;
  resourceLink: string;
}

interface ResourcePack {
  links: string[];
  wildcardLink: string;
  markdownContent: string;
}

interface Project {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  domain: string;
  vibe: string;
  milestones: Milestone[];
  tools: string[];
  codeSnippets: CodeSnippet[];
  resourcePack: ResourcePack;
}

// Define props for the component
interface ProjectCardProps {
  project: Project;
  onRefresh: () => void;
  onSave: () => void;
}

export default function ProjectCard({ project, onRefresh, onSave }: ProjectCardProps) {
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<number[]>([]);
  const [codeSnippetVisible, setCodeSnippetVisible] = useState<number | null>(null);
  
  // Toggle milestone expansion
  const toggleMilestone = (index: number): void => {
    setExpandedMilestone(expandedMilestone === index ? null : index);
  };
  
  // Mark milestone as complete
  const markComplete = (index: number): void => {
    if (!completedMilestones.includes(index)) {
      const newCompleted = [...completedMilestones, index];
      setCompletedMilestones(newCompleted);
      
      // Save to localStorage
      localStorage.setItem(`milestone_${project.title}_${index}`, 'completed');
      
      // Trigger confetti
      window.confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };
  
  // Toggle code snippet visibility
  const toggleCodeSnippet = (index: number): void => {
    setCodeSnippetVisible(codeSnippetVisible === index ? null : index);
  };
  
  // Get badge color based on difficulty
  const getBadgeColor = (): string => {
    switch (project.difficulty) {
      case 'Beginner': return '#10B981'; // Emerald Green
      case 'Intermediate': return '#F59E0B'; // Warm Orange
      case 'Advanced': return '#EF4444'; // Red
      default: return '#10B981';
    }
  };
  
  // Copy code to clipboard
  const copyToClipboard = (code: string): void => {
    navigator.clipboard.writeText(code);
    // Show toast or notification
  };
  
  // Download resource pack as markdown
  const downloadResourcePack = (): void => {
    const element = document.createElement('a');
    const file = new Blob([project.resourcePack.markdownContent], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${project.title.replace(/\s+/g, '-').toLowerCase()}-resources.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full bg-dark-card rounded-lg overflow-hidden shadow-md border border-dark-border">
      {/* Header with gradient overlay */}
      <div className="relative h-12 bg-gradient-to-r from-primary-purple to-primary-blue flex items-center px-4">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <h3 className="text-dark-text font-cabin font-bold text-lg relative z-10">{project.title}</h3>
        <span
          className="ml-auto px-3 py-1 text-sm text-dark-text rounded-full relative z-10"
          style={{ backgroundColor: getBadgeColor() }}
        >
          {project.difficulty}
        </span>
      </div>
      
      {/* Project description */}
      <div className="p-4 border-b border-dark-border">
        <p className="text-dark-text font-source">{project.description}</p>
      </div>
      
      {/* Tools needed */}
      <div className="p-4 border-b border-dark-border">
        <h4 className="text-dark-text font-cabin font-bold mb-2">Tools Needed:</h4>
        <div className="flex flex-wrap gap-2">
          {project.tools.map((tool, index) => (
            <span key={index} className="px-3 py-1 bg-dark-element text-dark-text text-sm rounded-full border border-dark-border">
              {tool}
            </span>
          ))}
        </div>
      </div>
      
      {/* Milestones */}
      <div className="p-4">
        <h4 className="text-dark-text font-cabin font-bold mb-3">Project Roadmap:</h4>
        <div className="relative pl-8 border-l-2 border-secondary-green">
          {project.milestones.map((milestone, index) => (
            <div key={index} className="mb-6 relative">
              {/* Timeline dot */}
              <div
                className={`absolute w-4 h-4 rounded-full bg-primary-purple -left-[9px] top-0 border-2 border-dark-card ${
                  completedMilestones.includes(index) ? 'bg-secondary-green' : ''
                }`}
              ></div>
              
              {/* Milestone header */}
              <div
                className="flex items-center cursor-pointer"
                onClick={() => toggleMilestone(index)}
              >
                <h5 className="text-dark-text font-cabin font-medium">{milestone.task}</h5>
                <span className="ml-2 text-xs text-dark-text-secondary">({milestone.estimatedTime})</span>
                <button
                  className={`ml-auto text-xs px-2 py-1 rounded ${
                    completedMilestones.includes(index)
                      ? 'bg-secondary-green text-dark-text'
                      : 'bg-dark-element text-dark-text-secondary border border-dark-border'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    markComplete(index);
                  }}
                >
                  {completedMilestones.includes(index) ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
              
              {/* Milestone details */}
              {expandedMilestone === index && (
                <div className="mt-2 transition-all duration-300">
                  <p className="text-dark-text font-source text-sm mb-2">
                    {milestone.description}
                  </p>
                  
                  <div className="flex items-center mb-2">
                    <a
                      href={milestone.resourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-blue text-sm underline hover:text-primary-purple"
                    >
                      View Resource
                    </a>
                    
                    {project.codeSnippets.some(snippet => snippet.milestoneIndex === index) && (
                      <button
                        className="ml-4 text-xs px-2 py-1 bg-primary-blue text-dark-text rounded hover:bg-primary-purple"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCodeSnippet(index);
                        }}
                      >
                        {codeSnippetVisible === index ? 'Hide Code' : 'View Code'}
                      </button>
                    )}
                  </div>
                  
                  {/* Code snippet */}
                  {codeSnippetVisible === index && project.codeSnippets.map((snippet, i) => {
                    if (snippet.milestoneIndex === index) {
                      return (
                        <div key={i} className="mt-2 p-3 bg-dark-element rounded-md border border-dark-border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-dark-text-secondary">Code Snippet</span>
                            <button
                              onClick={() => copyToClipboard(snippet.code)}
                              className="text-xs px-2 py-1 bg-primary-blue text-dark-text rounded hover:bg-primary-purple"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="text-sm overflow-x-auto font-jetbrains text-dark-text whitespace-pre-wrap bg-black bg-opacity-30 p-2 rounded">
                            {snippet.code}
                          </pre>
                          {snippet.debugHint && (
                            <div className="mt-2 p-2 bg-accent-yellow bg-opacity-20 rounded text-xs text-dark-text">
                              <strong>Debug Hint:</strong> {snippet.debugHint}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="p-4 bg-dark-element flex flex-wrap gap-3">
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-primary-blue text-dark-text rounded-md font-cabin transition-all duration-200 hover:scale-105 hover:bg-accent-pink flex-1"
        >
          Generate New Idea
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-secondary-green text-dark-text rounded-md font-cabin transition-all duration-200 hover:scale-105 flex-1"
        >
          Save Project
        </button>
        <button
          onClick={downloadResourcePack}
          className="px-4 py-2 bg-secondary-orange text-dark-text rounded-md font-cabin transition-all duration-200 hover:scale-105 hover:bg-accent-yellow flex-1"
        >
          Download Resources
        </button>
      </div>
    </div>
  );
}