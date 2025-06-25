"use client";

import { useState } from 'react';
import { signIn, signUp, AuthResponse } from '@/lib/supabase';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      let result: AuthResponse;
      
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password);
      }
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Successful login/signup
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="w-full max-w-md">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-dark-element p-4 rounded-full shadow-lg mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#6366F1" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-12 h-12"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-dark-text font-cabin">Idea Pilot</h1>
          <p className="text-dark-text-secondary font-source">
            Your AI-powered DIY project generator and mentor
          </p>
        </div>
        
        {/* Auth form */}
        <div className="bg-dark-card rounded-lg shadow-md p-6 border border-dark-border">
          <h2 className="text-2xl font-bold text-dark-text mb-6 font-cabin">
            {isLogin ? 'Log In to Your Account' : 'Create a New Account'}
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-30 text-red-300 border border-red-900 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-dark-text font-source font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="w-full p-3 bg-dark-element border border-dark-border text-dark-text rounded-md focus:outline-none focus:ring-2 focus:ring-primary-purple"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-dark-text font-source font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="w-full p-3 bg-dark-element border border-dark-border text-dark-text rounded-md focus:outline-none focus:ring-2 focus:ring-primary-purple"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-purple text-dark-text rounded-md font-cabin font-bold transition-all duration-200 hover:scale-105 hover:bg-accent-pink flex justify-center items-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-dark-text" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                isLogin ? 'Log In' : 'Sign Up'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-blue hover:text-primary-purple font-source"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-dark-border text-center">
            <p className="text-dark-text-secondary text-sm font-source">
              Idea Pilot helps you create DIY projects and provides mentorship along the way.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}