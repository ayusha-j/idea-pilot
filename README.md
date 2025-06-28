# Idea Pilot

*Idea Pilot* is an AI-powered project generator and mentor platform built with Next.js, React, and Tailwind CSS. It helps users generate, save, and manage project ideas, and provides AI mentorship and community chat features.

## Features

- Generate project ideas based on your concept and experience level
- Save and manage your favorite projects
- AI mentor chat for personalized guidance
- Community and private chat for collaboration
- User authentication and project persistence (Supabase)
- Modern, responsive UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/IdeaPilot-FE.git
   cd IdeaPilot-FE/idea-pilot
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   
   **IMPORTANT**: You need to set up Supabase environment variables for the app to work properly.
   
   **Option 1 (Recommended)**: Click the "Connect to Supabase" button in the top right of the interface to automatically set up your Supabase project and environment variables.
   
   **Option 2 (Manual)**: 
   - Create a `.env.local` file in the root directory
   - Add your Supabase project credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```
   - You can get these values from your [Supabase Dashboard](https://supabase.com/dashboard) under Project Settings > API

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- src/app/ - Next.js app directory (API routes, pages, layout)
- src/components/ - React components (ProjectCard, ProjectGeneratorForm, Chat, etc.)
- src/lib/ - API utilities, Supabase client, helper functions
- src/types/ - TypeScript type definitions
- src/styles/ - Global and component styles
- public/ - Static assets

## Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase project's public anon key

## Customization

- Update project generation logic in src/app/api/generate-project/route.ts
- Modify UI components in src/components/
- Adjust Tailwind config in tailwind.config.js

## Deployment

You can deploy this app to Vercel, Netlify, or any platform that supports Next.js.

Make sure to set your environment variables in your deployment platform's settings.

## License

MIT

---