import { useState } from 'react';
import { saveProject } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext'; // Assuming you have an auth context

interface SaveProjectButtonProps {
  project: any; // Replace with your project type
  conceptText: string;
  experienceLevel: number;
}

export function SaveProjectButton({ project, conceptText, experienceLevel }: SaveProjectButtonProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user) {
      // Handle unauthenticated user case
      alert('Please sign in to save projects');
      return;
    }

    setIsSaving(true);
    try {
      const response = await saveProject(
        user.id,
        project,
        conceptText,
        experienceLevel
      );
      
      if (response.success) {
        setSaved(true);
        // Optional: Add a toast notification
        // toast.success('Project saved successfully!');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      // Optional: Add error toast
      // toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={isSaving || saved}
      className={`
        px-4 py-2 rounded-lg flex items-center gap-2 transition-all
        ${saved 
          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
          : 'bg-blue-600 text-white hover:bg-blue-700'
        }
        ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}
      `}
    >
      {isSaving ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving...
        </>
      ) : saved ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Saved
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
          Save Project
        </>
      )}
    </button>
  );
}