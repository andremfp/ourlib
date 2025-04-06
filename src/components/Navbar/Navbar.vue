<script setup lang="ts">
/**
 * Main application navigation bar component.
 * Handles displaying the correct navigation context (standard tabs, libraries list, library detail)
 * and integrates search, sorting controls, and drawer interactions.
 */
import { computed, onMounted, onUnmounted, watch, ref } from "vue";
import { useTabStore } from "@/stores/tabStore";
import { useSearchStore } from "@/stores/searchStore";
import { useRoute } from "vue-router";
import { UI_STATE, SEARCH } from "@/constants/constants"; // Removed EVENTS
import type { RouteName, TabName } from "@/types/types";
import logger from "@/utils/logger"; // Import logger

// Child Components
import LibrariesNavbar from "./LibrariesNavbar.vue";
import SortControls from "./SortControls.vue";

// Composables for state management and logic
import { useSort } from "./composables/useSort";
import { useDrawerTransition } from "./composables/useDrawerTransition";
import { useLibrariesNavigation } from "./composables/useNavigation";
import { useLibrariesActions } from "./composables/useActions";

// --- Store Access ---
const route = useRoute();
const tabStore = useTabStore();
const searchStore = useSearchStore();

// --- Composables Initialization ---
const {
  // Sorting logic specific to Navbar display
  sortBy,
  sortReverse,
  savedSortBy,
  savedSortReverse,
  changeSortBy,
  toggleSortDirection,
  resetSort,
  enterLibraryView,
  exitLibraryView,
} = useSort();

const {
  // Drawer open/close progress tracking
  drawerProgress,
  setupEventListeners: setupDrawerListeners,
  cleanupEventListeners: cleanupDrawerListeners,
} = useDrawerTransition();

const {
  // Library name display and back navigation logic
  currentLibraryName,
  goBackToLibraries,
  setupEventListeners: setupNavigationListeners,
  cleanupEventListeners: cleanupNavigationListeners,
} = useLibrariesNavigation();

const {
  // Actions triggered from Navbar (e.g., modals, menus)
  openAddLibraryModal,
  toggleOptionsMenu,
} = useLibrariesActions();

// --- Local State ---
const searchQuery = ref("");
const activeTab = computed(() => tabStore.activeTab);

// --- Computed Properties ---
/** Determines if the Navbar should be hidden based on the current route. */
const isNavbarHidden = computed(() =>
  UI_STATE.NAVBAR.HIDDEN_ROUTES.includes(route.name as RouteName),
);

/** Provides the placeholder text for the search input. */
const searchPlaceholder = computed(() => SEARCH.PLACEHOLDERS.DEFAULT);

// --- Methods ---
/** Handles the 'go back' action from LibrariesNavbar, synchronizing drawer closing and sort state restoration. */
const handleGoBack = () => {
  logger.debug("[Navbar] Handling goBack action.");
  // goBackToLibraries handles clearing the name after animation
  // exitLibraryView restores the sort state
  goBackToLibraries(() => exitLibraryView());
};

// --- Watchers ---
/** Updates the global search store when the local search query changes. */
watch(searchQuery, (newQuery) => {
  logger.debug(`[Navbar] Search query changed: ${newQuery}`);
  searchStore.setSearchQuery(newQuery);
});

/** Resets sort state when navigating away from the 'My Libraries' tab. */
watch(activeTab, (newTab, oldTab) => {
  if (oldTab === "My Libraries" && newTab !== "My Libraries") {
    logger.debug("[Navbar] Navigated away from My Libraries, resetting sort.");
    resetSort();
  }
});

/** Saves the current sort state when entering a library view (drawer opens). */
watch(currentLibraryName, (newName, oldName) => {
  // We only care about the transition *into* a library view here.
  // The transition *out* (closing the drawer) is handled by handleGoBack.
  if (newName && !oldName) {
    logger.debug("[Navbar] currentLibraryName changed, entering library view.");
    enterLibraryView(newName);
  }
});

// --- Lifecycle Hooks ---
onMounted(() => {
  logger.debug("[Navbar] Component mounted, setting up listeners.");
  setupDrawerListeners();
  setupNavigationListeners();
});

onUnmounted(() => {
  logger.debug("[Navbar] Component unmounted, cleaning up listeners.");
  cleanupDrawerListeners();
  cleanupNavigationListeners();
});
</script>

<template>
  <nav
    class="sticky top-0 z-50 bg-light-nav dark:bg-dark-nav"
    :class="
      isNavbarHidden ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'
    "
    aria-label="Main Navigation"
  >
    <!-- Padding element to push content below the visual navbar -->
    <div class="w-full pb-nav-padding" aria-hidden="true"></div>

    <!-- Main content area of the navbar -->
    <div class="w-full px-4 pb-2 pt-8 sm:pb-4 sm:pt-4">
      <!-- Search Input (for tabs that use search) -->
      <div
        v-if="
          !UI_STATE.NAVBAR.STANDARD_TITLE_TABS.includes(activeTab as TabName)
        "
        class="relative"
        role="search"
      >
        <span
          class="absolute inset-y-0 left-0 flex items-center pl-2"
          aria-hidden="true"
        >
          <svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </span>
        <input
          v-model="searchQuery"
          type="search"
          class="w-full py-1 pl-8 bg-white dark:bg-zinc-700 dark:placeholder:text-zinc-400 rounded-xl text-gray-800 dark:text-gray-100 outline-none"
          :placeholder="searchPlaceholder"
          aria-label="Search content"
        />
      </div>

      <!-- My Libraries Specific Header -->
      <LibrariesNavbar
        v-else-if="activeTab === 'My Libraries'"
        :active-tab="activeTab"
        :current-library-name="currentLibraryName"
        :drawer-progress="drawerProgress"
        @go-back="handleGoBack"
        @add-library="openAddLibraryModal"
        @toggle-options="toggleOptionsMenu"
      />

      <!-- Simple Title Header (for tabs without search/special controls) -->
      <div v-else class="text-center">
        <p class="text-nav text-light-nav-text dark:text-dark-nav-text">
          {{ activeTab }}
        </p>
      </div>
    </div>

    <!-- Sort Controls (only for My Libraries tab) -->
    <SortControls
      v-if="activeTab === 'My Libraries'"
      :sort-by="sortBy"
      :sort-reverse="sortReverse"
      :saved-sort-by="savedSortBy"
      :saved-sort-reverse="savedSortReverse"
      :current-library-name="currentLibraryName"
      :drawer-progress="drawerProgress"
      @change-sort-by="changeSortBy"
      @toggle-sort-direction="toggleSortDirection"
    />
  </nav>
</template>
