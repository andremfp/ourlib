<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getUserLibraries } from "@/apis/libraryAPI";
import BooksList from "@/components/BooksList.vue";
import AddLibraryComponent from "@/components/AddLibrary.vue";
import { useTabStore } from "@/stores/tabStore";
import type { Library } from "@/apis/types";

// ==================== Constants ====================
const TRANSITION_DURATION = 300; // milliseconds
const PARALLAX_OFFSET = 20; // percentage to shift libraries list

// ==================== State Management ====================
const auth = getAuth();
const tabStore = useTabStore();

// Component state
const libraries = ref<Library[]>([]);
const allLibraries = ref<Library[]>([]);
const selectedLibrary = ref<Library | null>(null);
const isAddLibraryModalOpen = ref(false);
const isLoading = ref(true);
const error = ref<string | null>(null);
const drawerProgress = ref(0);

// ==================== Data Fetching ====================
/**
 * Fetches user's libraries from the backend
 * Handles loading state and error conditions
 */
const fetchLibraries = async (userId: string) => {
  try {
    isLoading.value = true;
    error.value = null;
    const fetchedLibraries = await getUserLibraries(userId);
    allLibraries.value = fetchedLibraries;
    libraries.value = fetchedLibraries;
  } catch (err) {
    console.error("Error fetching libraries:", err);
    error.value = "Failed to load libraries. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

// ==================== Event Handlers ====================
/**
 * Library selection handler
 * Updates state and triggers animations
 */
const selectLibrary = (library: Library) => {
  selectedLibrary.value = library;
  drawerProgress.value = 0;
  // Emit library name
  window.dispatchEvent(
    new CustomEvent("libraryNameUpdate", { detail: library.name }),
  );
  // Emit initial drawer progress
  window.dispatchEvent(new CustomEvent("drawerProgress", { detail: 0 }));
};

/**
 * Drawer interaction handlers
 */
const handleDrawerClose = () => {
  selectedLibrary.value = null;
  drawerProgress.value = 0;
  window.dispatchEvent(new CustomEvent("libraryNameUpdate", { detail: "" }));
};

const handleDrawerProgress = (progress: number) => {
  drawerProgress.value = progress;
  // Emit to navbar - make sure progress is between 0 and 1
  window.dispatchEvent(
    new CustomEvent("drawerProgress", {
      detail: progress,
    }),
  );
};

// ==================== Modal Management ====================
const openAddLibraryModal = () => {
  isAddLibraryModalOpen.value = true;
};

const closeAddLibraryModal = () => {
  isAddLibraryModalOpen.value = false;
};

const handleLibraryCreated = async () => {
  const userId = auth.currentUser?.uid;
  if (userId) {
    await fetchLibraries(userId);
  }
};

/**
 * Sets up event listeners for inter-component communication
 * - Handles add library modal triggers
 * - Manages back navigation with animations
 */
const setupEventListeners = () => {
  // Add Library Modal trigger (from Navbar.vue)
  window.addEventListener("openAddLibraryModal", openAddLibraryModal);

  // Back navigation handler
  window.addEventListener("backToLibraries", () => {
    // Start transition animation
    drawerProgress.value = 1;

    // Reset state after animation completes
    setTimeout(() => {
      selectedLibrary.value = null;
      drawerProgress.value = 0;
    }, TRANSITION_DURATION);
  });
};

/**
 * Lifecycle hooks and initialization
 */
onMounted(() => {
  // Set active tab
  tabStore.setActiveTab("My Libraries");

  // Setup event listeners
  setupEventListeners();

  // Initialize auth state listener
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchLibraries(user.uid);
    } else {
      // Reset state when user is not authenticated
      libraries.value = [];
      allLibraries.value = [];
      isLoading.value = false;
    }
  });

  // Cleanup on unmount
  return () => unsubscribe();
});

// Common style for parallax animation
const getParallaxStyle = (hasLibrary: boolean) => ({
  transform: hasLibrary
    ? `translateX(${(1 - drawerProgress.value) * -PARALLAX_OFFSET}%)`
    : "none",
  transition: drawerProgress.value
    ? "none"
    : `transform ${TRANSITION_DURATION}ms ease-out`,
});
</script>

<template>
  <div class="bg-light-bg dark:bg-dark-bg w-full">
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="h-full flex justify-center items-center"
      :style="getParallaxStyle(!!selectedLibrary)"
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
      class="h-full flex flex-col items-center justify-center py-12 px-4"
      :style="getParallaxStyle(!!selectedLibrary)"
    >
      <p class="text-red-600 dark:text-red-400 text-center mb-4">
        {{ error }}
      </p>
      <button
        @click="() => auth.currentUser && fetchLibraries(auth.currentUser.uid)"
        class="px-4 py-2 bg-light-nav text-white rounded-lg"
      >
        Try Again
      </button>
    </div>

    <template v-else>
      <!-- Libraries List -->
      <div
        v-if="libraries.length > 0"
        class="h-full"
        :style="getParallaxStyle(!!selectedLibrary)"
      >
        <ul
          class="h-full overflow-auto divide-y divide-light-border/40 dark:divide-dark-border/40"
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
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="h-full flex flex-col items-center justify-center py-12 px-4"
        :style="getParallaxStyle(!!selectedLibrary)"
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
    </template>

    <!-- Books Drawer -->
    <BooksList
      v-if="selectedLibrary"
      :libraryId="selectedLibrary.id"
      @close="handleDrawerClose"
      @progress="handleDrawerProgress"
    />

    <!-- Add Library Modal -->
    <AddLibraryComponent
      :isOpen="isAddLibraryModalOpen"
      @close="closeAddLibraryModal"
      @libraryCreated="handleLibraryCreated"
    />
  </div>
</template>
