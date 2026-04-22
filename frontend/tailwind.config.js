/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          500: '#3b5bdb',
          600: '#2f4ac4',
          700: '#2340ad',
        },
        risk: {
          critical: '#dc2626',
          high:     '#ea580c',
          medium:   '#ca8a04',
          passed:   '#16a34a',
        },
      },
    },
  },
  plugins: [],
}
