/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        xxs: "0.65rem",
        nav: "1.1rem",
      },
      spacing: {
        "footer-padding": "env(safe-area-inset-bottom)",
        "nav-padding": "env(safe-area-inset-bottom)",
      },
      colors: {
        "light-nav": "#7ea6ff",
        "light-nav-text": "#1F2937",
        "light-bg": "#f2f4f8",
        "dark-nav": "#27272A",
        "dark-nav-text": "#9CA3AF",
        "dark-bg": "#18181B",
        "light-primary-text": "#1F2937",
        "light-secondary-text": "#6B7280",
        "dark-primary-text": "#E5E7EB",
        "dark-secondary-text": "#9CA3AF",
      },
    },
  },
  plugins: [],
};
