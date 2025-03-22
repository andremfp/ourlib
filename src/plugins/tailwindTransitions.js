// Import Tailwind's plugin function
import plugin from "tailwindcss/plugin.js";

/**
 * This plugin connects Tailwind animations with Vue transitions
 * by adding the necessary Vue transition classes.
 * It uses prebuilt animations from tailwind.config.js
 */
export default plugin(function ({ addUtilities }) {
  // Creating Vue transition classes that use Tailwind's animations
  const vueTransitionUtilities = {
    // Fade transition
    ".fade-enter-active": {
      "@apply animate-fade-in": {},
    },
    ".fade-leave-active": {
      "@apply animate-fade-out": {},
    },

    // Modal animation
    ".modalAnim-enter-active": {
      "@apply animate-modal-in": {},
    },
    ".modalAnim-leave-active": {
      "@apply animate-modal-out": {},
    },

    // Slide up/down animations
    ".slide-up-enter-active": {
      "@apply animate-slide-up": {},
    },
    ".slide-up-leave-active": {
      "@apply animate-slide-down": {},
    },
  };

  addUtilities(vueTransitionUtilities);
});
