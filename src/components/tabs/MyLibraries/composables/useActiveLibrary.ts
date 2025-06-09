import { ref, watch, type Ref } from "vue";
import { getLibraryBooks } from "@/apis/bookAPI";
import { getLibrary, updateLibrary, deleteLibrary } from "@/apis/libraryAPI";
import type { Book, Library } from "@/apis/schema";
import { EVENTS } from "@/constants/constants";
import logger from "@/utils/logger";

/**
 * Fetches and manages the data and actions for the currently active library.
 *
 * @param libraryIdRef Ref<string> - A ref containing the ID of the active library.
 * @returns Reactive state and methods related to the active library.
 */
export function useActiveLibrary(libraryIdRef: Ref<string>) {
  const books = ref<Book[]>([]);
  const library = ref<Library | null>(null);
  const libraryName = ref<string>(""); // Holds the library name for display/editing
  const isLoading = ref<boolean>(true); // Starts true, becomes false after initial fetch attempt
  const error = ref<string | null>(null); // Holds fetch/operation errors

  // Fetches both library details and books
  const fetchLibraryData = async (id: string) => {
    if (!id) {
      logger.warn("[useActiveLibrary] Fetch aborted: No library ID provided.");
      // Reset state if ID becomes invalid
      books.value = [];
      library.value = null;
      libraryName.value = "";
      isLoading.value = false; // Ensure loading stops
      error.value = null;
      return;
    }

    isLoading.value = true;
    error.value = null;
    logger.info(`[useActiveLibrary] Fetching data for library ID: ${id}`);

    try {
      // Fetch library data and books concurrently
      const [fetchedBooks, fetchedLibrary] = await Promise.all([
        getLibraryBooks(id),
        getLibrary(id),
      ]);

      books.value = fetchedBooks;
      library.value = fetchedLibrary;
      libraryName.value = fetchedLibrary?.name || "";
      logger.info(
        `[useActiveLibrary] Fetched library '${libraryName.value}' (${books.value.length} books).`,
      );
    } catch (err) {
      logger.error("[useActiveLibrary] Failed to fetch library data:", err);
      error.value = "Failed to load library content.";
      // Reset state on error to avoid displaying stale data
      books.value = [];
      library.value = null;
      libraryName.value = "";
    } finally {
      isLoading.value = false;
    }
  };

  // Handles renaming the library
  const handleLibraryRename = async (newName: string) => {
    const trimmedName = newName.trim();
    const currentId = libraryIdRef.value;
    const currentLibrary = library.value;

    if (!trimmedName || !currentLibrary || !currentId) {
      logger.warn(
        "[useActiveLibrary] Rename aborted (invalid name or library state).",
      );
      return;
    }
    // Avoid API call if name is the same
    if (trimmedName === libraryName.value) {
      logger.info("[useActiveLibrary] Rename skipped (name unchanged).");
      return;
    }

    const oldName = libraryName.value;
    // Optimistically update local state for responsiveness
    libraryName.value = trimmedName;
    currentLibrary.name = trimmedName;

    // Dispatch global events immediately so other components (navbar, list) can react
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY.NAVBAR_NAME_UPDATE, {
        detail: trimmedName,
      }),
    );
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY.UPDATED, {
        detail: { id: currentId, name: trimmedName },
      }),
    );

    try {
      logger.info(
        `[useActiveLibrary] Renaming library ${currentId} to '${trimmedName}'`,
      );
      await updateLibrary(currentId, trimmedName);
      logger.info(
        `[useActiveLibrary] Library ${currentId} renamed successfully in backend.`,
      );
    } catch (err) {
      logger.error(
        "[useActiveLibrary] Failed to rename library in backend:",
        err,
      );
      // Revert optimistic updates on failure
      libraryName.value = oldName;
      currentLibrary.name = oldName;
      window.dispatchEvent(
        new CustomEvent(EVENTS.LIBRARY.NAVBAR_NAME_UPDATE, { detail: oldName }),
      );
      window.dispatchEvent(
        new CustomEvent(EVENTS.LIBRARY.UPDATED, {
          detail: { id: currentId, name: oldName },
        }),
      );
      // Consider setting error state for UI feedback
      // error.value = "Failed to rename library. Please try again.";
    }
  };

  // Handles deleting the library
  const handleLibraryDelete = async (): Promise<boolean> => {
    const currentId = libraryIdRef.value;
    if (!currentId) {
      logger.warn("[useActiveLibrary] Delete aborted: No library ID.");
      return false;
    }

    try {
      logger.info(`[useActiveLibrary] Deleting library ${currentId}...`);
      await deleteLibrary(currentId);
      logger.info(
        `[useActiveLibrary] Library ${currentId} deleted successfully from backend.`,
      );
      // Dispatch event *after* successful backend deletion
      window.dispatchEvent(
        new CustomEvent(EVENTS.LIBRARY.DELETED, { detail: currentId }),
      );
      // Reset local state after successful deletion
      books.value = [];
      library.value = null;
      libraryName.value = "";
      error.value = null; // Clear any previous errors
      return true;
    } catch (err) {
      logger.error(
        "[useActiveLibrary] Failed to delete library from backend:",
        err,
      );
      // Consider setting error state for UI feedback
      // error.value = "Failed to delete library. Please try again.";
      return false;
    }
  };

  // Watch the libraryIdRef to automatically fetch data when it changes
  watch(
    libraryIdRef,
    (newId) => {
      fetchLibraryData(newId);
    },
    { immediate: true }, // Fetch data immediately when the composable is first used
  );

  return {
    books, // Array of books in the library
    library, // The library object itself (or null)
    libraryName, // Reactive library name (for display/editing)
    isLoading, // Loading state for initial fetch/refetch
    error, // Holds error messages for feedback
    handleLibraryRename, // Function to rename the library
    handleLibraryDelete, // Function to delete the library (returns Promise<boolean>)
    fetchLibraryData, // Function to manually trigger a data fetch
  };
}
