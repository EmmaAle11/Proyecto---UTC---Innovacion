/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#E34100',
        institutional: '#021E5E',
        naranja: {
          50: '#FFF1EB', 100: '#FFDDCF', 200: '#FFB89E', 300: '#FB8D63',
          400: '#F26336', 500: '#E34100', 600: '#C23500', 700: '#9C2B00',
          800: '#762200', 900: '#511800',
        },
        azul: {
          50: '#EDF1FA', 100: '#D4DCF1', 200: '#A6B6E0', 300: '#6982C9',
          400: '#3358B8', 500: '#1A4099', 600: '#0A2E7A', 700: '#021E5E',
          800: '#021642', 900: '#010E2E',
        },
        gris: {
          50: '#F6F7F9', 100: '#EDEFF3', 200: '#DEE2EA', 300: '#C7CDD9',
          400: '#9BA4B5', 500: '#6C7689', 600: '#4A5468', 700: '#353D4E',
          800: '#232A38', 900: '#141926',
        },
        lima: { 50: '#EAF7EE', 100: '#C8ECD3', 500: '#15915B', 600: '#0F7549' },
        mango: { 50: '#FFF7E6', 100: '#FFE9B8', 400: '#F2A900', 600: '#B07700' },
        rojo: { 50: '#FDECEC', 500: '#D7263D', 600: '#B01B30' },
        blanco: '#FFFFFF',
      },
      fontFamily: {
        display: ['Helvetica', 'Arial', 'sans-serif'],
        displaySemi: ['Helvetica', 'Arial', 'sans-serif'],
        displayBlack: ['Helvetica', 'Arial', 'sans-serif'],
        body: ['Helvetica', 'Arial', 'sans-serif'],
        bodyMedium: ['Helvetica', 'Arial', 'sans-serif'],
        bodySemi: ['Helvetica', 'Arial', 'sans-serif'],
        bodyBold: ['Helvetica', 'Arial', 'sans-serif'],
        mono: ['Helvetica', 'Arial', 'sans-serif'],
        monoBold: ['Helvetica', 'Arial', 'sans-serif'],
      },
      spacing: {
        1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px',
        8: '32px', 10: '40px', 12: '48px',
      },
      borderRadius: {
        xs: '6px', sm: '10px', md: '14px', lg: '18px', xl: '24px',
        card: '20px', pill: '999px',
      },
    },
  },
  plugins: [],
};
