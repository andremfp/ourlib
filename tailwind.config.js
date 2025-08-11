/** @type {import('tailwindcss').Config} */
import tailwindTransitions from "./src/plugins/tailwindTransitions";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        nav: "1.1rem",
        "nav-subtext": "0.8rem",
        "modal-title": "1.2rem",
        "modal-text": "1rem",
        "modal-button": "1rem",
        "menu-title": "1.2rem",
        "menu-text": "1rem",
        "menu-button": "1rem",
      },
      spacing: {
        "footer-padding": "env(safe-area-inset-bottom)",
        "nav-padding": "env(safe-area-inset-bottom)",
      },
      borderWidth: {
        hairline: "0.5px",
      },
      colors: {
        // Navigation colors
        "light-nav": "#7ea6ff",
        "light-nav-text": "#1F2937",
        "light-nav-secondary": "#f2f4f8",
        "dark-nav": "#27272A",
        "dark-nav-text": "#9CA3AF",
        "dark-nav-secondary": "#3a3a3e",
        "light-nav-sort-controls": "#a1bdff",
        "dark-nav-sort-controls": "#414145",

        // Background colors
        "light-bg": "#f2f4f8",
        "dark-bg": "#18181B",
        "light-bg-secondary": "#e5e7eb", // slightly darker than light-bg
        "dark-bg-secondary": "#23272f", // TODO tweak these colors

        // Text colors
        "light-primary-text": "#1F2937",
        "light-secondary-text": "#6B7280",
        "dark-primary-text": "#E5E7EB",
        "dark-secondary-text": "#9CA3AF",
        "menu-blue": "#007AFF",
        "danger-red": "#FF3B30",

        // UI Element colors
        "light-border": "#f9fafb",
        "dark-border": "#6b7280",
        "light-placeholder": "#f3f4f6",
        "dark-placeholder": "#6b7280",
      },
      // Animation durations
      transitionDuration: {
        backdrop: "250ms",
        modal: "300ms",
        slide: "300ms",
      },
      // Animation curves
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      // Keyframe animations
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        modalIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        modalOut: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      // Named animations
      animation: {
        "fade-in": "fadeIn backdrop smooth",
        "fade-out": "fadeOut backdrop smooth",
        "modal-in": "modalIn modal smooth",
        "modal-out": "modalOut modal smooth",
        "slide-up": "slideUp slide smooth",
        "slide-down": "slideDown slide smooth",
      },
    },
  },
  plugins: [
    // Add Vue transitions plugin
    tailwindTransitions,
  ],
};
