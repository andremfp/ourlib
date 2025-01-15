<script setup lang="ts">
import CameraComponent from "@/components/Camera.vue";
import { ref, computed } from "vue";
import { fetchBookDetails } from "@/utils/fetchBook";
import type { BookDetails } from "@/utils/fetchBook";
import logger from "@/utils/logger";

const showCamera = ref(false);
const scannedISBN = ref("");
const bookDetails = ref<BookDetails | null>(null);
const isLoadingBookDetails = ref(false);

const toggleCamera = () => {
  showCamera.value = !showCamera.value;
  if (!showCamera.value) {
    resetScanning();
  }
  logger.debug(`Camera visibility toggled: ${showCamera.value}`);
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

const resetScanning = () => {
  scannedISBN.value = "";
  bookDetails.value = null;
  logger.debug("Scanning state reset");
};

const thumbnailUrl = computed(() => {
  if (bookDetails.value?.thumbnail) {
    return window.URL.createObjectURL(bookDetails.value.thumbnail);
  }
  return "";
});
</script>

<template>
  <div
    class="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 space-y-6"
  >
    <button
      @click="toggleCamera"
      class="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-md shadow hover:bg-green-600"
    >
      {{ showCamera ? "Cancel" : "Scan a Book" }}
    </button>

    <CameraComponent v-if="showCamera" @isbn-scanned="handleISBN" />

    <div v-if="scannedISBN" class="mt-4 space-y-4 text-center">
      <p class="text-lg font-semibold text-gray-700 dark:text-gray-200">
        Scanned ISBN: <span class="text-blue-500">{{ scannedISBN }}</span>
      </p>

      <div
        v-if="isLoadingBookDetails"
        class="flex justify-center items-center my-4"
      >
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"
        ></div>
      </div>

      <div
        v-if="bookDetails"
        class="p-4 bg-white rounded-md shadow-md dark:bg-gray-800"
      >
        <div v-if="bookDetails.thumbnail" class="mb-4">
          <img
            :src="thumbnailUrl"
            alt="Book Thumbnail"
            class="mx-auto rounded-lg shadow"
            style="max-width: 200px; height: auto"
          />
        </div>

        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">
          {{ bookDetails.title }}
        </h2>
        <p class="text-gray-600 dark:text-gray-300">
          Authors: {{ bookDetails.authors }}
        </p>
        <p class="text-gray-600 dark:text-gray-300">
          Language: {{ bookDetails.language }}
        </p>
        <p class="text-gray-600 dark:text-gray-300">
          Pages: {{ bookDetails.pageCount }}
        </p>
        <p class="text-gray-600 dark:text-gray-300">
          Publisher: {{ bookDetails.publisher }}
        </p>
        <p class="text-gray-600 dark:text-gray-300">
          Published Date: {{ bookDetails.publishedDate }}
        </p>
      </div>
      <div v-else-if="!isLoadingBookDetails">
        <p class="text-sm text-red-500">Unable to fetch book details.</p>
      </div>
    </div>
  </div>
</template>
