<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getUserLibraries } from "@/apis/libraryAPI";
import BooksList from "@/components/BooksList.vue";
import AddLibraryComponent from "@/components/AddLibrary.vue";
import { useTabStore } from "@/stores/tabStore";
import { useSearchStore } from "@/stores/searchStore";
import type { Library } from "@/apis/types";

const auth = getAuth();
const libraries = ref<Library[]>([]);
const allLibraries = ref<Library[]>([]);
const selectedLibrary = ref<Library | null>(null);
const searchStore = useSearchStore();
const isAddLibraryModalOpen = ref(false);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isInitialLoad = ref(true);
const swipeX = ref(0);
const isDragging = ref(false);

// Set the active tab when this component is mounted
const tabStore = useTabStore();
onMounted(() => {
  tabStore.setActiveTab("My Libraries");
});

const librariesList = ref(null);
const booksListView = ref(null);

// Computed property for transform style
const booksTransform = computed(() => {
  if (!isDragging.value) return "";
  return `translateX(${swipeX.value}px)`;
});

// Handle back gesture
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
  const touchX =
    state.event instanceof TouchEvent
      ? state.event.touches[0].clientX
      : (state.event as MouseEvent).clientX;

  // Only handle edge swipes (within 20px of edge)
  if (state.first && touchX > 20) return;

  if (state.first) {
    isDragging.value = true;
  }

  if (isDragging.value) {
    // Limit the drag to leftward movement only
    swipeX.value = Math.max(0, dx);

    // If swipe is fast enough or distance is far enough, trigger back
    if (state.last) {
      isDragging.value = false;
      if (vx > 0.3 || state.distance > 50) {
        selectedLibrary.value = null;
      } else {
        // Reset position if not triggering back
        swipeX.value = 0;
      }
    }
  }
};

// Function to fetch libraries
const fetchLibraries = async (userId: string) => {
  try {
    isLoading.value = true;
    error.value = null;
    const fetchedLibraries = await getUserLibraries(userId);
    allLibraries.value = fetchedLibraries;
    libraries.value = fetchedLibraries;
    console.log("Libraries fetched:", libraries.value);
  } catch (err) {
    console.error("Error fetching libraries:", err);
    error.value = "Failed to load libraries. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

// Function to open the Add Library modal
const openAddLibraryModal = () => {
  isAddLibraryModalOpen.value = true;
};

// Function to close the Add Library modal
const closeAddLibraryModal = () => {
  isAddLibraryModalOpen.value = false;
};

// Handle library creation
const handleLibraryCreated = async () => {
  const userId = auth.currentUser?.uid;
  if (userId) {
    await fetchLibraries(userId);
  }
};

// Register custom events
const customEventBus = () => {
  // Open Add Library Modal
  window.addEventListener("openAddLibraryModal", () => {
    openAddLibraryModal();
  });
  // Back to Libraries
  window.addEventListener("backToLibraries", () => {
    selectedLibrary.value = null;
  });
};

onMounted(() => {
  customEventBus();

  // Set up auth state listener
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchLibraries(user.uid);
    } else {
      libraries.value = [];
      allLibraries.value = [];
      isLoading.value = false;
    }
  });

  // Cleanup listener on component unmount
  return () => unsubscribe();
});

// Watch for changes in the search query from the search store
watch(
  () => searchStore.searchQuery,
  (newQuery) => {
    if (newQuery.trim() === "") {
      libraries.value = allLibraries.value;
    } else {
      libraries.value = allLibraries.value.filter((library) =>
        library.name.toLowerCase().includes(newQuery.toLowerCase()),
      );
    }
  },
);

// Select a library to view its books
const selectLibrary = (library: Library) => {
  isInitialLoad.value = false;
  selectedLibrary.value = library;
  // Dispatch event to update navbar with library name
  window.dispatchEvent(
    new CustomEvent("libraryNameUpdate", {
      detail: library.name,
    }),
  );
};
</script>

<template>
  <div class="py-4 bg-light-bg dark:bg-dark-bg w-full">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
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
      class="flex flex-col items-center justify-center py-12 px-4"
    >
      <p class="text-red-600 dark:text-red-400 text-center mb-4">
        {{ error }}
      </p>
      <button
        @click="() => auth.currentUser && fetchLibraries(auth.currentUser.uid)"
        class="px-4 py-2 bg-light-nav text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Content Container -->
    <div v-else class="divide-y relative overflow-hidden">
      <!-- List of Libraries -->
      <ul
        v-if="libraries.length > 0 && !selectedLibrary"
        class="divide-y divide-light-border/40 dark:divide-dark-border/40"
        ref="librariesList"
        v-motion
        :initial="
          isInitialLoad ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }
        "
        :enter="{ opacity: 1, x: 0, transition: { duration: 300 } }"
        :leave="{ opacity: 0, x: 100, transition: { duration: 300 } }"
      >
        <li
          v-for="library in libraries"
          :key="library.id"
          class="group bg-light-card dark:bg-dark-card"
          @click="selectLibrary(library)"
        >
          <div class="flex items-center p-4">
            <!-- Book Covers Placeholder -->
            <div class="relative w-24 h-24 mr-4">
              <!-- Placeholder Design -->
              <div class="absolute inset-0 flex items-center">
                <div class="flex -space-x-3">
                  <!-- Multiple book spine placeholders -->
                  <div
                    v-for="index in 3"
                    :key="index"
                    class="w-9 h-16 transform"
                    :class="[
                      index === 1 ? 'ml-2 bg-light-nav/70' : '',
                      index === 2 ? 'bg-light-nav/50 scale-90' : '',
                      index === 3 ? 'bg-light-nav/30 scale-75' : '',
                    ]"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Library Info -->
            <div class="flex-1 min-w-0">
              <h3
                class="text-xl font-semibold text-light-primary-text dark:text-dark-primary-text truncate"
              >
                {{ library.name }}
              </h3>
              <p
                class="text-light-secondary-text dark:text-dark-secondary-text mt-1"
              >
                {{ library.booksCount || 0 }}
                {{ library.booksCount === 1 ? "book" : "books" }}
              </p>
            </div>

            <!-- Right Arrow Icon -->
            <svg
              class="w-6 h-6 text-light-secondary-text dark:text-dark-secondary-text shrink-0 ml-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </li>
      </ul>

      <!-- Books List View -->
      <div
        v-else-if="selectedLibrary"
        class="w-full touch-pan-y"
        ref="booksListView"
        v-motion
        :initial="{ opacity: 0, x: 100 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 300 } }"
        :leave="{ opacity: 0, x: -100, transition: { duration: 300 } }"
        :style="{
          transform: booksTransform,
          transition: isDragging ? 'none' : 'transform 0.3s',
        }"
        v-use-gesture="handleDrag"
      >
        <BooksList
          :libraryId="selectedLibrary.id"
          @close="selectedLibrary = null"
        />
      </div>

      <!-- No Libraries Message -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-12 px-4"
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0 }"
      >
        <svg
          class="w-16 h-16 mb-4 text-light-secondary-text dark:text-dark-secondary-text"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p
          class="text-light-primary-text dark:text-dark-primary-text text-lg font-medium mb-2"
        >
          No libraries yet
        </p>
        <p
          class="text-light-secondary-text dark:text-dark-secondary-text text-sm text-center"
        >
          Click the + button above to create your first library
        </p>
      </div>
    </div>

    <!-- Add Library Modal -->
    <AddLibraryComponent
      :isOpen="isAddLibraryModalOpen"
      @close="closeAddLibraryModal"
      @libraryCreated="handleLibraryCreated"
    />
  </div>
</template>
