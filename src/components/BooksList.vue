<script setup lang="ts">
// ============= Imports =============
import { ref, onMounted, computed, onUnmounted } from "vue";
import { getLibraryBooks } from "@/apis/bookAPI";
import { getLibrary } from "@/apis/libraryAPI";
import type { Book } from "@/apis/types";
import { useGesture } from "@vueuse/gesture";

// ============= Constants =============
const EDGE_SWIPE_THRESHOLD = 0.1;
const CLOSE_THRESHOLD = 0.3;
const TRANSITION_DURATION = 300;
const INITIAL_POSITION = 100;

// ============= Props & Emits =============
const props = defineProps<{
  libraryId: string;
}>();

const emit = defineEmits(["close", "progress"]);

// ============= State =============
const books = ref<Book[]>([]);
const libraryName = ref("");
const isLoading = ref(true);
const drawerPosition = ref(INITIAL_POSITION);
const isEdgeSwipeActive = ref(false);

// ============= Event Handlers =============
const handleBackButton = () => {
  emit("progress", 1);
  isEdgeSwipeActive.value = false;
  drawerPosition.value = INITIAL_POSITION;
  setTimeout(() => emit("close"), TRANSITION_DURATION);
};

// ============= Gesture Setup =============
useGesture(
  {
    onDragStart: ({ event }) => {
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      const touchX =
        event instanceof TouchEvent
          ? event.touches[0].clientX - rect.left
          : (event as PointerEvent).clientX - rect.left;
      isEdgeSwipeActive.value = touchX < rect.width * EDGE_SWIPE_THRESHOLD;
    },
    onDrag: ({ movement: [mx], active }) => {
      if (!isEdgeSwipeActive.value || !active) return;

      const percentage = (mx / window.innerWidth) * 100;
      drawerPosition.value = Math.max(0, percentage);
      emit("progress", Math.min(1, Math.max(0, mx / window.innerWidth)));
    },
    onDragEnd: ({ movement: [mx] }) => {
      if (!isEdgeSwipeActive.value) return;

      isEdgeSwipeActive.value = false;
      const swipeProgress = mx / window.innerWidth;

      if (swipeProgress > CLOSE_THRESHOLD) {
        drawerPosition.value = INITIAL_POSITION;
        emit("progress", 1);
        setTimeout(() => emit("close"), TRANSITION_DURATION);
      } else {
        drawerPosition.value = 0;
        emit("progress", 0);
      }
    },
  },
  {
    domTarget: computed(() => document.getElementById("books-drawer")),
    drag: {
      filterTaps: true,
      axis: "x",
      bounds: { left: 0 },
    },
  },
);

// ============= Lifecycle =============
onMounted(() => {
  requestAnimationFrame(() => {
    drawerPosition.value = 0;
  });

  window.addEventListener("backToLibraries", handleBackButton);

  fetchBooks();
});

onUnmounted(() => {
  window.removeEventListener("backToLibraries", handleBackButton);
});

// ============= API Calls =============
const fetchBooks = async () => {
  try {
    isLoading.value = true;
    books.value = await getLibraryBooks(props.libraryId);
    const library = await getLibrary(props.libraryId);
    libraryName.value = library?.name || "Library";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    id="books-drawer"
    class="fixed inset-y-0 right-0 w-full bg-light-bg dark:bg-dark-bg shadow-xl touch-pan-x"
    :style="{
      transform: `translateX(${drawerPosition}%)`,
      transition: isEdgeSwipeActive
        ? 'none'
        : `transform ${TRANSITION_DURATION}ms ease-out`,
    }"
  >
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex justify-center items-center"
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
      class="h-full pt-16 overflow-auto divide-y divide-light-border/40 dark:divide-dark-border/40"
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
    <div v-else class="flex flex-col items-center justify-center h-full">
      <p
        class="text-light-secondary-text dark:text-dark-secondary-text text-center"
      >
        This library has no books yet.
      </p>
    </div>
  </div>
</template>
