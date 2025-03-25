<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from "vue";
import { useTabStore } from "@/stores/tabStore";
import { useSearchStore } from "@/stores/searchStore";
import { useRoute } from "vue-router";
import { UI_STATE, SEARCH } from "@/constants/constants";
import type { RouteName, TabName } from "@/types/types";

// Import composables
import { useSort } from "./composables/useSort";
import { useDrawerTransition } from "./composables/useDrawerTransition";
import { useNavigation } from "./composables/useNavigation";

// Import components
import LibraryHeader from "./LibraryHeader.vue";
import SortControls from "./SortControls.vue";

// Set up composable state
const {
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
  drawerProgress,
  setupEventListeners: setupDrawerListeners,
  cleanupEventListeners: cleanupDrawerListeners,
} = useDrawerTransition();

const {
  currentLibraryName,
  openAddLibraryModal,
  goBackToLibraries,
  toggleOptionsMenu,
  setupEventListeners: setupNavigationListeners,
  cleanupEventListeners: cleanupNavigationListeners,
} = useNavigation();

// Set up regular Vue state
const route = useRoute();
const tabStore = useTabStore();
const searchStore = useSearchStore();
const activeTab = computed(() => tabStore.activeTab);
const searchQuery = ref("");

// ============= Computed Properties =============
// Determine if navbar should be hidden
const isNavbarHidden = computed(() => {
  return UI_STATE.NAVBAR.HIDDEN_ROUTES.includes(route.name as RouteName);
});

// Search placeholder text based on active tab
const searchPlaceholder = computed(() => {
  return SEARCH.PLACEHOLDERS.DEFAULT;
});

// ============= Event Handlers =============
// Watch for changes in the search query and update the store
watch(searchQuery, (newQuery) => {
  searchStore.setSearchQuery(newQuery);
});

// Reset sort settings when navigating away from My Libraries tab
watch(activeTab, (newTab, oldTab) => {
  if (oldTab === "My Libraries" && newTab !== "My Libraries") {
    resetSort();
  }
});

// Watch for library name changes to reset sort accordingly
watch(currentLibraryName, (newName, oldName) => {
  if (newName && !oldName) {
    // Library opened - save current sort and set new sort for the library view
    enterLibraryView(newName);
  } else if (!newName && oldName) {
    // Library closed - already handled in handleGoBack
  }
});

// Handle back button click and synchronize with sort logic
const handleGoBack = () => {
  goBackToLibraries(() => {
    exitLibraryView();
  });
};

// ============= Lifecycle =============
onMounted(() => {
  setupDrawerListeners();
  setupNavigationListeners();
});

onUnmounted(() => {
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
  >
    <div class="w-full pb-nav-padding"></div>
    <div class="w-full px-4 pb-2 pt-8 sm:pb-4 sm:pt-4">
      <!-- Standard view for most tabs -->
      <div
        v-if="
          !UI_STATE.NAVBAR.STANDARD_TITLE_TABS.includes(activeTab as TabName)
        "
        class="relative"
      >
        <span class="absolute inset-y-0 left-0 flex items-center pl-2">
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
          type="text"
          class="w-full py-1 pl-8 bg-white dark:bg-zinc-700 dark:placeholder:text-zinc-400 rounded-xl text-gray-800 dark:text-gray-100 outline-none"
          :placeholder="searchPlaceholder"
        />
      </div>

      <!-- My Libraries specific view -->
      <LibraryHeader
        v-else-if="activeTab === 'My Libraries'"
        :active-tab="activeTab"
        :current-library-name="currentLibraryName"
        :drawer-progress="drawerProgress"
        @go-back="handleGoBack"
        @add-library="openAddLibraryModal"
        @toggle-options="toggleOptionsMenu"
      />

      <!-- Simple title for Add Book and Profile tabs -->
      <div v-else class="text-center">
        <p class="text-light-nav-text dark:text-dark-nav-text">
          {{ activeTab }}
        </p>
      </div>
    </div>

    <!-- Sort controls -->
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
