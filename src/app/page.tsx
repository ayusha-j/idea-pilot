import { Metadata } from 'next';

// Force this page to be dynamic to avoid SSG issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Idea Pilot - AI Project Generator',
  description: 'Generate personalized project ideas and get mentorship through a structured roadmap',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-card shadow-md border-b border-dark-border">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
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
            <h1 className="text-2xl font-bold text-dark-text font-cabin">IdeaPilot AI</h1>
          </div>
          
          <div className="space-x-4">
            <a
              href="/login"
              className="px-4 py-2 bg-dark-element text-dark-text rounded-md hover:bg-dark-border transition-colors font-cabin"
            >
              Log In
            </a>
            <a
              href="/login"
              className="px-4 py-2 bg-primary-purple text-dark-text rounded-md hover:bg-accent-pink transition-colors font-cabin"
            >
              Sign Up
            </a>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-4xl md:text-5xl font-bold text-dark-text font-cabin mb-6 leading-tight">
                Generate Personalized Projects with <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-purple to-primary-blue">AI Mentorship</span>
              </h2>
              <p className="text-dark-text-secondary font-source text-lg mb-8">
                Idea Pilot helps students, career switchers, and hobbyists apply new concepts through hands-on projects with structured roadmaps and real-time AI mentoring.
              </p>
              <a
                href="/login"
                className="inline-block px-8 py-4 bg-accent-pink text-dark-text rounded-md font-cabin font-bold text-lg hover:scale-105 transition-all duration-200 hover:bg-primary-purple"
              >
                Get Started Free
              </a>
            </div>
            
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-purple to-primary-blue opacity-10 rounded-lg"></div>
                <div className="relative bg-dark-card border border-dark-border rounded-lg shadow-xl overflow-hidden">
                  <div className="p-4 bg-dark-element border-b border-dark-border">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div className="ml-4 text-dark-text-secondary font-mono text-xs">idea-pilot.app</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="h-8 bg-dark-element rounded w-3/4"></div>
                      <div className="h-32 bg-dark-element rounded w-full"></div>
                      <div className="h-8 bg-accent-pink rounded w-full"></div>
                      <div className="flex gap-3">
                        <div className="h-12 bg-dark-element rounded w-1/4"></div>
                        <div className="h-12 bg-dark-element rounded w-1/4"></div>
                        <div className="h-12 bg-dark-element rounded w-1/4"></div>
                        <div className="h-12 bg-dark-element rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-