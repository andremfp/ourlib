/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      spacing: {
        "footer-padding": "env(safe-area-inset-bottom)",
        "footer-height": "85px",
      },
    },
  },
  plugins: [],
};
