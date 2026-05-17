/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hotel: {
          bg: '#FAF7F2',
          surface: '#F5EFE3',
          card: '#FDFAF5',
          border: '#E8DECE',
          text: '#2C1810',
          muted: '#7A6152',
          accent: '#8B5E3C',
          gold: '#C4A882',
          'gold-light': '#DCC098',
          'dark-bg': '#1A1209',
          'dark-surface': '#251A10',
          'dark-card': '#2D2018',
          'dark-border': '#4A3728',
          'dark-text': '#F5EFE3',
          'dark-muted': '#A89585',
          'dark-accent': '#C4A882',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        hotel: '0 2px 16px rgba(44, 24, 16, 0.07)',
        'hotel-md': '0 4px 24px rgba(44, 24, 16, 0.11)',
        'hotel-lg': '0 8px 40px rgba(44, 24, 16, 0.16)',
        'hotel-dark': '0 2px 16px rgba(0,0,0,0.35)',
        'hotel-dark-md': '0 4px 24px rgba(0,0,0,0.45)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
