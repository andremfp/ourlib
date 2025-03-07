<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getLibraryBooks } from "@/apis/bookAPI";
import { getLibrary } from "@/apis/libraryAPI";
import type { Book } from "@/apis/types";

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
  <div class="w-full">
    <!-- List of Books -->
    <ul
      v-if="books.length > 0"
      class="divide-y divide-light-border/40 dark:divide-dark-border/40"
    >
      <li
        v-for="book in books"
        :key="book.id"
        class="p-4 hover:bg-light-card-hover dark:hover:bg-dark-card-hover transition-colors"
      >
        <div class="flex justify-between items-center">
          <div>
            <span
              class="font-semibold text-light-primary-text dark:text-dark-primary-text"
            >
              {{ book.title }}
            </span>
            <p
              class="text-light-secondary-text dark:text-dark-secondary-text text-sm"
            >
              {{ book.authors.join(", ") }}
            </p>
          </div>
          <div>
            <button
              v-if="book.lentTo"
              class="text-sm text-light-nav hover:text-blue-600 dark:text-light-nav dark:hover:text-blue-400 transition-colors"
            >
              Mark as Returned
            </button>
            <button
              v-else
              class="text-sm text-light-nav hover:text-blue-600 dark:text-light-nav dark:hover:text-blue-400 transition-colors"
            >
              Lend
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- No Books Message -->
    <div v-else class="flex flex-col items-center justify-center py-12 px-4">
      <p
        class="text-light-secondary-text dark:text-dark-secondary-text text-center"
      >
        This library has no books yet.
      </p>
    </div>
  </div>
</template>
