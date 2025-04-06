import { ref } from "vue";
import { EVENTS, ANIMATION } from "@/constants/constants";
import logger from "@/utils/logger"; // Import logger

/**
 * Composable managing navigation aspects related to the library drawer within the Navbar.
 * Handles the library name display and the action to navigate back from the drawer.
 *
 * @returns {object} Reactive refs and methods for navigation state and actions.
 */
export function useLibrariesNavigation() {
  /** The name of the library currently displayed in the Navbar title (if drawer is open/opening). */
  const currentLibraryName = ref("");

  /**
   * Dispatches an event to close the library drawer and clears the library name
   * after a delay to allow for animations. Optionally calls a callback on completion.
   *
   * @param {() => void} [onComplete] - Optional callback executed after the name is cleared.
   */
  const goBackToLibraries = (onComplete?: () => void) => {
    logger.debug("[Navbar/useNavigation] Dispatching event to close drawer.");
    window.dispatchEvent(new Event(EVENTS.LIBRARY_DRAWER.BACK_TO_LIBRARIES));

    // Delay clearing the library name to match drawer closing animation
    setTimeout(() => {
      logger.debug("[Navbar/useNavigation] Clearing current library name.");
      currentLibraryName.value = "";
      if (onComplete) {
        logger.debug(
          "[Navbar/useNavigation] Executing goBack completion callback.",
        );
        onComplete();
      }
    }, ANIMATION.NAVBAR.TRANSITION_DURATION);
  };

  /**
   * Event listener callback to update the displayed library name based on a global event.
   *
   * @param {Event} event - The event object, expected to be a CustomEvent with name in detail.
   */
  const handleLibraryNameUpdate = (event: Event) => {
    const newName = (event as CustomEvent).detail;
    if (typeof newName === "string") {
      logger.debug(
        `[Navbar/useNavigation] Received library name update: ${newName}`,
      );
      currentLibraryName.value = newName;
    } else {
      logger.warn(
        "[Navbar/useNavigation] Received invalid library name update event detail.",
        newName,
      );
    }
  };

  /** Sets up the global event listener for library name updates. */
  const setupEventListeners = () => {
    logger.debug("[Navbar/useNavigation] Setting up event listeners.");
    window.addEventListener(
      EVENTS.LIBRARY.NAVBAR_NAME_UPDATE,
      handleLibraryNameUpdate,
    );
  };

  /** Removes the global event listener for library name updates. */
  const cleanupEventListeners = () => {
    logger.debug("[Navbar/useNavigation] Cleaning up event listeners.");
    window.removeEventListener(
      EVENTS.LIBRARY.NAVBAR_NAME_UPDATE,
      handleLibraryNameUpdate,
    );
  };

  return {
    /** The name of the library currently displayed (reactive). */
    currentLibraryName,
    /** Function to initiate the 'go back' action from the drawer view. */
    goBackToLibraries,
    /** Function to set up event listeners. */
    setupEventListeners,
    /** Function to clean up event listeners. */
    cleanupEventListeners,
  };
}
