module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0ff',
          100: '#b3d1ff',
          200: '#80b3ff',
          300: '#4d94ff',
          400: '#1a75ff',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
        secondary: {
          50: '#e6fff2',
          100: '#b3ffdb',
          200: '#80ffc5',
          300: '#4dffae',
          400: '#1aff97',
          500: '#00ff80',
          600: '#00cc66',
          700: '#00994d',
          800: '#006633',
          900: '#00331a',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}