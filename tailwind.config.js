/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        xxs: "0.65rem",
      },
      spacing: {
        "footer-padding": "env(safe-area-inset-bottom)",
        "nav-padding": "env(safe-area-inset-bottom)",
      },
      colors: {
        "light-nav": "#7ea6ff",
        "light-bg": "#f2f4f8",
        "dark-nav": "#27272A",
        "dark-bg": "#18181B",
      },
    },
  },
  plugins: [],
};
