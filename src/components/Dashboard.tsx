"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, saveProject, getUserProjects, signOut } from '@/lib/supabase';
import ProjectGeneratorForm from '@/components/ProjectGeneratorForm';
import ProjectCard from '@/components/ProjectCard';
import AIMentorChat from '@/components/AIMentorChat';
import { SavedProject } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { ProjectResponse } from '@/types/project';
import { useChatContext } from '@/app/contexts/ChatContext';
import toast from 'react-hot-toast';

// Define the window.confetti type
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

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'generator' | 'saved' | 'community'>('generator');
  const [generatedProject, setGeneratedProject] = useState<ProjectResponse | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const router = useRouter();
  const { userId, projectIds, setProjectId } = useChatContext();
  
  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async (): Promise<void> => {
      const { user, error } = await getCurrentUser();
      
      if (error || !user) {
        // Redirect to login if not authenticated
        router.push('/login');
        return;
      }
      
      setUser(user);
      
      // Load user's saved projects
      if (activeTab === 'saved') {
        loadSavedProjects(user.id);
      }
      
      setLoading(false);
    };
    
    checkUser();
  }, [router, activeTab]);
  
  const loadSavedProjects = async (userId: string): Promise<void> => {
    const { data, error } = await getUserProjects(userId);
    
    if (!error && data) {
      setSavedProjects(data);
    }
  };
  
  const handleProjectGenerated = (project: ProjectResponse): void => {
    setGeneratedProject(project);
    
    // Automatically open the chat when a project is generated
    setIsChatOpen(true);
    
    toast.success('Project generated successfully!');
  };
  
  const handleRefreshProject = async (): Promise<void> => {
    // This would call the same API as the form submission
    // For now, we'll just clear the current project
    setGeneratedProject(null);
  };
  
  const handleSaveProject = async (): Promise<void> => {
    if (!generatedProject || !user) return;
    
    const conceptElement = document.getElementById('concept') as HTMLTextAreaElement | null;
    const experienceElement = document.getElementById('experience') as HTMLInputElement | null;
    
    if (!conceptElement || !experienceElement) {
      console.error('Could not find required form elements');
      toast.error('Could not save project. Please try again.');
      return;
    }
    
    try {
      const { error } = await saveProject(user.id, {
        concept: conceptElement.value,
        experienceLevel: parseInt(experienceElement.value),
        domain: generatedProject.project.domain,
        project: generatedProject.project
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Show success message
      toast.success('Project saved successfully!');
      
      // Trigger confetti animation
      window.confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Refresh saved projects if on saved tab
      if (activeTab === 'saved') {
        loadSavedProjects(user.id);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project. Please try again.');
    }
  };
  
  const handleLogout = async (): Promise<void> => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-card text-dark-text py-4 px-6 border-b border-dark-border">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#6366F1" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-8 h-8 mr-3"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <h1 className="text-2xl font-bold font-cabin">Idea Pilot</h1>
          </div>
          
          {user && (
            <div className="flex items-center">
              <span className="mr-4 text-dark-text-secondary font-source">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-primary-purple text-dark-text px-4 py-2 rounded-md hover:bg-accent-pink transition-colors font-cabin"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-10 w-10 text-primary-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-dark-card rounded-lg shadow-md border border-dark-border overflow-hidden">
                <div className="p-4 bg-dark-element text-dark-text">
                  <h2 className="font-bold font-cabin">Navigation</h2>
                </div>
                <nav className="p-2">
                  <button
                    onClick={() => setActiveTab('generator')}
                    className={`w-full text-left p-3 rounded-md mb-2 transition-colors font-source ${
                      activeTab === 'generator'
                        ? 'bg-accent-pink text-dark-text'
                        : 'hover:bg-dark-element text-dark-text'
                    }`}
                  >
                    Project Generator
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('saved');
                      if (user) loadSavedProjects(user.id);
                    }}
                    className={`w-full text-left p-3 rounded-md mb-2 transition-colors font-source ${
                      activeTab === 'saved'
                        ? 'bg-accent-pink text-dark-text'
                        : 'hover:bg-dark-element text-dark-text'
                    }`}
                  >
                    Saved Projects
                  </button>
                  <button
                    onClick={() => setActiveTab('community')}
                    className={`w-full text-left p-3 rounded-md transition-colors font-source ${
                      activeTab === 'community'
                        ? 'bg-accent-pink text-dark-text'
                        : 'hover:bg-dark-element text-dark-text'
                    }`}
                  >
                    Community Chat
                  </button>
                </nav>
              </div>
              
              {/* Domain Icons */}
              <div className="bg-dark-card rounded-lg shadow-md border border-dark-border overflow-hidden mt-4">
                <div className="p-4 bg-dark-element text-dark-text">
                  <h2 className="font-bold font-cabin">Project Domains</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {['coding', 'hardware', 'design', 'research'].map((area) => (
                      <div
                        key={area}
                        className="p-3 bg-dark-element rounded-md border border-dark-border text-center hover:border-primary-purple transition-colors"
                      >
                        <div className="w-10 h-10 mx-auto mb-2 bg-primary-purple rounded-full flex items-center justify-center text-dark-text">
                          {area === 'coding' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                          )}
                          {area === 'hardware' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                          )}
                          {area === 'design' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                          )}
                          {area === 'research' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium text-dark-text capitalize font-source">
                          {area}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="flex-1">
              {activeTab === 'generator' && (
                <div className="space-y-8">
                  {!generatedProject && (
                    <ProjectGeneratorForm onProjectGenerated={handleProjectGenerated} />
                  )}
                  
                  {generatedProject && (
                    <ProjectCard
                      project={generatedProject.project}
                      onRefresh={handleRefreshProject}
                      onSave={handleSaveProject}
                    />
                  )}
                </div>
              )}
              
              {activeTab === 'saved' && (
                <div>
                  <h2 className="text-2xl font-bold text-dark-text mb-6 font-cabin">Your Saved Projects</h2>
                  
                  {savedProjects.length === 0 ? (
                    <div className="bg-dark-card rounded-lg shadow-md border border-dark-border p-8 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-dark-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-dark-text font-source">
                        You haven&apos;t saved any projects yet. Generate a project idea and save it to see it here!
                      </p>
                      <button
                        onClick={() => setActiveTab('generator')}
                        className="mt-4 px-4 py-2 bg-primary-purple text-dark-text rounded-md hover:bg-accent-pink transition-colors font-cabin"
                      >
                        Generate a Project
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-8">
                      {savedProjects.map((savedProject) => (
                        <ProjectCard
                          key={savedProject.id}
                          project={savedProject.project_details}
                          onRefresh={() => {}}
                          onSave={() => {}}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'community' && (
                <div>
                  <h2 className="text-2xl font-bold text-dark-text mb-6 font-cabin">Community Chat</h2>
                  <div className="bg-dark-card rounded-lg shadow-md border border-dark-border p-4">
                    <p className="text-center text-dark-text font-source py-8">
                      Community chat feature will be implemented here, allowing users to share projects,
                      ask questions, and collaborate with others. This will use Supabase Realtime for
                      real-time chat functionality.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat interface */}
            {generatedProject && (
              <div className={`fixed bottom-0 right-4 w-96 transition-all duration-300 shadow-lg ${
                isChatOpen ? 'h-[500px]' : 'h-12'
              }`}>
                <div
                  className="bg-dark-element text-dark-text p-3 flex justify-between items-center cursor-pointer"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                >
                  <h3 className="font-bold font-cabin">AI Project Mentor</h3>
                  <button className="text-dark-text">
                    {isChatOpen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {isChatOpen && (
                  <AIMentorChat projectContext={generatedProject.project} />
                )}
              </div>
            )}
            
            {/* Floating Action Button */}
            {activeTab !== 'generator' && (
              <button
                onClick={() => setActiveTab('generator')}
                className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-accent-pink text-dark-text shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:bg-primary-purple"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}