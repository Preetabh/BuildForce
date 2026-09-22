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
          bg: '#0B0F17',
          surface: '#111726',
          'surface-hover': '#172033',
          card: '#0F1626',
          border: '#1E293B',
          'border-light': '#334155',
          primary: '#2563EB',
          'primary-hover': '#1D4ED8',
          accent: '#38BDF8',
          text: '#F8FAFC',
          'text-muted': '#94A3B8',
          'text-subtle': '#64748B',
        },
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(37, 99, 235, 0.2)',
        'glow': '0 0 25px -5px rgba(37, 99, 235, 0.35)',
        'glow-lg': '0 0 35px -5px rgba(37, 99, 235, 0.45)',
      },
    },
  },
  plugins: [],
}
