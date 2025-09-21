import { ref, watch, type Ref } from "vue";
import type { Book } from "@/schema";
import { SORT } from "@/constants/constants";
import logger from "@/utils/logger";

/**
 * Composable for managing book sorting state and logic.
 *
 * @param booksRef Ref<Book[]> - The ref containing the array of books to sort.
 * @returns Object containing handleSortChange method and sortBooks function.
 */
export function useBookSort(booksRef: Ref<Book[]>) {
  const sortBy = ref<string>(SORT.BY.TITLE);
  const sortReverse = ref<boolean>(SORT.DIRECTION.ASC);

  // Function to sort books based on current settings
  const sortBooks = () => {
    // Check if booksRef.value is actually an array and has items
    if (!Array.isArray(booksRef.value) || booksRef.value.length === 0) {
      return;
    }

    const currentOrderIds = booksRef.value.map((book) => book.id);

    // Create a shallow copy to sort
    const sortedBooks = [...booksRef.value].sort((a, b) => {
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
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        result = (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      }

      return sortReverse.value ? -result : result;
    });

    const newOrderIds = sortedBooks.map((book) => book.id);

    // Only assign back if the order of IDs has actually changed
    if (JSON.stringify(currentOrderIds) !== JSON.stringify(newOrderIds)) {
      logger.debug("[useBookSort] Book order changed, updating ref.");
      booksRef.value = sortedBooks;
    } else {
      logger.debug("[useBookSort] Book order unchanged, skipping ref update.");
    }
  };

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
        logger.info("[useBookSort] Sort settings changed via event.", {
          sortBy: sortBy.value,
          sortReverse: sortReverse.value,
        });
        sortBooks();
      }
    } else {
      logger.warn(
        "[useBookSort] Received invalid sort change event detail:",
        detail,
      );
    }
  };

  // Watch sort criteria changes OR book list changes to trigger re-sorting
  watch(
    [sortBy, sortReverse, booksRef],
    () => {
      sortBooks();
    },
    { immediate: true }, // Ensure initial sort happens
  );

  return {
    handleSortChange,
    sortBooks, // Exposed for explicit calls after data mutation
    sortBy,
    sortReverse,
  };
}
