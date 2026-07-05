/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Sleek modern enterprise palette
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#025a87',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        risk: {
          low: '#10b981',      // Emerald green
          medium: '#f59e0b',   // Amber orange
          high: '#ef4444',     // Red
          critical: '#7c3aed', // Purple/Violet
        },
        dark: {
          bg: '#0b0f19',       // Deep navy/black
          card: '#161d30',     // Dark slate card
          border: '#232d45',   // Subtly lighter border
          text: '#f3f4f6',     // High contrast off-white
          muted: '#9ca3af',    // Gray text
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
