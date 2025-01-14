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
      },
    },
  },
  plugins: [],
};
