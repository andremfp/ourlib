import { ref } from "vue";
import { SORT, EVENTS } from "@/constants/constants";
import logger from "@/utils/logger"; // Import logger

/**
 * Composable managing the sorting state for the Navbar,
 * especially differentiating between the main library list view and the drawer view.
 * Handles sort method changes, direction toggles, and saving/restoring sort state
 * when entering/exiting a library's detail view (drawer).
 *
 * @returns {object} Reactive refs and methods for sort state management.
 */
export function useSort() {
  // State for the main library list view (saved when drawer opens)
  const savedSortBy = ref<string>(SORT.BY.NAME);
  const savedSortReverse = ref<boolean>(SORT.DIRECTION.ASC);

  // State for the current view (either main list or drawer)
  const sortBy = ref<string>(SORT.BY.NAME);
  const sortReverse = ref<boolean>(SORT.DIRECTION.ASC);

  // Name of the library currently open in the drawer, if any.
  const currentLibraryName = ref("");

  /** Checks if the drawer view is currently active. */
  const isInLibraryView = () => !!currentLibraryName.value;

  /** Dispatches the global sort changed event. */
  const dispatchSortEvent = () => {
    const detail = {
      sortBy: sortBy.value,
      sortReverse: sortReverse.value,
    };
    logger.debug("[Navbar/useSort] Dispatching sort event", detail);
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY.SORT_CHANGED, { detail }),
    );
  };

  /** Changes the sort method (e.g., Name -> Date) and sets the default direction. */
  const changeSortBy = () => {
    logger.debug("[Navbar/useSort] Changing sort method...");
    if (sortBy.value === SORT.BY.NAME) {
      sortBy.value = SORT.BY.DATE;
      sortReverse.value = SORT.DIRECTION.DESC; // Default: Newest to Oldest
    } else {
      sortBy.value = SORT.BY.NAME;
      sortReverse.value = SORT.DIRECTION.ASC; // Default: A to Z
    }
    logger.debug(
      `[Navbar/useSort] New sort: ${sortBy.value}, ${sortReverse.value ? "DESC" : "ASC"}`,
    );

    // If not in drawer view, update the saved state immediately
    if (!isInLibraryView()) {
      savedSortBy.value = sortBy.value;
      savedSortReverse.value = sortReverse.value;
      logger.debug("[Navbar/useSort] Updated saved sort state.");
    }

    dispatchSortEvent();
  };

  /** Toggles the sort direction (ASC <-> DESC). */
  const toggleSortDirection = () => {
    logger.debug("[Navbar/useSort] Toggling sort direction...");
    sortReverse.value = !sortReverse.value;
    logger.debug(
      `[Navbar/useSort] New direction: ${sortReverse.value ? "DESC" : "ASC"}`,
    );

    // If not in drawer view, update the saved state immediately
    if (!isInLibraryView()) {
      savedSortReverse.value = sortReverse.value;
      logger.debug("[Navbar/useSort] Updated saved sort direction.");
    }

    dispatchSortEvent();
  };

  /** Resets sort settings to default (Name, ASC). */
  const resetSort = () => {
    logger.debug("[Navbar/useSort] Resetting sort state to default.");
    sortBy.value = SORT.BY.NAME;
    sortReverse.value = SORT.DIRECTION.ASC;
    savedSortBy.value = SORT.BY.NAME;
    savedSortReverse.value = SORT.DIRECTION.ASC;
    // No need to dispatch event here, typically called when leaving the relevant view.
  };

  /** Saves current sort state and resets drawer sort state when opening a library drawer. */
  const enterLibraryView = (name: string) => {
    logger.debug(`[Navbar/useSort] Entering library view: ${name}`);
    // Save the current sort settings if we weren't already in a library view
    if (!currentLibraryName.value) {
      savedSortBy.value = sortBy.value;
      savedSortReverse.value = sortReverse.value;
      logger.debug("[Navbar/useSort] Saved current sort state.", {
        savedSortBy: savedSortBy.value,
        savedSortReverse: savedSortReverse.value,
      });
    }

    currentLibraryName.value = name;

    // Reset sort for the drawer view (conventionally defaults to Name, ASC in drawer)
    sortBy.value = SORT.BY.NAME;
    sortReverse.value = SORT.DIRECTION.ASC; // Use ASC consistently here
    logger.debug("[Navbar/useSort] Set drawer sort state to default.");

    // Dispatch event to update SortControls UI for the drawer
    dispatchSortEvent();
  };

  /** Restores saved sort state when closing the library drawer. */
  const exitLibraryView = () => {
    logger.debug("[Navbar/useSort] Exiting library view.");
    currentLibraryName.value = "";
    // Restore the saved sort settings
    sortBy.value = savedSortBy.value;
    sortReverse.value = savedSortReverse.value;
    logger.debug("[Navbar/useSort] Restored saved sort state.", {
      sortBy: sortBy.value,
      sortReverse: sortReverse.value,
    });

    // Dispatch event to update SortControls UI back to the main list state
    dispatchSortEvent();
  };

  return {
    /** Current sort method (reactive). */
    sortBy,
    /** Current sort direction (reactive). */
    sortReverse,
    /** Sort method saved from the main list view (reactive). */
    savedSortBy,
    /** Sort direction saved from the main list view (reactive). */
    savedSortReverse,
    /** Name of the library currently open in the drawer (reactive). */
    currentLibraryName,
    /** Function to change the sort method. */
    changeSortBy,
    /** Function to toggle the sort direction. */
    toggleSortDirection,
    /** Function to dispatch the sort event manually if needed. */
    dispatchSortEvent,
    /** Function to reset sort state to defaults. */
    resetSort,
    /** Function to call when entering a library drawer view. */
    enterLibraryView,
    /** Function to call when exiting a library drawer view. */
    exitLibraryView,
  };
}
