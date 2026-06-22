/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#E34100',
        institutional: '#021E5E',
        naranja: { 50: '#FFF1EB', 500: '#E34100', 600: '#C23500', 700: '#9C2B00' },
        azul: { 50: '#EDF1FA', 500: '#1A4099', 700: '#021E5E' },
        gris: { 50: '#F6F7F9', 100: '#EDEFF3', 200: '#DEE2EA', 400: '#9BA4B5', 500: '#6C7689', 800: '#232A38' },
        lima: { 500: '#15915B', 600: '#0F7549' },
        mango: { 400: '#F2A900', 600: '#B07700' },
      },
      borderRadius: { card: '20px', pill: '999px' },
    },
  },
  plugins: [],
};
