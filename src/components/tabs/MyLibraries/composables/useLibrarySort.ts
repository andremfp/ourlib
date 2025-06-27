// src/components/tabs/MyLibraries/composables/useLibrarySort.ts
import { ref, watch, type Ref } from "vue";
import type { Library } from "@/schema";
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

    const currentOrderIds = librariesRef.value.map((lib) => lib.id);

    // Create a shallow copy to sort
    const sortedLibraries = [...librariesRef.value].sort((a, b) => {
      let result = 0;
      if (sortBy.value === SORT.BY.NAME) {
        const nameA = a.name || "";
        const nameB = b.name || "";
        result = nameA.localeCompare(nameB);
      } else if (sortBy.value === SORT.BY.DATE) {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        result = (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      }
      return sortReverse.value ? -result : result;
    });

    const newOrderIds = sortedLibraries.map((lib) => lib.id);

    // Only assign back if the order of IDs has actually changed
    // Use JSON.stringify for a simple but effective shallow comparison of ID order
    if (JSON.stringify(currentOrderIds) !== JSON.stringify(newOrderIds)) {
      logger.debug("[useLibrarySort] Library order changed, updating ref.");
      librariesRef.value = sortedLibraries;
    } else {
      logger.debug(
        "[useLibrarySort] Library order unchanged, skipping ref update.",
      );
    }
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
      let stateChanged = false;
      // Check if values actually changed to prevent unnecessary sorts/watcher triggers
      if (sortBy.value !== detail.sortBy) {
        sortBy.value = detail.sortBy;
        stateChanged = true;
      }
      if (sortReverse.value !== detail.sortReverse) {
        sortReverse.value = detail.sortReverse;
        stateChanged = true;
      }

      if (stateChanged) {
        logger.info("[useLibrarySort] Sort settings changed via event.", {
          sortBy: sortBy.value,
          sortReverse: sortReverse.value,
        });
        // Explicitly sort if state changed and drawer is closed
        if (!isDrawerOpen.value) {
          sortLibraries();
        }
      }
    } else {
      logger.warn(
        "[useLibrarySort] Received invalid sort change event detail:",
        detail,
      );
    }
  };

  // Watch sort criteria changes OR library list changes to trigger re-sorting,
  // primarily for initial sort or potential state changes not triggered by the global event handler.
  watch(
    [sortBy, sortReverse, librariesRef], // Watch librariesRef as well
    () => {
      if (!isDrawerOpen.value) {
        sortLibraries();
      }
      // If drawer is open, sorting will be handled explicitly on close or potentially ignored
    },
    { immediate: true }, // Ensure initial sort happens
  );

  return {
    handleSortChange,
    sortLibraries, // Exposed for explicit calls after data mutation
  };
}
