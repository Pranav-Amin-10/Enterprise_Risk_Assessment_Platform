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
          bg: 'rgb(var(--bg-color) / <alpha-value>)',
          card: 'rgb(var(--card-color) / <alpha-value>)',
          border: 'rgb(var(--border-color) / <alpha-value>)',
          text: 'rgb(var(--text-color) / <alpha-value>)',
          muted: 'rgb(var(--muted-color) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
