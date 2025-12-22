/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-yellow': '#FFD500',
        'brand-blue': '#00A8E8',
        'brand-green': '#A0E426',
      },
    },
  },
  plugins: [],
}
