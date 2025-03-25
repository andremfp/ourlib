<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getUserLibraries } from "@/apis/libraryAPI";
import LibraryDrawer from "./LibraryDrawer.vue";
import AddLibraryComponent from "@/components/modals/AddLibrary.vue";
import type { Library } from "@/apis/types";
import { UI_STATE, ANIMATION, EVENTS, SORT } from "@/constants/constants";

// ============= State =============
const auth = getAuth();
const libraries = ref<Library[]>([]);
const selectedLibrary = ref<Library | null>(null);
const isAddLibraryModalOpen = ref(false);
const isLoading = ref(true);
const isRefreshing = ref(false);
const error = ref<string | null>(null);
const libraryDrawerProgress = ref<number>(UI_STATE.LIBRARY_DRAWER.CLOSED);

// Sort settings
const sortBy = ref<string>(SORT.BY.NAME);
const sortReverse = ref<boolean>(SORT.DIRECTION.ASC);

// Pull-to-refresh state
const pullIndicatorHeight = ref(0);
const refreshTriggerHeight = 100; // Height in pixels to trigger refresh
const mainContainer = ref<HTMLElement | null>(null);
let touchStartY = 0;
let pullStarted = false;
let refreshInProgress = false;

// ============= Methods =============
const fetchLibraries = async (userId: string) => {
  try {
    if (isRefreshing.value) {
      // When refreshing via pull, keep the existing libraries visible
      isRefreshing.value = true;
    } else {
      // Initial load - show full loading screen
      isLoading.value = true;
    }
    error.value = null;
    libraries.value = await getUserLibraries(userId);

    // Sort libraries with current settings
    sortLibraries();
  } catch {
    error.value = "Failed to load libraries. Please try again.";
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
    pullIndicatorHeight.value = 0; // Reset pull indicator when refresh is done
    refreshInProgress = false;
  }
};

// Sort libraries based on current sort settings
const sortLibraries = () => {
  if (!libraries.value.length) return;

  libraries.value.sort((a, b) => {
    let result = 0;

    if (sortBy.value === SORT.BY.NAME) {
      result = a.name.localeCompare(b.name);
    } else {
      // Use createdAt timestamp or fallback to numeric comparison
      const aTimestamp = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTimestamp = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      result = aTimestamp - bTimestamp;
    }

    return sortReverse.value ? -result : result;
  });
};

// Handle sort changes from navbar
const handleSortChange = (event: Event) => {
  const { sortBy: newSortBy, sortReverse: newSortReverse } = (
    event as CustomEvent
  ).detail;
  sortBy.value = newSortBy;
  sortReverse.value = newSortReverse;
  sortLibraries();
};

const refreshLibraries = async () => {
  if (isRefreshing.value || refreshInProgress) return; // Prevent multiple refresh calls

  refreshInProgress = true;
  isRefreshing.value = true;
  const userId = auth.currentUser?.uid;
  if (userId) {
    await fetchLibraries(userId);
  } else {
    isRefreshing.value = false;
    pullIndicatorHeight.value = 0;
    refreshInProgress = false;
  }
};

const selectLibrary = (library: Library) => {
  selectedLibrary.value = library;
  libraryDrawerProgress.value = UI_STATE.LIBRARY_DRAWER.OPEN;
  window.dispatchEvent(
    new CustomEvent(EVENTS.LIBRARY.NAVBAR_NAME_UPDATE, {
      detail: library.name,
    }),
  );
  window.dispatchEvent(
    new CustomEvent(EVENTS.LIBRARY_DRAWER.PROGRESS, {
      detail: UI_STATE.LIBRARY_DRAWER.OPEN,
    }),
  );
};

const handleLibraryDrawerClose = () => {
  selectedLibrary.value = null;
  libraryDrawerProgress.value = UI_STATE.LIBRARY_DRAWER.CLOSED;
  window.dispatchEvent(
    new CustomEvent(EVENTS.LIBRARY.NAVBAR_NAME_UPDATE, {
      detail: "",
    }),
  );
};

const handleLibraryDrawerProgress = (progress: number) => {
  libraryDrawerProgress.value = progress;
  window.dispatchEvent(
    new CustomEvent(EVENTS.LIBRARY_DRAWER.PROGRESS, {
      detail: progress,
    }),
  );
};

const handleLibraryCreated = async () => {
  const userId = auth.currentUser?.uid;
  if (userId) await fetchLibraries(userId);
};

// Touch handlers for pull-to-refresh
const onTouchStart = (e: TouchEvent) => {
  if (selectedLibrary.value || isRefreshing.value || refreshInProgress) return;

  // Check if we're at the top of the scroll
  const container = mainContainer.value;
  if (!container || container.scrollTop > 0) return;

  // Record the starting touch position
  touchStartY = e.touches[0].clientY;
  pullStarted = true;
};

const onTouchMove = (e: TouchEvent) => {
  if (
    !pullStarted ||
    selectedLibrary.value ||
    isRefreshing.value ||
    refreshInProgress
  )
    return;

  const container = mainContainer.value;
  if (!container) return;

  // If we've scrolled down from the top, don't activate pull-to-refresh
  if (container.scrollTop > 5) {
    pullStarted = false;
    pullIndicatorHeight.value = 0;
    return;
  }

  const currentY = e.touches[0].clientY;
  const pullDistance = currentY - touchStartY;

  if (pullDistance > 0) {
    // Apply a resistance factor - pull indicator grows slower as it gets larger
    pullIndicatorHeight.value = Math.min(
      Math.pow(pullDistance, 0.9),
      refreshTriggerHeight * 1.5,
    );
  } else {
    // Reset when user pulls up
    pullIndicatorHeight.value = 0;
  }
};

const onTouchEnd = () => {
  if (!pullStarted || isRefreshing.value || refreshInProgress) return;

  // If pulled past threshold, trigger refresh
  if (pullIndicatorHeight.value > refreshTriggerHeight) {
    refreshLibraries();
  } else {
    // Reset otherwise
    pullIndicatorHeight.value = 0;
  }

  pullStarted = false;
};

// ============= Event Handlers =============
const setupEventListeners = () => {
  window.addEventListener(EVENTS.MODAL.OPEN_ADD_LIBRARY, () => {
    isAddLibraryModalOpen.value = true;
  });

  window.addEventListener(EVENTS.LIBRARY_DRAWER.BACK_TO_LIBRARIES, () => {
    libraryDrawerProgress.value = UI_STATE.LIBRARY_DRAWER.CLOSED;
    setTimeout(() => {
      selectedLibrary.value = null;
      libraryDrawerProgress.value = UI_STATE.LIBRARY_DRAWER.CLOSED;
    }, ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION);
  });

  window.addEventListener(EVENTS.LIBRARY.UPDATED, (event: Event) => {
    const { id, name } = (event as CustomEvent).detail;
    const library = libraries.value.find((lib) => lib.id === id);
    if (library) library.name = name;
    sortLibraries();
  });

  window.addEventListener(EVENTS.LIBRARY.DELETED, (event: Event) => {
    const id = (event as CustomEvent).detail;
    libraries.value = libraries.value.filter((lib) => lib.id !== id);
  });

  // Add listener for sort change events
  window.addEventListener(EVENTS.LIBRARY.SORT_CHANGED, handleSortChange);
};

// ============= Lifecycle =============
onMounted(() => {
  setupEventListeners();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchLibraries(user.uid);
    } else {
      libraries.value = [];
      isLoading.value = false;
      libraryDrawerProgress.value = UI_STATE.LIBRARY_DRAWER.CLOSED;
    }
  });
});

onUnmounted(() => {
  // Clean up sort change event listener
  window.removeEventListener(EVENTS.LIBRARY.SORT_CHANGED, handleSortChange);
});

const getParallaxStyle = (hasLibrary: boolean) => ({
  transform: hasLibrary
    ? `translateX(${-libraryDrawerProgress.value * ANIMATION.LIBRARY_DRAWER.PARALLAX_OFFSET}%)`
    : "none",
  transition:
    libraryDrawerProgress.value === UI_STATE.LIBRARY_DRAWER.CLOSED ||
    libraryDrawerProgress.value === UI_STATE.LIBRARY_DRAWER.OPEN
      ? `transform ${ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION}ms ease-out`
      : "none",
});
</script>

<template>
  <div
    :class="[
      'bg-light-bg dark:bg-dark-bg w-full h-full',
      libraries.length > 0 ? '' : 'overflow-hidden',
    ]"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
    ref="mainContainer"
  >
    <!-- Pull indicator shown when pulling -->
    <div
      class="flex items-center justify-center bg-light-bg dark:bg-dark-bg border-b border-light-border/20 dark:border-dark-border/20"
      :style="{
        height: `${pullIndicatorHeight}px`,
        transition: pullIndicatorHeight > 0 ? 'none' : 'height 0.3s ease-out',
        minHeight: pullIndicatorHeight > 0 ? '1px' : '0px',
      }"
    >
      <div v-if="pullIndicatorHeight > 0" class="flex items-center px-4 py-2">
        <svg
          class="h-6 w-6 mr-2 text-light-secondary-text dark:text-dark-secondary-text"
          :class="{ 'animate-spin': isRefreshing }"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span class="text-light-secondary-text dark:text-dark-secondary-text">
          {{
            isRefreshing
              ? "Refreshing..."
              : pullIndicatorHeight > refreshTriggerHeight
                ? "Release to refresh"
                : "Pull to refresh"
          }}
        </span>
      </div>
    </div>

    <!-- Initial loading state -->
    <div
      v-if="isLoading && libraries.length === 0"
      class="absolute inset-0 flex justify-center items-center"
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
        class="flex flex-col h-fit"
        :style="getParallaxStyle(!!selectedLibrary)"
      >
        <!-- Library list - auto places items at their natural height -->
        <ul class="divide-y divide-light-border/40 dark:divide-dark-border/40">
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

    <!-- Library Drawer -->
    <LibraryDrawer
      v-if="selectedLibrary"
      :libraryId="selectedLibrary.id"
      @close="handleLibraryDrawerClose"
      @progress="handleLibraryDrawerProgress"
    />

    <!-- Add Library Modal -->
    <AddLibraryComponent
      :isOpen="isAddLibraryModalOpen"
      @close="() => (isAddLibraryModalOpen = false)"
      @libraryCreated="handleLibraryCreated"
    />
  </div>
</template>
