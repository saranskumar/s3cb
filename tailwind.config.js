/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This tells Tailwind to scan your app
  ],
  darkMode: 'class', // This enables the dark mode toggle
  theme: {
    extend: {},
  },
  plugins: [],
}