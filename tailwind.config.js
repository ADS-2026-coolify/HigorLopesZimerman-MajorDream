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
        cs: {
          bg: '#0A0D14',
          surface: '#111723',
          card: '#161F30',
          border: '#233047',
          hover: '#1D2A40',
          accent: '#F59E0B',      // Esports Gold
          accentHover: '#D97706',
          orange: '#FF6B00',      // CS Tactical Orange
          blue: '#0EA5E9',        // CT Blue
          yellow: '#EAB308',      // Major Gold
          red: '#EF4444',         // T Red / Defeat
          green: '#10B981',       // Win Green
          text: '#F1F5F9',
          muted: '#94A3B8',
          dark: '#07090E'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
        'glow-blue': '0 0 25px -5px rgba(14, 165, 233, 0.4)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.4)',
        'glow-green': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'card-flip': 'cardFlip 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
      keyframes: {
        cardFlip: {
          '0%': { transform: 'rotateY(90deg) scale(0.9)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg) scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
