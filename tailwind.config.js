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
        // Navigation colors
        "light-nav": "#7ea6ff",
        "light-nav-text": "#1F2937",
        "dark-nav": "#27272A",
        "dark-nav-text": "#9CA3AF",

        // Background colors
        "light-bg": "#f2f4f8",
        "dark-bg": "#18181B",

        // Text colors
        "light-primary-text": "#1F2937",
        "light-secondary-text": "#6B7280",
        "dark-primary-text": "#E5E7EB",
        "dark-secondary-text": "#9CA3AF",

        // Card colors
        "light-card": "#ffffff",
        "dark-card": "#18181B",

        // UI Element colors
        "light-border": "#f9fafb",
        "dark-border": "#6b7280",
        "light-placeholder": "#f3f4f6",
        "dark-placeholder": "#6b7280",
      },
    },
  },
  plugins: [],
};
