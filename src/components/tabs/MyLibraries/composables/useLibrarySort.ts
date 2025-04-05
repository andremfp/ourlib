// src/components/tabs/MyLibraries/composables/useLibrarySort.ts
import { ref, watch, type Ref } from "vue";
import type { Library } from "@/apis/types";
import { SORT } from "@/constants/constants";
import logger from "@/utils/logger";

/**
 * Composable for managing library sorting state and logic.
 *
 * @param librariesRef Ref<Library[]> - The ref containing the array of libraries to sort.
 * @param isDrawerOpen Ref<boolean> - Ref indicating if the library drawer is currently open.
 * @returns Object containing handleSortChange method and sortLibraries function.
 */
export function useLibrarySort(
  librariesRef: Ref<Library[]>,
  isDrawerOpen: Ref<boolean>,
) {
  const sortBy = ref<string>(SORT.BY.NAME);
  const sortReverse = ref<boolean>(SORT.DIRECTION.ASC);

  // Function to sort libraries based on current settings
  const sortLibraries = () => {
    // Check if librariesRef.value is actually an array and has items
    if (!Array.isArray(librariesRef.value) || librariesRef.value.length === 0) {
      return;
    }

    // Create a shallow copy to sort, then replace the original ref's value
    // This ensures reactivity triggers correctly if watchers depend on the array reference
    const sortedLibraries = [...librariesRef.value].sort((a, b) => {
      let result = 0;
      if (sortBy.value === SORT.BY.NAME) {
        // Ensure names are defined before comparing
        const nameA = a.name || "";
        const nameB = b.name || "";
        result = nameA.localeCompare(nameB);
      } else if (sortBy.value === SORT.BY.DATE) {
        // Handle potentially undefined or invalid date strings
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        // Check for valid timestamps before subtracting
        result = (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      }
      // Add other sort criteria here if needed

      return sortReverse.value ? -result : result;
    });

    // Assign the sorted array back to the ref's value
    librariesRef.value = sortedLibraries;
  };

  // Handle sort changes from external events (e.g., navbar)
  const handleSortChange = (event: Event) => {
    // Type assertion for CustomEvent detail
    const detail = (event as CustomEvent).detail;
    if (
      detail &&
      typeof detail.sortBy === "string" &&
      typeof detail.sortReverse === "boolean"
    ) {
      // Check if values actually changed to prevent unnecessary sorts
      if (
        sortBy.value !== detail.sortBy ||
        sortReverse.value !== detail.sortReverse
      ) {
        sortBy.value = detail.sortBy;
        sortReverse.value = detail.sortReverse;
        // Sorting is handled by the watcher below
        logger.info("[useLibrarySort] Sort settings changed.", {
          sortBy: sortBy.value,
          sortReverse: sortReverse.value,
        });
      }
    } else {
      logger.warn(
        "[useLibrarySort] Received invalid sort change event detail:",
        detail,
      );
    }
  };

  // Watch sort criteria changes to trigger re-sorting, but only if the drawer is closed
  watch([sortBy, sortReverse], () => {
    if (!isDrawerOpen.value) {
      sortLibraries();
    }
    // If drawer is open, sorting will be handled explicitly on close
  });

  // Initial sort when the composable is used
  sortLibraries();

  return {
    handleSortChange,
    sortLibraries, // Exposed for explicit calls after data mutation
  };
}
