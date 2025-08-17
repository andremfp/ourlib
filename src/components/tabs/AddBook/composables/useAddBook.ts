import { ref, computed, reactive } from "vue";
import { getAuth } from "firebase/auth";
import { fetchBookDetails } from "@/apis/fetchBook";
import { createBook } from "@/apis/bookAPI";
import { useLibraryList } from "@/components/tabs/MyLibraries/composables/useLibraryList";
import type { BookDetails } from "@/apis/fetchBook";
import type { Book, Library } from "@/schema";
import { firestore } from "@/firebase";
import { doc, DocumentReference } from "firebase/firestore";
import { COLLECTION_NAMES } from "@/constants";
import logger from "@/utils/logger";

// Define the modes for the AddBook interface
export type AddBookMode = "selection" | "scan" | "manual" | "form";

// Define the form data structure based on Book type
// Note: authors is stored as comma-separated string for form input, converted to string[] when saving
export interface BookFormData {
  title: string;
  authors: string; // Comma-separated string for form input
  language?: string;
  pages?: number;
  publisher?: string;
  publishDate?: string;
}

export function useAddBook() {
  // Core state management
  const mode = ref<AddBookMode>("selection");
  const showCamera = ref(false);
  const scannedISBN = ref("");
  const bookDetails = ref<BookDetails | null>(null);
  const isLoadingBookDetails = ref(false);
  const isSaving = ref(false);
  const selectedLibrary = ref<Library | null>(null);
  const bookNotFound = ref(false);

  // Form data for book details
  const formData = reactive<BookFormData>({
    title: "",
    authors: "",
    language: "",
    pages: undefined,
    publisher: "",
    publishDate: "",
  });

  // Get user's libraries
  const { libraries, isLoading: isLoadingLibraries } = useLibraryList();

  // Form validation
  const isFormValid = computed(() => {
    return (
      formData.title.trim().length > 0 && formData.authors.trim().length > 0
    );
  });

  // Computed thumbnail URL
  const thumbnailUrl = computed(() => {
    if (bookDetails.value?.thumbnail) {
      return window.URL.createObjectURL(bookDetails.value.thumbnail);
    }
    return "";
  });

  // Emit mode change events for Navbar integration
  const emitModeChange = (newMode: AddBookMode) => {
    window.dispatchEvent(
      new CustomEvent("addbook-mode-changed", {
        detail: { mode: newMode },
      }),
    );
  };

  // Reset all state
  const resetState = () => {
    mode.value = "selection";
    showCamera.value = false;
    scannedISBN.value = "";
    bookDetails.value = null;
    isLoadingBookDetails.value = false;
    isSaving.value = false;
    selectedLibrary.value = null;

    // Reset form data
    formData.title = "";
    formData.authors = "";
    formData.language = "";
    formData.pages = undefined;
    formData.publisher = "";
    formData.publishDate = "";
    bookNotFound.value = false;

    emitModeChange("selection");
    logger.debug("AddBook state reset");
  };

  // Start scanning mode
  const startScanning = () => {
    resetState();
    mode.value = "scan";
    showCamera.value = true;
    emitModeChange("scan");
    logger.debug("Started scanning mode");
  };

  // Start manual mode
  const startManual = () => {
    resetState();
    mode.value = "manual";
    emitModeChange("manual");
    logger.debug("Started manual mode");
  };

  // Go back to previous step or selection
  const goBack = () => {
    if (mode.value === "form" || mode.value === "manual") {
      // Go back to selection
      if (showCamera.value) {
        showCamera.value = false;
      }
      resetState();
      logger.debug("Went back to selection");
    } else if (mode.value === "scan") {
      // Go back to selection from scanning
      showCamera.value = false;
      resetState();
      logger.debug("Went back to selection from scanning");
    }
  };

  // Cancel current operation and go back to selection (keep for Camera component compatibility)
  const cancelOperation = goBack;

  // Handle successful ISBN scan
  const handleISBN = async (isbn: string) => {
    scannedISBN.value = isbn;
    showCamera.value = false;
    mode.value = "form";
    emitModeChange("form");

    logger.info("Scanned ISBN:", isbn);

    isLoadingBookDetails.value = true;

    try {
      bookDetails.value = await fetchBookDetails(isbn);
      logger.info("Book details fetched successfully:", bookDetails.value);

      // Populate form with fetched data
      if (bookDetails.value) {
        formData.title = bookDetails.value.title || "";
        formData.authors = bookDetails.value.authors || "";
        formData.language = bookDetails.value.language || "";
        formData.pages = bookDetails.value.pageCount || undefined;
        formData.publisher = bookDetails.value.publisher || "";
        formData.publishDate = bookDetails.value.publishedDate || "";
        bookNotFound.value = false;
      } else {
        bookNotFound.value = true;
      }
    } catch (error) {
      logger.error("Error fetching book details:", error);
      bookDetails.value = null;
      bookNotFound.value = true;
      // Keep form empty for manual input
    } finally {
      isLoadingBookDetails.value = false;
    }
  };

  // Proceed to library selection (modal)
  const proceedToLibrarySelection = () => {
    if (!isFormValid.value) {
      logger.warn("Cannot proceed: form is invalid");
      return;
    }

    // Note: Modal will be opened by parent component
    logger.debug("Ready for library selection");
  };

  // Select a library
  const selectLibrary = (library: Library) => {
    selectedLibrary.value = library;
    logger.debug("Library selected:", library.name);
  };

  // Convert form data to authors array
  const getAuthorsArray = (): string[] => {
    return formData.authors
      .split(",")
      .map((author) => author.trim())
      .filter((author) => author.length > 0);
  };

  // Save the book to the selected library
  const saveBook = async (): Promise<boolean> => {
    if (!selectedLibrary.value || !isFormValid.value) {
      logger.warn("Cannot save: no library selected or form invalid");
      return false;
    }

    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      logger.error("User not authenticated");
      return false;
    }

    isSaving.value = true;

    try {
      // Create library reference
      const libraryRef = doc(
        firestore,
        COLLECTION_NAMES.LIBRARIES,
        selectedLibrary.value.id,
      ) as DocumentReference<Library>;

      // Create the book object (only include fields with actual values)
      const now = new Date().toISOString();
      const newBook: Partial<Book> & {
        library: DocumentReference<Library>;
        createdAt: string;
        updatedAt: string;
        title: string;
        authors: string[];
        thumbnailUrl: string;
      } = {
        library: libraryRef,
        createdAt: now,
        updatedAt: now,
        title: formData.title.trim(),
        authors: getAuthorsArray(),
        thumbnailUrl: thumbnailUrl.value || "",
      };

      // Only add optional fields if they have values
      const language = formData.language?.trim();
      if (language) newBook.language = language;

      if (formData.pages && formData.pages > 0) newBook.pages = formData.pages;

      const publisher = formData.publisher?.trim();
      if (publisher) newBook.publisher = publisher;

      const publishDate = formData.publishDate?.trim();
      if (publishDate) newBook.publishDate = publishDate;

      // Save the book
      await createBook(newBook as Book);

      logger.info(
        "Book saved successfully to library:",
        selectedLibrary.value.name,
      );
      return true;
    } catch (error) {
      logger.error("Error saving book:", error);
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  // Complete the book addition process
  const completeAddition = async (): Promise<boolean> => {
    const success = await saveBook();
    if (success) {
      resetState();
    }
    return success;
  };

  // Set up event listener for Navbar back button
  const setupEventListeners = () => {
    window.addEventListener("addbook-go-back", goBack);
  };

  // Clean up event listener
  const cleanupEventListeners = () => {
    window.removeEventListener("addbook-go-back", goBack);
  };

  return {
    // State
    mode,
    showCamera,
    scannedISBN,
    bookDetails,
    isLoadingBookDetails,
    isSaving,
    selectedLibrary,
    bookNotFound,
    formData,
    libraries,
    isLoadingLibraries,

    // Computed
    isFormValid,
    thumbnailUrl,

    // Actions
    startScanning,
    startManual,
    goBack,
    cancelOperation,
    handleISBN,
    proceedToLibrarySelection,
    selectLibrary,
    saveBook,
    completeAddition,
    resetState,

    // Event management
    setupEventListeners,
    cleanupEventListeners,
  };
}
