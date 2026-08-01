/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1A2333',
          light: '#26324A',
          dark: '#101725',
        },
        parchment: {
          DEFAULT: '#F5F1E8',
          dim: '#EAE3D2',
        },
        gold: {
          DEFAULT: '#D4A537',
          bright: '#E6BE5A',
          dim: '#A9812A',
        },
        lapis: {
          DEFAULT: '#3B5BA5',
          bright: '#4E72C4',
          dim: '#2C4480',
        },
        coral: {
          DEFAULT: '#E8735C',
          bright: '#F08A72',
          dim: '#C55C47',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        seal: '999px',
        tile: '1.25rem 0.5rem 1.25rem 0.5rem',
      },
      boxShadow: {
        seal: '0 0 0 3px rgba(212,165,55,0.35), 0 8px 20px -6px rgba(26,35,51,0.45)',
        tile: '0 10px 30px -12px rgba(26,35,51,0.35)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        shimmer: 'shimmer 2.5s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: 0.55 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
