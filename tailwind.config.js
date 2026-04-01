/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#f5ead6',
        gold: '#e8c97a',
        amber: '#c8934a',
        brown: '#3b1f0a',
        ink: '#1a0f02',
        ftdred: '#c0392b',
        ftdgreen: '#2d6a4f',
        mid: '#8a7560',
        lb: '#f0dfc0',
        ftdblue: '#1a6bb5',
        ftdpurple: '#5b21b6',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', '"Courier New"', 'monospace'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
