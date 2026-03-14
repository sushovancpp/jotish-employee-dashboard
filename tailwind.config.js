/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void:    '#08080f',
        panel:   '#0f0f1a',
        border:  '#1e1e30',
        amber:   '#f59e0b',
        cyan:    '#06b6d4',
        muted:   '#4a4a6a',
        ghost:   '#8888aa',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        body:    ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
