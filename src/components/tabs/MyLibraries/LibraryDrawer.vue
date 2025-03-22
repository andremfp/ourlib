<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from "vue";
import { getLibraryBooks } from "@/apis/bookAPI";
import { getLibrary, updateLibrary, deleteLibrary } from "@/apis/libraryAPI";
import type { Book, Library } from "@/apis/types";
import { useGesture } from "@vueuse/gesture";
import { ANIMATION, EVENTS, UI_STATE } from "@/constants/constants";
import LibraryOptionsMenu from "@/components/menus/LibraryOptions.vue";
import logger from "@/utils/logger";

// ============= PROPS & EMITS =============
const props = defineProps<{
  libraryId: string;
}>();

const emit = defineEmits<{
  close: [];
  progress: [progress: number];
}>();

// ============= STATE =============
// Content state
const books = ref<Book[]>([]);
const library = ref<Library | null>(null);
const libraryName = ref("");
const isLoading = ref(true);

// UI state
const libraryDrawerPosition = ref<number>(
  ANIMATION.LIBRARY_DRAWER.OPEN_POSITION,
);
const isEdgeSwipeActive = ref(false);
const showLibraryOptionsMenu = ref(false);

// ============= DATA FETCHING =============
/**
 * Fetch books and library information
 */
async function fetchBooks() {
  try {
    isLoading.value = true;

    // Fetch library data and books in parallel
    [books.value, library.value] = await Promise.all([
      getLibraryBooks(props.libraryId),
      getLibrary(props.libraryId),
    ]);

    libraryName.value = library.value?.name || "Library";
  } catch (error) {
    logger.error("Failed to fetch library data:", error);
    // Could add error handling UI here
  } finally {
    isLoading.value = false;
  }
}

// ============= LIBRARY MANAGEMENT =============
/**
 * Handle renaming a library
 */
async function handleLibraryRename(newName: string) {
  if (!newName.trim() || !library.value) return;

  try {
    await updateLibrary(props.libraryId, newName);
    libraryName.value = newName;

    // Dispatch events to update UI
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY.NAVBAR_NAME_UPDATE, {
        detail: newName,
      }),
    );
    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY.UPDATED, {
        detail: { id: props.libraryId, name: newName },
      }),
    );
  } catch (error) {
    logger.error("Failed to rename library:", error);
    // Could add error handling UI here
  }
}

/**
 * Handle deleting a library
 */
async function handleLibraryDelete() {
  try {
    await deleteLibrary(props.libraryId);

    window.dispatchEvent(
      new CustomEvent(EVENTS.LIBRARY.DELETED, {
        detail: props.libraryId,
      }),
    );

    handleBackButton();
  } catch (error) {
    logger.error("Failed to delete library:", error);
    // Could add error handling UI here
  }
}

// ============= EVENT HANDLERS =============
/**
 * Handler for closing the drawer
 */
function handleBackButton() {
  logger.debug("Back button pressed, closing drawer");
  emit("progress", UI_STATE.LIBRARY_DRAWER.CLOSED);
  isEdgeSwipeActive.value = false;
  libraryDrawerPosition.value = ANIMATION.LIBRARY_DRAWER.OPEN_POSITION;
  setTimeout(() => emit("close"), ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION);
}

/**
 * Close the library options menu
 */
function closeLibraryOptionsMenu() {
  logger.debug("Closing Library Options Menu");
  showLibraryOptionsMenu.value = false;
}

/**
 * Toggle the library options menu
 */
function toggleLibraryOptionsMenu() {
  showLibraryOptionsMenu.value = !showLibraryOptionsMenu.value;
  logger.debug("Toggling Library Options Menu:", showLibraryOptionsMenu.value);
}

// ============= GESTURE SETUP =============
useGesture(
  {
    onDragStart: ({ event }) => {
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      const touchX =
        event instanceof TouchEvent
          ? event.touches[0].clientX - rect.left
          : (event as PointerEvent).clientX - rect.left;

      // Only activate edge swipe if touch is near the edge
      isEdgeSwipeActive.value =
        touchX < rect.width * ANIMATION.LIBRARY_DRAWER.EDGE_SWIPE_THRESHOLD;
    },

    onDrag: ({ movement: [mx], active }) => {
      if (!isEdgeSwipeActive.value || !active) return;

      // Calculate drawer position percentage based on swipe distance
      const percentage = (mx / window.innerWidth) * 100;
      libraryDrawerPosition.value = Math.min(
        ANIMATION.LIBRARY_DRAWER.OPEN_POSITION,
        Math.max(ANIMATION.LIBRARY_DRAWER.CLOSED_POSITION, percentage),
      );

      // Convert position percentage (0-100) to progress (0-1)
      const progress =
        1 -
        libraryDrawerPosition.value / ANIMATION.LIBRARY_DRAWER.OPEN_POSITION;
      emit("progress", progress);
    },

    onDragEnd: ({ movement: [mx] }) => {
      if (!isEdgeSwipeActive.value) return;

      isEdgeSwipeActive.value = false;
      const swipeProgress = mx / window.innerWidth;

      // If swipe has covered enough distance, close the drawer
      if (swipeProgress > ANIMATION.LIBRARY_DRAWER.CLOSE_THRESHOLD) {
        libraryDrawerPosition.value = ANIMATION.LIBRARY_DRAWER.OPEN_POSITION;
        emit("progress", UI_STATE.LIBRARY_DRAWER.CLOSED);
        setTimeout(
          () => emit("close"),
          ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION,
        );
      } else {
        // Otherwise, return to open state
        libraryDrawerPosition.value = ANIMATION.LIBRARY_DRAWER.CLOSED_POSITION;
        emit("progress", UI_STATE.LIBRARY_DRAWER.OPEN);
      }
    },
  },
  {
    domTarget: computed(() => document.getElementById("library-drawer")),
    drag: {
      filterTaps: true,
      axis: "x",
      bounds: { left: 0 },
    },
  },
);

// ============= LIFECYCLE =============
onMounted(() => {
  logger.debug("LibraryDrawer mounted");

  // Animate drawer opening
  libraryDrawerPosition.value = ANIMATION.LIBRARY_DRAWER.OPEN_POSITION;
  requestAnimationFrame(() => {
    libraryDrawerPosition.value = ANIMATION.LIBRARY_DRAWER.CLOSED_POSITION;
    emit("progress", UI_STATE.LIBRARY_DRAWER.OPEN);
  });

  // Set up event listeners
  window.addEventListener(
    EVENTS.LIBRARY_DRAWER.BACK_TO_LIBRARIES,
    handleBackButton,
  );
  window.addEventListener(
    EVENTS.MENU.TOGGLE_LIBRARY_OPTIONS,
    toggleLibraryOptionsMenu,
  );

  // Fetch data
  fetchBooks();
});

onUnmounted(() => {
  // Clean up event listeners
  window.removeEventListener(
    EVENTS.LIBRARY_DRAWER.BACK_TO_LIBRARIES,
    handleBackButton,
  );
  window.removeEventListener(
    EVENTS.MENU.TOGGLE_LIBRARY_OPTIONS,
    toggleLibraryOptionsMenu,
  );
});
</script>

<template>
  <div
    id="library-drawer"
    class="fixed inset-y-0 right-0 w-full bg-light-bg dark:bg-dark-bg shadow-xl touch-pan-x"
    :style="{
      transform: `translateX(${libraryDrawerPosition}%)`,
      transition: isEdgeSwipeActive
        ? 'none'
        : `transform ${ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION}ms ease-out`,
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
          <!-- Book details -->
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

          <!-- Book actions -->
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

    <!-- Library Options Menu -->
    <LibraryOptionsMenu
      :is-open="showLibraryOptionsMenu"
      :library-name="libraryName"
      @close="closeLibraryOptionsMenu"
      @rename="handleLibraryRename"
      @delete="handleLibraryDelete"
    />
  </div>
</template>

<style></style>
