<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, toRef } from "vue";
import { EVENTS, ANIMATION } from "@/constants/constants";
import LibraryOptionsMenu from "@/components/menus/LibraryOptions.vue";
import { useActiveLibrary } from "./composables/useActiveLibrary";
import { useDrawerSwipeGesture } from "./composables/useDrawerSwipeGesture";

// ============= PROPS & EMITS =============
const props = defineProps<{
  libraryId: string;
}>();
const libraryIdRef = toRef(props, "libraryId"); // Reactive ref for library ID passed to composables

const emit = defineEmits<{ close: []; progress: [progress: number] }>();

// ============= STATE =============
const showLibraryOptionsMenu = ref(false);
const drawerElementRef = ref<HTMLElement | null>(null); // Template ref for the main drawer div
const forceInitialPosition = ref(true); // Controls whether the drawer should be positioned offscreen initially

// ============= COMPOSABLES =============
// Manages fetching, updating, and deleting the active library's data
const {
  books,
  libraryName,
  isLoading,
  error,
  handleLibraryRename,
  handleLibraryDelete,
  fetchLibraryData,
} = useActiveLibrary(libraryIdRef);

// Manages the swipe-to-close gesture and drawer position/transition state
const domTargetRef = computed(() => drawerElementRef.value);
const { libraryDrawerPosition, drawerTransition, animateClose } =
  useDrawerSwipeGesture(domTargetRef, emit);

// ============= LIBRARY MANAGEMENT =============
// Coordinates library deletion with closing the drawer UI
async function handleDeleteAndClose() {
  const success = await handleLibraryDelete(); // Attempt deletion via composable
  if (success) {
    // If backend deletion succeeds, trigger the UI close sequence
    handleBackButton();
  }
}

// ============= UI EVENT HANDLERS =============
// Handles programmatic close requests (e.g., back button event)
function handleBackButton() {
  animateClose();
}

// Handles progress updates from the gesture handler
function handleProgress(progress: number) {
  emit("progress", progress);
}

// Toggles the visibility of the library options menu
function toggleLibraryOptionsMenu() {
  showLibraryOptionsMenu.value = !showLibraryOptionsMenu.value;
}

// ============= LIFECYCLE =============
onMounted(() => {
  // Force the drawer to start offscreen
  forceInitialPosition.value = true;

  // Use a reliable animation sequence with proper timing
  // First render frame - drawer is offscreen (position: 100%)
  setTimeout(() => {
    // Second frame - emit initial state but keep drawer offscreen
    handleProgress(0);

    // Third frame - animate to final position with transition
    setTimeout(() => {
      forceInitialPosition.value = false;
      // Apply smooth transition
      drawerTransition.value = `transform ${ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION}ms ease-out`;
      // Set position to fully open
      libraryDrawerPosition.value = 0;
      // Emit the final progress state
      handleProgress(1);
    }, 20);
  }, 10);

  // Listen for global events relevant to this component instance
  window.addEventListener(
    EVENTS.LIBRARY_DRAWER.BACK_TO_LIBRARIES,
    handleBackButton,
  );
  window.addEventListener(
    EVENTS.MENU.TOGGLE_LIBRARY_OPTIONS,
    toggleLibraryOptionsMenu,
  );
});

onUnmounted(() => {
  // Clean up all event listeners
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
    ref="drawerElementRef"
    class="fixed inset-y-0 right-0 w-full bg-light-bg dark:bg-dark-bg shadow-xl touch-pan-x z-40"
    :style="{
      transform: forceInitialPosition
        ? 'translateX(100%)'
        : `translateX(${libraryDrawerPosition}%)`, // Start offscreen if forceInitialPosition is true
      transition: drawerTransition, // Use the dynamic transition from the gesture composable
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

    <!-- Error State -->
    <div
      v-else-if="error"
      class="absolute inset-0 flex flex-col justify-center items-center p-4"
    >
      <p class="text-red-600 dark:text-red-400 text-center mb-4">{{ error }}</p>
      <button
        @click="() => fetchLibraryData(libraryIdRef)"
        class="px-4 py-2 bg-light-nav text-white rounded-lg"
      >
        Retry
      </button>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- List of Books -->
      <ul
        v-if="books.length > 0"
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
                >{{ book.title }}</span
              >
              <p
                class="text-light-secondary-text dark:text-dark-secondary-text text-sm"
              >
                {{ book.authors.join(", ") }}
              </p>
            </div>
            <div>
              <!-- Book actions placeholder -->
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
    </template>

    <!-- Library Options Menu -->
    <LibraryOptionsMenu
      :is-open="showLibraryOptionsMenu"
      :library-name="libraryName"
      @close="toggleLibraryOptionsMenu"
      @rename="handleLibraryRename"
      @delete="handleDeleteAndClose"
    />
  </div>
</template>

<style></style>
