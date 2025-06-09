<script setup lang="ts">
import CameraComponent from "@/components/Camera.vue";
import { useAddBook } from "./composables/useAddBook";

const {
  showCamera,
  scannedISBN,
  bookDetails,
  isLoadingBookDetails,
  toggleCamera,
  handleISBN,
  thumbnailUrl,
} = useAddBook();
</script>

<template>
  <div
    class="flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg space-y-6 p-4 min-h-screen"
  >
    <button
      @click="toggleCamera"
      class="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-md shadow hover:bg-green-600"
    >
      {{ showCamera ? "Cancel" : "Scan a Book" }}
    </button>

    <div v-if="showCamera" class="w-full flex justify-center">
      <CameraComponent @isbn-scanned="handleISBN" @cancel="toggleCamera" />
    </div>

    <div
      v-if="scannedISBN && !showCamera"
      class="mt-4 space-y-4 text-center w-full max-w-lg"
    >
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
