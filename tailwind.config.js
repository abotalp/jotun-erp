/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B3A6B',
          dark: '#1B2E4B',
          light: '#2a5298'
        },
        accent: {
          DEFAULT: '#D4AF37',
          dark: '#B8960C',
          light: '#e6c84a'
        }
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: []
}