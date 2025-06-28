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
   bash
   git clone https://github.com/yourusername/IdeaPilot-FE.git
   cd IdeaPilot-FE/idea-pilot
   

2. Install dependencies:
   bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   

3. Set up environment variables:
   - Copy .env.example to .env.local and fill in your API keys and backend URLs as needed.

4. Run the development server:
   bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- src/app/ - Next.js app directory (API routes, pages, layout)
- src/components/ - React components (ProjectCard, ProjectGeneratorForm, Chat, etc.)
- src/lib/ - API utilities, Supabase client, helper functions
- src/types/ - TypeScript type definitions
- src/styles/ - Global and component styles
- public/ - Static assets

## Customization

- Update project generation logic in src/app/api/generate-project/route.ts
- Modify UI components in src/components/
- Adjust Tailwind config in tailwind.config.js

## Deployment

You can deploy this app to Vercel, Netlify, or any platform that supports Next.js.

## License

MIT

---