import { ref } from "vue";
import { UI_STATE, ANIMATION, EVENTS } from "@/constants/constants";
import logger from "@/utils/logger"; // Import logger

/**
 * Composable managing the state and calculations for drawer-related transitions
 * within the Navbar, primarily focusin g on the drawer's open/close progress
 * and deriving styles for smooth animations (e.g., title sliding).
 *
 * @returns {object} Reactive refs and methods for drawer transition management.
 */
export function useDrawerTransition() {
  /** The progress of the library drawer opening (0 = closed, 1 = open). */
  const drawerProgress = ref<number>(UI_STATE.LIBRARY_DRAWER.CLOSED);

  /**
   * Event listener callback to update the drawer progress based on a global event.
   *
   * @param {Event} event - The event object, expected to be a CustomEvent with progress in detail.
   */
  const handleDrawerProgress = (event: Event) => {
    const progress = (event as CustomEvent).detail;
    if (typeof progress === "number" && progress >= 0 && progress <= 1) {
      drawerProgress.value = progress;
    } else {
      logger.warn(
        "[Navbar/useDrawerTransition] Received invalid drawer progress event detail.",
        progress,
      );
    }
  };

  // Calculate opacity based on drawer progress for transitions
  const calculateOpacity = (isVisible: boolean) => {
    if (isVisible) {
      return drawerProgress.value;
    } else {
      return UI_STATE.LIBRARY_DRAWER.OPEN - drawerProgress.value;
    }
  };

  // Get title transition styles
  const getTitleTransitionStyle = (isLibraryTitle: boolean) => {
    if (isLibraryTitle) {
      return {
        opacity: Math.max(
          UI_STATE.LIBRARY_DRAWER.CLOSED,
          drawerProgress.value * ANIMATION.NAVBAR.TITLE_SLIDE_MULTIPLIER -
            ANIMATION.NAVBAR.TITLE_SLIDE_OFFSET,
        ),
        left: "50%",
        transform: `translateX(calc(-50% + ${
          (UI_STATE.LIBRARY_DRAWER.OPEN - drawerProgress.value) *
          ANIMATION.NAVBAR.LIBRARY_NAME_SLIDE
        }%))`,
        transition:
          drawerProgress.value === UI_STATE.LIBRARY_DRAWER.CLOSED ||
          drawerProgress.value === UI_STATE.LIBRARY_DRAWER.OPEN
            ? `all ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
            : "none",
      };
    } else {
      return {
        opacity: Math.max(
          UI_STATE.LIBRARY_DRAWER.CLOSED,
          UI_STATE.LIBRARY_DRAWER.OPEN -
            drawerProgress.value * ANIMATION.NAVBAR.TITLE_SLIDE_MULTIPLIER +
            ANIMATION.NAVBAR.TITLE_SLIDE_OFFSET,
        ),
        left: "50%",
        transform: `translateX(calc(-50% + ${
          drawerProgress.value * ANIMATION.NAVBAR.TAB_NAME_SLIDE
        }%))`,
        transition:
          drawerProgress.value === UI_STATE.LIBRARY_DRAWER.CLOSED ||
          drawerProgress.value === UI_STATE.LIBRARY_DRAWER.OPEN
            ? `all ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
            : "none",
      };
    }
  };

  /** Sets up the global event listener for drawer progress updates. */
  const setupEventListeners = () => {
    logger.debug("[Navbar/useDrawerTransition] Setting up event listeners.");
    window.addEventListener(
      EVENTS.LIBRARY_DRAWER.PROGRESS,
      handleDrawerProgress,
    );
  };

  /** Removes the global event listener for drawer progress updates. */
  const cleanupEventListeners = () => {
    logger.debug("[Navbar/useDrawerTransition] Cleaning up event listeners.");
    window.removeEventListener(
      EVENTS.LIBRARY_DRAWER.PROGRESS,
      handleDrawerProgress,
    );
  };

  return {
    /** The current progress of the drawer opening (0-1, reactive). */
    drawerProgress,
    calculateOpacity,
    getTitleTransitionStyle,
    /** Function to set up event listeners. */
    setupEventListeners,
    /** Function to clean up event listeners. */
    cleanupEventListeners,
  };
}
