import { ref } from "vue";
import { EVENTS, ANIMATION } from "@/constants/constants";

export function useLibrariesNavigation() {
  const currentLibraryName = ref("");

  // Function to go back to libraries list
  const goBackToLibraries = (onComplete?: () => void) => {
    window.dispatchEvent(new Event(EVENTS.LIBRARY_DRAWER.BACK_TO_LIBRARIES));

    // Delay clearing the library name until animation completes
    setTimeout(() => {
      currentLibraryName.value = "";
      if (onComplete) onComplete();
    }, ANIMATION.NAVBAR.TRANSITION_DURATION);
  };

  // Listen for library name updates
  const updateLibraryName = (event: Event) => {
    const customEvent = event as CustomEvent;
    const newName = customEvent.detail;

    // Only update the name - sort settings are handled by the watcher in the parent component
    currentLibraryName.value = newName;
  };

  // Setup event listeners
  const setupEventListeners = () => {
    window.addEventListener(
      EVENTS.LIBRARY.NAVBAR_NAME_UPDATE,
      updateLibraryName,
    );
  };

  // Cleanup event listeners
  const cleanupEventListeners = () => {
    window.removeEventListener(
      EVENTS.LIBRARY.NAVBAR_NAME_UPDATE,
      updateLibraryName,
    );
  };

  return {
    currentLibraryName,
    goBackToLibraries,
    updateLibraryName,
    setupEventListeners,
    cleanupEventListeners,
  };
}
