module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          bg: '#08101b',
          panel: '#0d1b29',
          accent: '#4fd1c5',
          muted: '#7f97a7',
        },
      },
    },
  },
  plugins: [],
};
