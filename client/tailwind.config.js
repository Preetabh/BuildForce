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
        erp: {
          bg: '#090D16',
          surface: '#111726',
          'surface-hover': '#172033',
          card: '#0F1626',
          border: '#1E293B',
          'border-light': '#334155',
          primary: '#F59E0B',
          'primary-hover': '#D97706',
          accent: '#FBBF24',
          text: '#F8FAFC',
          'text-muted': '#94A3B8',
          'text-subtle': '#64748B',
        },
        gold: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(245, 158, 11, 0.25)',
        'glow': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
        'glow-lg': '0 0 35px -5px rgba(245, 158, 11, 0.5)',
      },
    },
  },
  plugins: [],
}
