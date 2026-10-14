/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        secondary: {
          500: '#3B82F6',
          600: '#2563EB',
        },
        background: {
          primary: '#FFFFFF',
          secondary: '#F8FAFC',
          tertiary: '#F1F5F9',
        },
        surface: {
          card: '#FFFFFF',
          elevated: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E2E8F0',
          focus: '#0D9488',
        },
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
          inverse: '#FFFFFF',
          muted: '#94A3B8',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
        medical: {
          appointment: '#8B5CF6',
          prescription: '#06B6D4',
          lab: '#F97316',
        },
      },
      fontFamily: {
        sans: ['Inter-Regular', 'Cairo-Regular'],
        arabic: ['Cairo-Regular'],
      },
    },
  },
  plugins: [],
};
