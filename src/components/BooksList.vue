<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { getLibraryBooks } from "@/apis/bookAPI";
import { getLibrary } from "@/apis/libraryAPI";
import type { Book } from "@/apis/types";
import { useGesture } from "@vueuse/gesture";

const props = defineProps<{
  libraryId: string;
}>();

const emit = defineEmits(["close", "swipeProgress"]);
const books = ref<Book[]>([]);
const libraryName = ref("");
const isLoading = ref(true);
const swipeX = ref(100); // Start off-screen

// Animate in on mount
onMounted(() => {
  requestAnimationFrame(() => {
    swipeX.value = 0;
  });
});

const style = computed(() => ({
  transform: `translateX(${swipeX.value}%)`,
  transition: swipeX.value ? "none" : "transform 0.3s ease-out",
}));

// Setup swipe gesture
useGesture(
  {
    onDrag: ({ delta: [dx], movement: [mx], first, last, active }) => {
      if (first && dx < 0) return; // Only allow swipe right

      if (active) {
        const progress = Math.min(Math.max(mx / window.innerWidth, 0), 1);
        swipeX.value = progress * 100;
        emit("swipeProgress", progress);
      }

      if (last) {
        if (swipeX.value > 30) {
          emit("close");
        } else {
          swipeX.value = 0;
          emit("swipeProgress", 0);
        }
      }
    },
  },
  {
    domTarget: computed(() => document.getElementById("books-list")),
    drag: {
      filterTaps: true,
      rubberband: true,
      bounds: { left: 0, right: window.innerWidth },
    },
  },
);

// Fetch books in the selected library
onMounted(async () => {
  try {
    isLoading.value = true;
    books.value = await getLibraryBooks(props.libraryId);
    const library = await getLibrary(props.libraryId);
    libraryName.value = library?.name || "Library";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div
    id="books-list"
    class="absolute inset-0 bg-light-bg dark:bg-dark-bg touch-pan-x"
    :style="style"
  >
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex justify-center items-center bg-light-bg dark:bg-dark-bg"
    >
      <svg
        class="animate-spin h-8 w-8 text-light-secondary-text dark:text-dark-secondary-text"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>

    <!-- List of Books -->
    <ul
      v-else-if="books.length > 0"
      class="h-full overflow-auto divide-y divide-light-border/40 dark:divide-dark-border/40"
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
