/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./popup.html", "./popup.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["FarsiamoUI", "Tahoma", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [],
};
