'use client';

import { useState, useEffect } from 'react';
import { SaveProjectButton } from '@/components/SaveProjectButton';
import { ResourceProcessor } from '@/components/resources/ResourceProcessor';
import { ResourceGrid } from '@/components/resources/ResourceGrid';
import { NotesPanel } from '@/components/notes/NotesPanel';
import { HighlightableText } from '@/components/notes/HighlightableText';
import { BookmarkButton } from '@/components/notes/BookmarkButton';
import { QuickNoteButton } from '@/components/notes/QuickNoteButton';
import { EnhancedResource } from '@/types/resource';

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

interface ChatResponse {
  message: string;
  followUpQuestions: string[];
  resourceLink: string;
}

// Define props for the component
interface ProjectCardProps {
  project: Project;
  chatResponse?: ChatResponse; // Make this optional
  onRefresh: () => void;
  onSave: () => void;
  conceptText: string;
  experienceLevel: number;
  onSendMessage?: (message: string) => void; // Add this for mentor integration
}

export default function ProjectCard({ 
  project, 
  chatResponse, 
  onRefresh, 
  onSave,
  conceptText = "",
  experienceLevel = 2,
  onSendMessage
}: ProjectCardProps) {
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<number[]>([]);
  const [codeSnippetVisible, setCodeSnippetVisible] = useState<number | null>(null);
  const [enhancedResources, setEnhancedResources] = useState<EnhancedResource[]>([]);
  const [showResourceProcessor, setShowResourceProcessor] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  
  // Generate a unique project ID based on title and creation time
  const projectId = `project_${project?.title?.replace(/\s+/g, '_').toLowerCase() || 'unknown'}_${Date.now()}`;
  
  // Load saved milestone completion state from localStorage
  useEffect(() => {
    if (!project?.title) return;
    
    const savedCompletions: number[] = [];
    (project.milestones || []).forEach((_, index) => {
      if (localStorage.getItem(`milestone_${project.title}_${index}`) === 'completed') {
        savedCompletions.push(index);
      }
    });
    if (savedCompletions.length > 0) {
      setCompletedMilestones(savedCompletions);
    }
  }, [project]);
  
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
      if (project?.title) {
        localStorage.setItem(`milestone_${project.title}_${index}`, 'completed');
      }
    }
  };
  
  // Toggle code snippet visibility
  const toggleCodeSnippet = (index: number): void => {
    setCodeSnippetVisible(codeSnippetVisible === index ? null : index);
  };
  
  // Get badge color based on difficulty
  const getBadgeColor = (): string => {
    switch (project?.difficulty) {
      case 'Beginner': return '#10B981'; // Emerald Green
      case 'Intermediate': return '#F59E0B'; // Warm Orange
      case 'Advanced': return '#EF4444'; // Red
      default: return '#10B981';
    }
  };
  
  // Copy code to clipboard
  const copyToClipboard = (code: string): void => {
    // Remove markdown code fences if present
    const cleanedCode = code.replace(/^```[\s\S]*?\n/, '').replace(/```$/, '');
    navigator.clipboard.writeText(cleanedCode);
    // Show toast or notification
    if (typeof window !== 'undefined') {
      alert('Code copied to clipboard!');
    }
  };
  
  // Download resource pack as markdown
  const downloadResourcePack = (): void => {
    if (!project?.resourcePack?.markdownContent || !project?.title) return;
    
    const element = document.createElement('a');
    const file = new Blob([project.resourcePack.markdownContent], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${project.title.replace(/\s+/g, '-').toLowerCase()}-resources.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle resource processing completion
  const handleResourceProcessingComplete = (resources: EnhancedResource[]) => {
    setEnhancedResources(resources);
    setShowResourceProcessor(false);
  };

  // If project is undefined or null, render a placeholder or return null
  if (!project) {
    return <div className="w-full p-4 bg-dark-card rounded-lg">Loading project data...</div>;
  }

  return (
    <div className="w-full bg-dark-card rounded-lg overflow-hidden shadow-md border border-dark-border">
      {/* Header with gradient overlay */}
      <div className="relative h-12 bg-gradient-to-r from-primary-purple to-primary-blue flex items-center px-4">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <h3 className="text-dark-text font-cabin font-bold text-lg relative z-10 flex-1">{project.title}</h3>
        <div className="flex items-center gap-2 relative z-10">
          <QuickNoteButton
            projectId={projectId}
            projectTitle={project.title}
            type="general"
            className="text-dark-text hover:text-accent-yellow"
          />
          <button
            onClick={() => setShowNotesPanel(true)}
            className="p-2 text-dark-text hover:text-accent-yellow transition-colors"
            title="Open notes panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <span
            className="ml-2 px-3 py-1 text-sm text-dark-text rounded-full"
            style={{ backgroundColor: getBadgeColor() }}
          >
            {project.difficulty}
          </span>
        </div>
      </div>
      
      {/* Project description */}
      <div className="p-4 border-b border-dark-border">
        <HighlightableText
          text={project.description || "No description available."}
          projectId={projectId}
          projectTitle={project.title}
          targetType="description"
          targetId="main"
          className="text-dark-text font-source"
        />
      </div>
      
      {/* Tools needed */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-dark-text font-cabin font-bold">Tools Needed:</h4>
          <QuickNoteButton
            projectId={projectId}
            projectTitle={project.title}
            type="general"
            targetId="tools"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(project.tools || []).map((tool, index) => (
            <div key={index} className="flex items-center gap-1">
              <span className="px-3 py-1 bg-dark-element text-dark-text text-sm rounded-full border border-dark-border">
                {tool}
              </span>
              <BookmarkButton
                projectId={projectId}
                projectTitle={project.title}
                type="tool"
                targetId={tool}
                title={tool}
                description="Project tool"
                className="p-1"
              />
            </div>
          ))}
          {(!project.tools || project.tools.length === 0) && (
            <span className="text-dark-text-secondary">No tools specified</span>
          )}
        </div>
      </div>

      <div className="p-4 border-b border-dark-border">
        <SaveProjectButton 
          project={project}
          conceptText={conceptText}
          experienceLevel={experienceLevel}
        />
      </div>
      
      {/* AI Mentor Tip */}
      {chatResponse && (
        <div className="p-4 border-b border-dark-border bg-dark-element bg-opacity-30">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-dark-text font-cabin font-bold">AI Mentor Tip:</h4>
            <QuickNoteButton
              projectId={projectId}
              projectTitle={project.title}
              type="general"
              targetId="mentor_tip"
            />
          </div>
          <HighlightableText
            text={chatResponse.message}
            projectId={projectId}
            projectTitle={project.title}
            targetType="description"
            targetId="mentor_tip"
            className="text-dark-text font-source mb-2"
          />
          {chatResponse.resourceLink && (
            <div className="flex items-center gap-2">
              <a 
                href={chatResponse.resourceLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-blue text-sm underline hover:text-primary-purple"
              >
                Helpful Resource
              </a>
              <BookmarkButton
                projectId={projectId}
                projectTitle={project.title}
                type="resource"
                targetId={chatResponse.resourceLink}
                title="Mentor Resource"
                description="Resource from AI mentor"
                className="p-1"
              />
            </div>
          )}
        </div>
      )}

      {/* Enhanced Resources Section */}
      {project.resourcePack?.links && project.resourcePack.links.length > 0 && (
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-dark-text font-cabin font-bold mb-1">Learning Resources</h4>
              <p className="text-dark-text-secondary text-sm font-source">
                AI-enhanced resources tailored for your project
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <QuickNoteButton
                projectId={projectId}
                projectTitle={project.title}
                type="resource"
                targetId="resources_section"
              />
              {enhancedResources.length === 0 && !showResourceProcessor && (
                <button
                  onClick={() => setShowResourceProcessor(true)}
                  className="bg-primary-blue text-dark-text px-4 py-2 rounded-lg hover:bg-primary-purple transition-colors font-medium font-cabin"
                >
                  Enhance Resources
                </button>
              )}
            </div>
          </div>

          {showResourceProcessor && (
            <div className="mb-6">
              <ResourceProcessor
                urls={project.resourcePack.links}
                projectContext={project}
                projectId={projectId}
                onProcessingComplete={handleResourceProcessingComplete}
                onError={(error) => {
                  console.error('Resource processing error:', error);
                  setShowResourceProcessor(false);
                }}
              />
            </div>
          )}

          {enhancedResources.length > 0 ? (
            <ResourceGrid
              resources={enhancedResources}
              onAskMentor={(question) => {
                // Integrate with existing mentor chat
                if (onSendMessage) {
                  onSendMessage(question);
                }
              }}
            />
          ) : !showResourceProcessor ? (
            // Fallback to original links if no enhanced resources
            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-dark-text mb-4 font-cabin">Original Resources</h5>
              <div className="grid gap-3">
                {project.resourcePack.links.map((link, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-dark-element rounded-lg hover:bg-dark-border transition-colors group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-dark-text-secondary group-hover:text-primary-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-blue hover:text-primary-purple font-medium font-source flex-1"
                    >
                      {link}
                    </a>
                    <div className="flex items-center gap-1">
                      <BookmarkButton
                        projectId={projectId}
                        projectTitle={project.title}
                        type="resource"
                        targetId={link}
                        title={`Resource ${index + 1}`}
                        description={link}
                        className="p-1"
                      />
                      <QuickNoteButton
                        projectId={projectId}
                        projectTitle={project.title}
                        type="resource"
                        targetId={link}
                        className="p-1"
                      />
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-dark-text-secondary group-hover:text-primary-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-primary-blue bg-opacity-10 border border-primary-blue border-opacity-30 rounded-lg">
                <p className="text-primary-blue text-sm font-source">
                  💡 <strong>Tip:</strong> Click "Enhance Resources" to get AI-processed summaries, 
                  learning objectives, and integrated mentor guidance for these resources.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
      
      {/* Milestones */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-dark-text font-cabin font-bold">Project Roadmap:</h4>
          <QuickNoteButton
            projectId={projectId}
            projectTitle={project.title}
            type="general"
            targetId="roadmap"
          />
        </div>
        {(project.milestones && project.milestones.length > 0) ? (
          <div className="relative pl-8 border-l-2 border-secondary-green">
            {project.milestones.map((milestone, index) => (
              <div key={index} className="mb-6 relative">
                {/* Timeline dot */}
                <div
                  className={`absolute w-4 h-4 rounded-full bg-primary-purple -left-[41px] top-1/2 -translate-y-1/2 border-2 border-dark-card ${
                    completedMilestones.includes(index) ? 'bg-secondary-green' : ''
                  }`}
                ></div>
                
                {/* Milestone header */}
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleMilestone(index)}
                >
                  <h5 className="text-dark-text ml-3 font-cabin font-medium flex-1">{milestone.task || "Unnamed Task"}</h5>
                  <span className="ml-2 text-xs text-dark-text-secondary">({milestone.estimatedTime || "N/A"})</span>
                  <div className="flex items-center gap-1 ml-2">
                    <BookmarkButton
                      projectId={projectId}
                      projectTitle={project.title}
                      type="milestone"
                      targetId={index.toString()}
                      title={milestone.task || `Milestone ${index + 1}`}
                      description={milestone.description}
                      className="p-1"
                    />
                    <QuickNoteButton
                      projectId={projectId}
                      projectTitle={project.title}
                      type="milestone"
                      targetId={index.toString()}
                      className="p-1"
                    />
                    <button
                      className={`ml-2 text-xs px-2 py-1 rounded ${
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
                </div>
                
                {/* Milestone details */}
                {expandedMilestone === index && (
                  <div className="mt-2 transition-all duration-300">
                    <HighlightableText
                      text={milestone.description || "No description available."}
                      projectId={projectId}
                      projectTitle={project.title}
                      targetType="milestone"
                      targetId={index.toString()}
                      className="text-dark-text font-source text-sm mb-2"
                    />
                    
                    <div className="flex items-center mb-2">
                      {milestone.resourceLink && (
                        <div className="flex items-center gap-2">
                          <a
                            href={milestone.resourceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-blue text-sm underline hover:text-primary-purple"
                          >
                            View Resource
                          </a>
                          <BookmarkButton
                            projectId={projectId}
                            projectTitle={project.title}
                            type="resource"
                            targetId={milestone.resourceLink}
                            title={`${milestone.task} Resource`}
                            description={milestone.resourceLink}
                            className="p-1"
                          />
                        </div>
                      )}
                      
                      {(project.codeSnippets || []).some(snippet => snippet.milestoneIndex === index) && (
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
                    {codeSnippetVisible === index && (project.codeSnippets || []).map((snippet, i) => {
                      if (snippet.milestoneIndex === index) {
                        // Remove markdown code fences for display
                        const displayCode = snippet.code.replace(/^```[\s\S]*?\n/, '').replace(/```$/, '');
                        
                        return (
                          <div key={i} className="mt-2 p-3 bg-dark-element rounded-md border border-dark-border">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-dark-text-secondary">Code Snippet</span>
                              <div className="flex items-center gap-2">
                                <BookmarkButton
                                  projectId={projectId}
                                  projectTitle={project.title}
                                  type="code"
                                  targetId={`${index}_${i}`}
                                  title={`Code for ${milestone.task}`}
                                  description="Code snippet"
                                  className="p-1"
                                />
                                <QuickNoteButton
                                  projectId={projectId}
                                  projectTitle={project.title}
                                  type="code"
                                  targetId={`${index}_${i}`}
                                  className="p-1"
                                />
                                <button
                                  onClick={() => copyToClipboard(snippet.code)}
                                  className="text-xs px-2 py-1 bg-primary-blue text-dark-text rounded hover:bg-primary-purple"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                            <pre className="text-sm overflow-x-auto font-jetbrains text-dark-text whitespace-pre-wrap bg-black bg-opacity-30 p-2 rounded">
                              {displayCode}
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
        ) : (
          <div className="text-dark-text-secondary">No milestones available.</div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="p-4 bg-dark-element flex flex-wrap gap-3">
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-primary-blue text-dark-text rounded-md font-cabin transition-all duration-200 hover:scale-105 hover:bg-accent-pink flex-1"
        >
          Regenerate Idea
        </button>
        <button
          onClick={downloadResourcePack}
          className="px-4 py-2 bg-secondary-orange text-dark-text rounded-md font-cabin transition-all duration-200 hover:scale-105 hover:bg-accent-yellow flex-1"
          disabled={!project.resourcePack?.markdownContent}
        >
          Download Resources
        </button>
      </div>

      {/* Notes Panel */}
      <NotesPanel
        projectId={projectId}
        projectTitle={project.title}
        isOpen={showNotesPanel}
        onClose={() => setShowNotesPanel(false)}
      />
    </div>
  );
}