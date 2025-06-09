import { ref, computed } from "vue";
import { fetchBookDetails } from "@/apis/fetchBook";
import type { BookDetails } from "@/apis/fetchBook";
import logger from "@/utils/logger";

export function useAddBook() {
  const showCamera = ref(false);
  const scannedISBN = ref("");
  const bookDetails = ref<BookDetails | null>(null);
  const isLoadingBookDetails = ref(false);

  const resetScanning = () => {
    scannedISBN.value = "";
    bookDetails.value = null;
    logger.debug("Scanning state reset");
  };

  const handleISBN = async (isbn: string) => {
    scannedISBN.value = isbn;
    showCamera.value = false;

    logger.info("Scanned ISBN:", isbn);

    isLoadingBookDetails.value = true;

    try {
      bookDetails.value = await fetchBookDetails(isbn);
      logger.info("Book details fetched successfully:", bookDetails.value);
    } catch (error) {
      logger.error("Error fetching book details:", error);
      bookDetails.value = null;
    } finally {
      isLoadingBookDetails.value = false;
      logger.debug("Loading state reset");
    }
  };

  const thumbnailUrl = computed(() => {
    if (bookDetails.value?.thumbnail) {
      return window.URL.createObjectURL(bookDetails.value.thumbnail);
    }
    return "";
  });

  const toggleCamera = () => {
    showCamera.value = !showCamera.value;
    if (!showCamera.value) {
      resetScanning();
    }
    logger.debug(`Camera visibility toggled: ${showCamera.value}`);
  };

  return {
    showCamera,
    scannedISBN,
    bookDetails,
    isLoadingBookDetails,
    toggleCamera,
    resetScanning,
    handleISBN,
    thumbnailUrl,
  };
}
