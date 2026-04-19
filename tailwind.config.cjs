module.exports = {
  darkMode: ["class", "html[data-theme='dark']"],
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/container-queries"), require("daisyui")],
};
