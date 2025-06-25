/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
      extend: {
        colors: {
          // Primary colors
          'primary-purple': '#6366F1', // Deep Purple
          'primary-blue': '#3B82F6',   // Electric Blue
          
          // Secondary colors
          'secondary-green': '#10B981', // Emerald Green
          'secondary-orange': '#F59E0B', // Warm Orange
          
          // Neutral colors - Dark theme
          'dark-bg': '#111827',         // Darker background
          'dark-card': '#1F2937',       // Dark card bg
          'dark-element': '#374151',    // Dark element bg
          'dark-border': '#4B5563',     // Dark borders
          'dark-text': '#F3F4F6',       // Light text for dark mode
          'dark-text-secondary': '#9CA3AF', // Secondary text
          
          // Accent colors
          'accent-pink': '#EC4899',    // Pink Accent
          'accent-yellow': '#FBBF24',  // Yellow Highlight
          
          // Additional colors
          'badge-red': '#EF4444',      // Red for advanced badges
        },
        fontFamily: {
          'cabin': ['var(--font-cabin)', 'sans-serif'],
          'source': ['var(--font-source)', 'sans-serif'],
          'jetbrains': ['var(--font-jetbrains)', 'monospace'],
        },
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        },
      },
    },
    plugins: [],
  }