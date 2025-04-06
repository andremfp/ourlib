import { ref } from "vue";
import { SORT, EVENTS } from "@/constants/constants";

export function useSort() {
  // Sort state
  const savedSortBy = ref<string>(SORT.BY.NAME);
  const savedSortReverse = ref<boolean>(SORT.DIRECTION.ASC);
  const sortBy = ref<string>(SORT.BY.NAME);
  const sortReverse = ref<boolean>(SORT.DIRECTION.ASC);

  // Function to change sort method
  const changeSortBy = () => {
    // Toggle between name and date added and set default direction
    if (sortBy.value === SORT.BY.NAME) {
      sortBy.value = SORT.BY.DATE;
      sortReverse.value = SORT.DIRECTION.DESC; // Default for Date: Newest to Oldest
    } else {
      sortBy.value = SORT.BY.NAME;
      sortReverse.value = SORT.DIRECTION.ASC; // Default for Name: A to Z
    }

    // Also update saved values when in libraries view
    if (!isInLibraryView()) {
      savedSortBy.value = sortBy.value;
      savedSortReverse.value = sortReverse.value; // Update saved direction too
    }

    dispatchSortEvent();
  };

  // Function to toggle sort direction
  const toggleSortDirection = () => {
    sortReverse.value = !sortReverse.value;

    // Also update saved values when in libraries view
    if (!isInLibraryView()) {
      savedSortReverse.value = sortReverse.value;
    }

    dispatchSortEvent();
  };

  // Helper to check if we're in a library detailed view
  const isInLibraryView = () => {
    // This will be set by the parent component
    return !!currentLibraryName.value;
  };

  // Current library name (will be set from outside)
  const currentLibraryName = ref("");

  // Dispatch sort event with current sort settings
  const dispatchSortEvent = () => {
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY.SORT_CHANGED, {
        detail: {
          sortBy: sortBy.value,
          sortReverse: sortReverse.value,
        },
      }),
    );
  };

  // Reset sort settings
  const resetSort = () => {
    sortBy.value = SORT.BY.NAME;
    sortReverse.value = SORT.DIRECTION.ASC;
    savedSortBy.value = SORT.BY.NAME;
    savedSortReverse.value = SORT.DIRECTION.ASC;
  };

  // When entering a library view, save current sort and set new sort
  const enterLibraryView = (name: string) => {
    // Save the current sort settings
    if (!currentLibraryName.value) {
      savedSortBy.value = sortBy.value;
      savedSortReverse.value = sortReverse.value;
    }

    // Set the library name
    currentLibraryName.value = name;

    // Reset sort for library view
    sortBy.value = SORT.BY.NAME;
    sortReverse.value = false;

    // Dispatch the event to update the UI
    dispatchSortEvent();
  };

  // When exiting library view, restore saved sort
  const exitLibraryView = () => {
    currentLibraryName.value = "";
    sortBy.value = savedSortBy.value;
    sortReverse.value = savedSortReverse.value;

    // Dispatch the event to update the UI
    dispatchSortEvent();
  };

  return {
    sortBy,
    sortReverse,
    savedSortBy,
    savedSortReverse,
    currentLibraryName,
    changeSortBy,
    toggleSortDirection,
    dispatchSortEvent,
    resetSort,
    enterLibraryView,
    exitLibraryView,
  };
}
