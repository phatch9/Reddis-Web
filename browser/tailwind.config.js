/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'reddit-orange': '#FF4500',
        'reddit-dark': '#1A1A1B',
        'reddit-gray': '#DAE0E6',
        'reddit-blue': '#0079D3',
        'reddit-dark-gray': '#343536',
      },
    },
  },
  plugins: [],
}
