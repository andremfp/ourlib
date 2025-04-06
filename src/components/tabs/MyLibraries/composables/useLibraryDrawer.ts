import { ref, computed, onMounted, onUnmounted } from "vue";
import type { Library } from "@/apis/types";
import { UI_STATE, ANIMATION, EVENTS } from "@/constants/constants";
import logger from "@/utils/logger";

/**
 * Manages the state and interactions for the Library Drawer.
 *
 * @returns Reactive state and methods for controlling the library drawer.
 */
export function useLibraryDrawer() {
  const selectedLibrary = ref<Library | null>(null);
  const libraryDrawerProgress = ref<number>(UI_STATE.LIBRARY_DRAWER.CLOSED);
  const isDrawerOpen = computed(() => !!selectedLibrary.value);

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
    selectedLibrary.value = library;
    libraryDrawerProgress.value = UI_STATE.LIBRARY_DRAWER.OPEN;

    // Notify other components about the change
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY.NAVBAR_NAME_UPDATE, {
        detail: library.name,
      }),
    );
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY_DRAWER.PROGRESS, {
        detail: UI_STATE.LIBRARY_DRAWER.OPEN,
      }),
    );
  };

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

  const handleLibraryDrawerProgress = (progress: number) => {
    // Clamp progress value
    const clampedProgress = Math.max(
      UI_STATE.LIBRARY_DRAWER.CLOSED,
      Math.min(UI_STATE.LIBRARY_DRAWER.OPEN, progress),
    );
    if (libraryDrawerProgress.value !== clampedProgress) {
      libraryDrawerProgress.value = clampedProgress;
      window.dispatchEvent(
        new CustomEvent(EVENTS.LIBRARY_DRAWER.PROGRESS, {
          detail: clampedProgress,
        }),
      );
    }
  };

  // Handle the BACK_TO_LIBRARIES event (e.g., triggered by header button)
  const onBackToLibraries = () => {
    logger.info("[useLibraryDrawer] Received BACK_TO_LIBRARIES event.");
    // Start the closing animation/transition
    libraryDrawerProgress.value = UI_STATE.LIBRARY_DRAWER.CLOSED;
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY_DRAWER.PROGRESS, {
        detail: UI_STATE.LIBRARY_DRAWER.CLOSED,
      }),
    );
    // Delay setting selectedLibrary to null until transition finishes
    setTimeout(() => {
      // Check if it's still closing before nullifying
      if (libraryDrawerProgress.value === UI_STATE.LIBRARY_DRAWER.CLOSED) {
        selectedLibrary.value = null;
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
