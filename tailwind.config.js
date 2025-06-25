/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'primary-purple': '#6366F1',
          'primary-blue': '#3B82F6',
          'secondary-green': '#10B981',
          'secondary-orange': '#F59E0B',
          'dark-bg': '#111827',
          'dark-card': '#1F2937',
          'dark-element': '#374151',
          'dark-border': '#4B5563',
          'dark-text': '#F3F4F6',
          'dark-text-secondary': '#9CA3AF',
          'accent-pink': '#EC4899',
          'accent-yellow': '#FBBF24',
          'badge-red': '#EF4444',
        },
        fontFamily: {
          'cabin': ['Cabin', 'sans-serif'],
          'source': ['"Source Sans Pro"', 'sans-serif'],
          'jetbrains': ['"JetBrains Mono"', 'monospace'],
        },
      },
    },
    plugins: [],
  }