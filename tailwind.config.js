/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Body / UI — Plus Jakarta Sans variable (2026 modern humanist)
        sans:  ['"Plus Jakarta Sans"', 'sans-serif'],
        cute:  ['"Plus Jakarta Sans"', 'sans-serif'],
        // Brand title — Pacifico
        title: ['Pacifico', 'cursive'],
      },
      colors: {
        blush: {
          50:  '#fff1f5',
          100: '#ffe4ed',
          200: '#fecdd9',
          300: '#fda4bc',
          400: '#f472b6',
          500: '#e11d77',
        },
        lavender: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7c3aed',
        },
        mint: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16a34a',
        },
        peach: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ea6c00',
        },
        rose: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
        },
      },
      screens: {
        xs: '480px',
      },
      animation: {
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
        'fade-in':     'fade-in 0.2s ease-out',
        'slide-up':    'slide-up 0.25s cubic-bezier(0.32,0.72,0,1)',
        'scale-in':    'scale-in 0.2s cubic-bezier(0.32,0.72,0,1)',
      },
      keyframes: {
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(-6px)' },
          '50%':      { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.96)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-md': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.04)',
        'modal':   '0 20px 60px -10px rgb(0 0 0 / 0.2)',
      },
    },
  },
  plugins: [],
}
