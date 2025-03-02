<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getLibraryBooks } from "@/apis/bookAPI";
import { getLibrary } from "@/apis/libraryAPI";
import type { Book } from "@/apis/types";
import { getAuth } from "firebase/auth";

const props = defineProps<{
  libraryId: string;
}>();

// const emit = defineEmits<{
//   (e: "close"): void;
// }>();

const books = ref<Book[]>([]);
const libraryName = ref("");

// Fetch books in the selected library
onMounted(async () => {
  books.value = await getLibraryBooks(props.libraryId);
  const library = await getLibrary(props.libraryId);
  libraryName.value = library?.name || "Library";
});
</script>

<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-light-bg dark:bg-dark-bg rounded-lg shadow-lg w-full max-w-md p-6"
    >
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-800 dark:text-white">
          Books in {{ libraryName }}
        </h3>
        <button
          @click="$emit('close')"
          class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Close
        </button>
      </div>

      <!-- List of Books -->
      <ul v-if="books.length > 0" class="space-y-4">
        <li
          v-for="book in books"
          :key="book.id"
          class="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
        >
          <div class="flex justify-between items-center">
            <div>
              <span class="font-semibold text-gray-800 dark:text-white">
                {{ book.title }}
              </span>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ book.authors.join(", ") }}
              </p>
            </div>
            <div>
              <button
                v-if="book.lentTo"
                class="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark as Returned
              </button>
              <button
                v-else
                class="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Lend
              </button>
            </div>
          </div>
        </li>
      </ul>

      <!-- No Books Message -->
      <p v-else class="text-gray-500 dark:text-gray-400">
        This library has no books yet.
      </p>
    </div>
  </div>
</template>
