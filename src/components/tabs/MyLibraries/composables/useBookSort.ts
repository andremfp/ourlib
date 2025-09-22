import { ref, type Ref, computed } from "vue";
import type { Book } from "@/schema";
import { SORT } from "@/constants/constants";
import logger from "@/utils/logger";

/**
 * Composable for managing book sorting state and logic.
 *
 * @param sourceBooksRef Ref<Book[]> - The ref containing the original array of books to sort.
 * @returns A computed ref `sortedBooks` and methods to control sorting.
 */
export function useBookSort(sourceBooksRef: Ref<Book[]>) {
  const sortBy = ref<string>(SORT.BY.TITLE);
  const sortReverse = ref<boolean>(SORT.DIRECTION.ASC);

  const sortedBooks = computed(() => {
    logger.debug("[useBookSort] Re-computing sorted books.");
    if (!Array.isArray(sourceBooksRef.value)) {
      return [];
    }

    // Create a shallow copy to sort
    return [...sourceBooksRef.value].sort((a, b) => {
      let result = 0;

      if (sortBy.value === SORT.BY.TITLE) {
        const titleA = a.title || "";
        const titleB = b.title || "";
        result = titleA.localeCompare(titleB);
      } else if (sortBy.value === SORT.BY.AUTHOR) {
        const authorA = a.authors?.[0] || "";
        const authorB = b.authors?.[0] || "";
        result = authorA.localeCompare(authorB);
      } else if (sortBy.value === SORT.BY.DATE) {
        const timeA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
        result = (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      }

      return sortReverse.value ? -result : result;
    });
  });

  // Handle sort changes from external events (e.g., sort controls)
  const handleSortChange = (event: Event) => {
    // Type assertion for CustomEvent detail
    const detail = (event as CustomEvent).detail;
    if (
      detail &&
      typeof detail.sortBy === "string" &&
      typeof detail.sortReverse === "boolean"
    ) {
      let stateChanged = false;

      // Check if values actually changed to prevent unnecessary re-renders
      if (sortBy.value !== detail.sortBy) {
        sortBy.value = detail.sortBy;
        stateChanged = true;
      }
      if (sortReverse.value !== detail.sortReverse) {
        sortReverse.value = detail.sortReverse;
        stateChanged = true;
      }

      if (stateChanged) {
        logger.info("[useBookSort] Sort settings changed via event.", {
          sortBy: sortBy.value,
          sortReverse: sortReverse.value,
        });
      }
    } else {
      logger.warn(
        "[useBookSort] Received invalid sort change event detail:",
        detail,
      );
    }
  };

  return {
    sortedBooks, // This is the reactive, sorted list to be used in the template
    handleSortChange,
    sortBy,
    sortReverse,
  };
}
