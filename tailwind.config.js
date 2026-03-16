/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './impressum.html', './datenschutz.html'],
  theme: {
    extend: {
      colors: {
        'royal':   '#1A3D8F',
        'deep':    '#0C1B3A',
        'navy':    '#0F2150',
        'mid':     '#3567C0',
        'gold':    '#D4961A',
        'gold-lt': '#F0B830',
        'brass':   '#8B7847',
        'red':     '#E8193C',
        'cloud':   '#F4F7FF',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        heading: ['"Barlow Condensed"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
      },
    }
  },
  plugins: [],
}
