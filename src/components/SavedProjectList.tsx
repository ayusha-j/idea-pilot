'use client';

import { useState, useEffect } from 'react';
import { getUserProjects } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ProjectCard from '@/components/ProjectCard';

// Define the types based on your API response
interface SavedProject {
  id: string;
  user_id: string;
  project_details: string; // This is a JSON string from the API
  concept: string;
  experience_level: number;
  domain: string;
  created_at: string;
  updated_at: string;
}

// Parsed project has project_details as an object
interface ParsedProject extends Omit<SavedProject, 'project_details'> {
  project_details: {
    title: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    domain: string;
    vibe: string;
    milestones: Array<any>;
    tools: string[];
    codeSnippets: Array<any>;
    resourcePack: any;
  };
}

export default function SavedProjectsList() {
  const { user } = useAuth();
  const [savedProjects, setSavedProjects] = useState<ParsedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSavedProjects() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch projects
        const projects = await getUserProjects(user.id);
        console.log('Raw projects from API:', projects);

        // Parse the project_details JSON string in each project
        const parsedProjects = projects.map((project: SavedProject) => ({
          ...project,
          project_details: typeof project.project_details === 'string'
            ? JSON.parse(project.project_details)
            : project.project_details
        }));

        console.log('Parsed projects:', parsedProjects);
        setSavedProjects(parsedProjects);
      } catch (err) {
        console.error('Error loading saved projects:', err);
        setError('Failed to load your saved projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadSavedProjects();
  }, [user]);

  // Function to refresh projects (can be called after a project is deleted, etc.)
  const refreshProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const projects = await getUserProjects(user?.id || '');
      const parsedProjects = projects.map((project: SavedProject) => ({
        ...project,
        project_details: typeof project.project_details === 'string'
          ? JSON.parse(project.project_details)
          : project.project_details
      }));
      setSavedProjects(parsedProjects);
    } catch (err) {
      console.error('Error refreshing projects:', err);
      setError('Failed to refresh your projects. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-6 w-32 bg-dark-border rounded mb-4"></div>
          <div className="h-40 w-full max-w-2xl bg-dark-border rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-8">
        <div className="text-red-500 p-4 bg-red-100 bg-opacity-10 rounded">
          <p>{error}</p>
          <button 
            onClick={refreshProjects}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (savedProjects.length === 0) {
    return (
      <div className="w-full p-8 text-center">
        <h2 className="text-2xl font-bold text-dark-text mb-4">Your Saved Projects</h2>
        <div className="p-8 bg-dark-card rounded-lg shadow-md border border-dark-border">
          <p className="text-dark-text-secondary">You haven't saved any projects yet.</p>
          <p className="mt-2 text-dark-text-secondary">Generate a project and save it to see it here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <h2 className="text-2xl font-bold text-dark-text mb-6">Your Saved Projects</h2>
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
        {savedProjects.map((project) => (
          <div key={project.id} className="bg-dark-card rounded-lg shadow-md border border-dark-border">
            <ProjectCard
              project={project.project_details}
              conceptText={project.concept || ""}
              experienceLevel={project.experience_level || 2}
              onRefresh={() => refreshProjects()}
              onSave={() => {/* This is already saved */}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}