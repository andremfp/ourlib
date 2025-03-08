<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getLibraryBooks } from "@/apis/bookAPI";
import { getLibrary } from "@/apis/libraryAPI";
import type { Book } from "@/apis/types";
import { useRouter } from "vue-router";

const router = useRouter();
const props = defineProps<{
  libraryId: string;
}>();

// const emit = defineEmits<{
//   (e: "close"): void;
// }>();

const books = ref<Book[]>([]);
const libraryName = ref("");

const handleDrag = (state: {
  delta: [number, number];
  distance: number;
  velocity: [number, number];
  first: boolean;
  last: boolean;
  event: TouchEvent | MouseEvent;
}) => {
  const [dx] = state.delta;
  const [vx] = state.velocity;
  const { first, last, event } = state;

  // Only trigger for edge swipes starting from the left edge
  if (first) {
    const clientX =
      event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
    if (clientX > 20) return; // Only trigger if starting within 20px of the left edge
  }

  if (last) {
    // Trigger back navigation if:
    // 1. Swipe was fast enough (velocity > 0.3)
    // 2. Or distance was far enough (> 50px)
    if (vx > 0.3 || dx > 50) {
      router.back();
    }
  }
};

// Fetch books in the selected library
onMounted(async () => {
  books.value = await getLibraryBooks(props.libraryId);
  const library = await getLibrary(props.libraryId);
  libraryName.value = library?.name || "Library";
});
</script>

<template>
  <div class="w-full touch-pan-y" v-use-gesture="handleDrag">
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
