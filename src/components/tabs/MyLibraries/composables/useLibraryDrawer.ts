import { ref, computed, onMounted, onUnmounted } from "vue";
import type { Library } from "@/apis/types";
import { UI_STATE, ANIMATION, EVENTS } from "@/constants/constants";
import logger from "@/utils/logger";

/**
 * Manages the state and interactions for the Library Drawer.
 * Controls the selection, opening, closing and progress tracking of the library drawer.
 *
 * @returns Reactive state and methods for controlling the library drawer.
 */
export function useLibraryDrawer() {
  const selectedLibrary = ref<Library | null>(null);
  const libraryDrawerProgress = ref<number>(UI_STATE.LIBRARY_DRAWER.CLOSED);
  const isDrawerOpen = computed(() => !!selectedLibrary.value);

  /**
   * Selects a library and prepares it for display in the drawer.
   * Initializes necessary state and dispatches events for library selection.
   */
  const selectLibrary = (library: Library) => {
    if (!library) {
      logger.warn("[useLibraryDrawer] Attempted to select a null library.");
      return;
    }
    // Avoid re-selecting the same library if already open
    if (selectedLibrary.value?.id === library.id) {
      return;
    }

    logger.info("[useLibraryDrawer] Selecting library:", library.id);

    // Set library and initialize drawer as closed (required for animation)
    selectedLibrary.value = library;

    // Notify about name update immediately
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY.NAVBAR_NAME_UPDATE, {
        detail: library.name,
      }),
    );

    // Send initial closed state - the drawer component will handle the animation sequence
    libraryDrawerProgress.value = UI_STATE.LIBRARY_DRAWER.CLOSED;
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY_DRAWER.PROGRESS, {
        detail: UI_STATE.LIBRARY_DRAWER.CLOSED,
      }),
    );
  };

  /**
   * Closes the library drawer and cleans up related state.
   * Dispatches necessary events to notify other components.
   */
  const closeDrawer = () => {
    // Prevent closing actions if already closed
    if (!selectedLibrary.value) return;

    logger.info("[useLibraryDrawer] Closing drawer.");
    selectedLibrary.value = null;
    libraryDrawerProgress.value = UI_STATE.LIBRARY_DRAWER.CLOSED;
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY.NAVBAR_NAME_UPDATE, { detail: "" }),
    );
    // Dispatch final progress event
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY_DRAWER.PROGRESS, {
        detail: UI_STATE.LIBRARY_DRAWER.CLOSED,
      }),
    );
  };

  /**
   * Updates the progress of the drawer animation and dispatches related events.
   * Used by the drawer component to notify the system of position changes.
   */
  const handleLibraryDrawerProgress = (progress: number) => {
    // Clamp progress value to ensure it's within valid bounds
    const clampedProgress = Math.max(
      UI_STATE.LIBRARY_DRAWER.CLOSED,
      Math.min(UI_STATE.LIBRARY_DRAWER.OPEN, progress),
    );

    // Always update progress for animations to work properly
    libraryDrawerProgress.value = clampedProgress;

    // Dispatch event to notify other components for components that listen globally
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY_DRAWER.PROGRESS, {
        detail: clampedProgress,
      }),
    );
  };

  /**
   * Handles the BACK_TO_LIBRARIES event triggered by the navbar.
   * Initiates the closing animation and cleans up state after a delay.
   */
  const onBackToLibraries = () => {
    logger.info("[useLibraryDrawer] Received BACK_TO_LIBRARIES event.");

    // Only proceed if the drawer is open
    if (!selectedLibrary.value) return;

    // Start the closing animation by updating progress
    libraryDrawerProgress.value = UI_STATE.LIBRARY_DRAWER.CLOSED;

    // Dispatch global progress event
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY_DRAWER.PROGRESS, {
        detail: UI_STATE.LIBRARY_DRAWER.CLOSED,
      }),
    );

    // Delay setting selectedLibrary to null until transition finishes
    setTimeout(() => {
      // Only close if we're still in closing state
      if (libraryDrawerProgress.value === UI_STATE.LIBRARY_DRAWER.CLOSED) {
        selectedLibrary.value = null;
        // Clear the library name in the navbar
        window.dispatchEvent(
          new CustomEvent(EVENTS.LIBRARY.NAVBAR_NAME_UPDATE, { detail: "" }),
        );
      }
    }, ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION);
  };

  // Setup event listener
  onMounted(() => {
    window.addEventListener(
      EVENTS.LIBRARY_DRAWER.BACK_TO_LIBRARIES,
      onBackToLibraries,
    );
  });

  // Cleanup event listener
  onUnmounted(() => {
    window.removeEventListener(
      EVENTS.LIBRARY_DRAWER.BACK_TO_LIBRARIES,
      onBackToLibraries,
    );
  });

  return {
    selectedLibrary,
    libraryDrawerProgress,
    isDrawerOpen,
    selectLibrary,
    closeDrawer,
    handleLibraryDrawerProgress,
  };
}
