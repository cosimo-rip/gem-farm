module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      screens: {
        w700: '700px',
        w650: '650px',
        w600: '600px',
        w550: '550px',
        w500: '500px',
        w450: '450px',
        w400: '400px',
        w350: '350px',
        w300: '300px',
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['checked'],
      borderColor: ['checked'],
    },
  },
  plugins: [],
};
