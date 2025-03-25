<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useTabStore } from "@/stores/tabStore";
import { useSearchStore } from "@/stores/searchStore";
import { useRoute } from "vue-router";
import {
  ANIMATION,
  UI_STATE,
  EVENTS,
  SEARCH,
  SORT,
} from "@/constants/constants";
import type { RouteName, TabName } from "@/types/types";

// ============= State =============
const route = useRoute();
const tabStore = useTabStore();
const searchStore = useSearchStore();
const activeTab = computed(() => tabStore.activeTab);
const currentLibraryName = ref("");
const searchQuery = ref("");
const drawerProgress = ref(UI_STATE.LIBRARY_DRAWER.CLOSED);

// Sort state
const savedSortBy = ref<string>(SORT.BY.NAME);
const savedSortReverse = ref<boolean>(SORT.DIRECTION.ASC);
const sortBy = ref<string>(SORT.BY.NAME);
const sortReverse = ref<boolean>(SORT.DIRECTION.ASC);

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
    // Reset sort settings when leaving the tab
    sortBy.value = SORT.BY.NAME;
    sortReverse.value = SORT.DIRECTION.ASC;
    savedSortBy.value = SORT.BY.NAME;
    savedSortReverse.value = SORT.DIRECTION.ASC;
  }
});

// Function to open the Add Library modal
const openAddLibraryModal = () => {
  window.dispatchEvent(new Event(EVENTS.MODAL.OPEN_ADD_LIBRARY));
};

// Function to go back to libraries list
const goBackToLibraries = () => {
  window.dispatchEvent(new Event(EVENTS.LIBRARY_DRAWER.BACK_TO_LIBRARIES));

  // Delay clearing the library name until animation completes
  setTimeout(() => {
    currentLibraryName.value = "";
    sortBy.value = savedSortBy.value;
    sortReverse.value = savedSortReverse.value;
  }, ANIMATION.NAVBAR.TRANSITION_DURATION);
};

// Function to toggle the options menu
const toggleOptionsMenu = () => {
  window.dispatchEvent(new Event(EVENTS.MENU.TOGGLE_LIBRARY_OPTIONS));
};

// Function to change sort method
const changeSortBy = () => {
  // Toggle between name and date added
  if (sortBy.value === SORT.BY.NAME) {
    sortBy.value = SORT.BY.DATE;
    sortReverse.value = true; // Newest to oldest
  } else {
    sortBy.value = SORT.BY.NAME;
    sortReverse.value = false; // A to Z
  }

  // Also update saved values when in libraries view
  if (!currentLibraryName.value) {
    savedSortBy.value = sortBy.value;
    savedSortReverse.value = sortReverse.value;
  }

  dispatchSortEvent();
};

// Function to toggle sort direction
const toggleSortDirection = () => {
  sortReverse.value = !sortReverse.value;

  // Also update saved values when in libraries view
  if (!currentLibraryName.value) {
    savedSortReverse.value = sortReverse.value;
  }

  dispatchSortEvent();
};

// Dispatch sort event with current sort settings
const dispatchSortEvent = () => {
  window.dispatchEvent(
    new CustomEvent(EVENTS.LIBRARY.SORT_CHANGED, {
      detail: {
        sortBy: sortBy.value,
        sortReverse: sortReverse.value,
      },
    }),
  );
};

// ============= Event Listeners =============
// Listen for library name updates
const updateLibraryName = (event: Event) => {
  const customEvent = event as CustomEvent;
  currentLibraryName.value = customEvent.detail;
  savedSortBy.value = sortBy.value;
  savedSortReverse.value = sortReverse.value;
  sortBy.value = SORT.BY.NAME;
  sortReverse.value = false;
};

// Handle drawer progress updates
const handleDrawerProgress = (event: Event) => {
  const progress = (event as CustomEvent).detail;
  drawerProgress.value = progress;
};

// ============= Lifecycle =============
const setupEventListeners = () => {
  window.addEventListener(EVENTS.LIBRARY.NAVBAR_NAME_UPDATE, updateLibraryName);
  window.addEventListener(EVENTS.LIBRARY_DRAWER.PROGRESS, handleDrawerProgress);
};

onMounted(() => {
  setupEventListeners();
  // Dispatch initial sort settings
  dispatchSortEvent();
});

onUnmounted(() => {
  window.removeEventListener(
    EVENTS.LIBRARY.NAVBAR_NAME_UPDATE,
    updateLibraryName,
  );
  window.removeEventListener(
    EVENTS.LIBRARY_DRAWER.PROGRESS,
    handleDrawerProgress,
  );
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
      <div v-else-if="activeTab === 'My Libraries'" class="relative h-8">
        <div class="absolute left-0 w-8 h-8 z-10">
          <button
            class="absolute inset-0 flex items-center justify-center text-light-nav-text dark:text-dark-nav-text"
            :style="{
              opacity: currentLibraryName
                ? drawerProgress
                : UI_STATE.LIBRARY_DRAWER.CLOSED,
              pointerEvents:
                currentLibraryName &&
                drawerProgress >= UI_STATE.NAVBAR.INTERACTION_THRESHOLD
                  ? 'auto'
                  : 'none',
              transition:
                drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
                drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
                  ? `opacity ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
                  : 'none',
              transform: `translateX(${ANIMATION.NAVBAR.BACK_BUTTON_OFFSET}px)`,
            }"
            @click="goBackToLibraries"
          >
            <svg
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
                stroke="currentColor"
              />
            </svg>
          </button>

          <button
            class="absolute inset-0 flex items-center justify-center text-light-nav-text dark:text-dark-nav-text"
            :style="{
              opacity: currentLibraryName
                ? UI_STATE.LIBRARY_DRAWER.OPEN - drawerProgress
                : UI_STATE.LIBRARY_DRAWER.OPEN,
              pointerEvents:
                !currentLibraryName ||
                drawerProgress < UI_STATE.NAVBAR.INTERACTION_THRESHOLD
                  ? 'auto'
                  : 'none',
              transition:
                drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
                drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
                  ? `opacity ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
                  : 'none',
            }"
            @click="openAddLibraryModal"
          >
            <svg
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4V20M4 12H20"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <!-- Add in the navbar next to the back button -->
        <div class="absolute right-0 w-8 h-8 z-10">
          <button
            class="absolute inset-0 flex items-center justify-center text-light-nav-text dark:text-dark-nav-text"
            :style="{
              opacity: currentLibraryName
                ? drawerProgress
                : UI_STATE.LIBRARY_DRAWER.CLOSED,
              pointerEvents:
                currentLibraryName &&
                drawerProgress >= UI_STATE.NAVBAR.INTERACTION_THRESHOLD
                  ? 'auto'
                  : 'none',
              transition:
                drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
                drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
                  ? `opacity ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
                  : 'none',
            }"
            @click="toggleOptionsMenu"
          >
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
                fill="currentColor"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z"
                fill="currentColor"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z"
                fill="currentColor"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <div
          class="absolute inset-x-0 h-full flex items-center justify-center overflow-hidden"
        >
          <p
            class="absolute text-nav text-light-nav-text dark:text-dark-nav-text text-center whitespace-nowrap"
            :style="{
              opacity: currentLibraryName
                ? Math.max(
                    UI_STATE.LIBRARY_DRAWER.CLOSED,
                    drawerProgress * ANIMATION.NAVBAR.TITLE_SLIDE_MULTIPLIER -
                      ANIMATION.NAVBAR.TITLE_SLIDE_OFFSET,
                  )
                : UI_STATE.LIBRARY_DRAWER.CLOSED,
              left: '50%',
              transform: `translateX(calc(-50% + ${
                (UI_STATE.LIBRARY_DRAWER.OPEN - drawerProgress) *
                ANIMATION.NAVBAR.LIBRARY_NAME_SLIDE
              }%))`,
              transition:
                drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
                drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
                  ? `all ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
                  : 'none',
            }"
          >
            {{ currentLibraryName }}
          </p>

          <p
            class="absolute text-nav text-light-nav-text dark:text-dark-nav-text text-center whitespace-nowrap"
            :style="{
              opacity: currentLibraryName
                ? Math.max(
                    UI_STATE.LIBRARY_DRAWER.CLOSED,
                    UI_STATE.LIBRARY_DRAWER.OPEN -
                      drawerProgress * ANIMATION.NAVBAR.TITLE_SLIDE_MULTIPLIER +
                      ANIMATION.NAVBAR.TITLE_SLIDE_OFFSET,
                  )
                : UI_STATE.LIBRARY_DRAWER.OPEN,
              left: '50%',
              transform: `translateX(calc(-50% + ${
                drawerProgress * ANIMATION.NAVBAR.TAB_NAME_SLIDE
              }%))`,
              transition:
                drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
                drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
                  ? `all ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
                  : 'none',
            }"
          >
            {{ activeTab }}
          </p>
        </div>
      </div>

      <!-- Simple title for Add Book and Profile tabs -->
      <div v-else class="text-center">
        <p class="text-light-nav-text dark:text-dark-nav-text">
          {{ activeTab }}
        </p>
      </div>
    </div>

    <!-- Sort controls -->
    <div
      v-if="activeTab === 'My Libraries'"
      class="flex justify-between items-center px-4 py-2 text-nav-subtext text-light-nav-text dark:text-dark-nav-text border-t border-light-border/20 dark:border-dark-border/20"
      :style="{
        opacity: 1, // Always visible
        transition:
          drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
          drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
            ? `all ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
            : 'none',
      }"
    >
      <!-- Left side: Sort method -->
      <div class="flex items-center relative">
        <span class="font-light mr-1">SORTED BY:</span>
        <div class="relative font-bold">
          <!-- Libraries view sort value -->
          <span
            :style="{
              opacity: currentLibraryName
                ? UI_STATE.LIBRARY_DRAWER.OPEN - drawerProgress
                : 1,
              position: 'absolute',
              transition: `opacity ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`,
            }"
          >
            {{ savedSortBy }}
          </span>

          <!-- Drawer view sort value -->
          <span
            :style="{
              opacity: currentLibraryName ? drawerProgress : 0,
              transition: `opacity ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`,
            }"
          >
            {{ sortBy }}
          </span>

          <!-- Invisible spacer to maintain width -->
          <span class="invisible">{{ savedSortBy }}</span>
        </div>
        <!-- Make button cover both spans but not extend beyond its parent -->
        <button
          @click="changeSortBy"
          class="absolute inset-0 w-full h-full"
        ></button>
      </div>

      <!-- Right side: Sort direction control -->
      <div class="flex items-center">
        <div class="relative mr-1 w-4 h-4">
          <!-- Libraries view arrow -->
          <svg
            class="w-4 h-4 absolute"
            :class="{ 'transform rotate-180': savedSortReverse }"
            :style="{
              opacity: currentLibraryName
                ? UI_STATE.LIBRARY_DRAWER.OPEN - drawerProgress
                : 1,
              transition: `opacity ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`,
            }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M12 5v14M12 19l7-7M12 19l-7-7"
            />
          </svg>

          <!-- Drawer view arrow -->
          <svg
            class="w-4 h-4 absolute"
            :class="{ 'transform rotate-180': sortReverse }"
            :style="{
              opacity: currentLibraryName ? drawerProgress : 0,
              transition: `opacity ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`,
            }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M12 5v14M12 19l7-7M12 19l-7-7"
            />
          </svg>
        </div>
        <button @click="toggleSortDirection" class="font-bold">REVERSE</button>
      </div>
    </div>
  </nav>
</template>
