/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6fe',
          200: '#bfd3fe',
          300: '#93b4fd',
          400: '#608bfa',
          500: '#3b66f5',
          600: '#2547ea',
          700: '#1d35d7',
          800: '#1e2eae',
          900: '#1e2d89',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
        soft: '0 4px 24px -6px rgba(16,24,40,.10)',
        page: '0 10px 40px -12px rgba(16,24,40,.25)',
      },
    },
  },
  plugins: [],
};
