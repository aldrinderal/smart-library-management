/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9ddfd',
          300: '#7cc2fb',
          400: '#36a2f7',
          500: '#0c87eb',
          600: '#026bc9',
          700: '#0355a3',
          800: '#074886',
          900: '#0c3d70',
          950: '#08274a',
        },
        navy: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
    },
  },
  plugins: [],
}

