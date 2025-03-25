import { ref } from "vue";
import { UI_STATE, ANIMATION, EVENTS } from "@/constants/constants";

export function useDrawerTransition() {
  const drawerProgress = ref(UI_STATE.LIBRARY_DRAWER.CLOSED);

  // Handle drawer progress updates
  const handleDrawerProgress = (event: Event) => {
    const progress = (event as CustomEvent).detail;
    drawerProgress.value = progress;
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

  // Setup event listeners
  const setupEventListeners = () => {
    window.addEventListener(
      EVENTS.LIBRARY_DRAWER.PROGRESS,
      handleDrawerProgress,
    );
  };

  // Cleanup event listeners
  const cleanupEventListeners = () => {
    window.removeEventListener(
      EVENTS.LIBRARY_DRAWER.PROGRESS,
      handleDrawerProgress,
    );
  };

  return {
    drawerProgress,
    calculateOpacity,
    getTitleTransitionStyle,
    setupEventListeners,
    cleanupEventListeners,
  };
}
