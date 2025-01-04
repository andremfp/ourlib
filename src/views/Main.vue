<script setup lang="ts">
import { useRouter } from "vue-router";
import { getAuth, signOut } from "firebase/auth";
import CameraComponent from "@/components/Camera.vue";
import { ref, computed } from "vue";
import { fetchBookDetails } from "@/utils/fetchBook";
import type { BookDetails } from "@/utils/fetchBook";
import logger from "@/utils/logger";

const auth = getAuth();
const router = useRouter();

const showCamera = ref(false);
const scannedISBN = ref("");
const bookDetails = ref<BookDetails | null>(null);
const isLoadingBookDetails = ref(false);

const logout = async () => {
  try {
    await signOut(auth);
    logger.info("User logged out");
    router.push("/");
  } catch (error: any) {
    logger.error("Logout error:", error.message);
  }
};

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
      @click="logout"
      class="flex items-center px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-blue-600 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-80"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-5 h-5 mx-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M17 16L21 12M21 12L17 8M21 12L7 12M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8"
        />
      </svg>
      <span class="mx-1">Logout</span>
    </button>

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
