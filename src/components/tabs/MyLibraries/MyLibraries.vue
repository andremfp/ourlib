<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import LibraryDrawer from "./LibraryDrawer.vue";
import AddLibraryComponent from "@/components/modals/AddLibrary.vue";
import { ANIMATION, EVENTS } from "@/constants/constants";
import { useLibrarySort } from "./composables/useLibrarySort";
import { useLibraryList } from "./composables/useLibraryList";
import { useLibraryDrawer } from "./composables/useLibraryDrawer";
import PullToRefresh from "pulltorefreshjs";

// ============= State =============
// Component-specific UI state
const isAddLibraryModalOpen = ref(false);
const mainContainer = ref<HTMLElement | null>(null); // Ref for main container
const scrollContainer = ref<HTMLElement | null>(null); // Ref for scrollable container

// Pull-to-refresh instance
let pullToRefreshInstance: any = null;

// Debug state for mobile testing
const debugInfo = ref({
  scrollTop: 0,
  isAtTop: false,
  drawerClosed: true,
  notRefreshing: true,
  allowed: false,
  lastCheck: "",
  scrollHeight: 0,
  clientHeight: 0,
  mainScrollTop: 0,
  bodyScrollTop: 0,
  htmlScrollTop: 0,
  windowScrollY: 0,
  callCount: 0,
});

// ============= Composables =============
// Handles fetching libraries based on auth state
const { libraries, isLoading, isRefreshing, error, refreshLibraries } =
  useLibraryList();

// Handles drawer state and interactions
const {
  selectedLibrary,
  libraryDrawerProgress,
  isDrawerOpen,
  selectLibrary,
  closeDrawer,
  handleLibraryDrawerProgress,
} = useLibraryDrawer();

// Update debug info on scroll
const updateDebugInfo = () => {
  const container = scrollContainer.value;
  const mainElement = document.querySelector("main");
  const bodyElement = document.body;
  const htmlElement = document.documentElement;

  if (container) {
    const containerScrollTop = container.scrollTop;
    const mainScrollTop = mainElement?.scrollTop || 0;
    const bodyScrollTop = bodyElement.scrollTop;
    const htmlScrollTop = htmlElement.scrollTop;
    const windowScrollY = window.scrollY;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const isAtTop = containerScrollTop <= 1;

    debugInfo.value = {
      ...debugInfo.value,
      scrollTop: Math.round(containerScrollTop * 100) / 100,
      isAtTop,
      scrollHeight,
      clientHeight,
      lastCheck: new Date().toLocaleTimeString(),
      mainScrollTop: Math.round(mainScrollTop * 100) / 100,
      bodyScrollTop: Math.round(bodyScrollTop * 100) / 100,
      htmlScrollTop: Math.round(htmlScrollTop * 100) / 100,
      windowScrollY: Math.round(windowScrollY * 100) / 100,
      callCount: debugInfo.value.callCount + 1,
    };
  }
};

// Initialize pull-to-refresh
const initializePullToRefresh = () => {
  if (scrollContainer.value && !pullToRefreshInstance) {
    // Add scroll listeners to multiple elements to see which one actually scrolls
    scrollContainer.value.addEventListener("scroll", updateDebugInfo);
    document.querySelector("main")?.addEventListener("scroll", updateDebugInfo);
    document.body.addEventListener("scroll", updateDebugInfo);
    document.documentElement.addEventListener("scroll", updateDebugInfo);
    window.addEventListener("scroll", updateDebugInfo);
    pullToRefreshInstance = PullToRefresh.init({
      mainElement: scrollContainer.value,
      triggerElement: scrollContainer.value,
      onRefresh() {
        return refreshLibraries();
      },
      shouldPullToRefresh() {
        // Only allow pull-to-refresh when:
        // 1. Drawer is not open
        // 2. Not currently refreshing
        // 3. Scroll container is at the very top
        const container = scrollContainer.value;

        if (!container) {
          console.log("PTR Check: No container found");
          return false;
        }

        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const isAtTop = scrollTop <= 1; // Small tolerance for rounding
        const drawerClosed = !isDrawerOpen.value;
        const notRefreshing = !isRefreshing.value;

        const allowed = drawerClosed && notRefreshing && isAtTop;

        // Update debug info for mobile display
        debugInfo.value = {
          scrollTop: Math.round(scrollTop * 100) / 100, // Round for display
          isAtTop,
          drawerClosed,
          notRefreshing,
          allowed,
          lastCheck: new Date().toLocaleTimeString(),
          scrollHeight,
          clientHeight,
          mainScrollTop: 0, // This will be updated by scroll listener
          bodyScrollTop: 0,
          htmlScrollTop: 0,
          windowScrollY: 0,
          callCount: 0,
        };

        // Debug logging - only log when someone tries to pull
        console.log(
          `PTR Check: scrollTop=${scrollTop}, drawerClosed=${drawerClosed}, notRefreshing=${notRefreshing}, isAtTop=${isAtTop}, allowed=${allowed}`,
        );

        return allowed;
      },
      distThreshold: 60,
      distMax: 80,
      distReload: 50,
      instructionsPullToRefresh: "Pull down to refresh",
      instructionsReleaseToRefresh: "Release to refresh",
      instructionsRefreshing: "Refreshing...",
    });
  }
};

// Destroy pull-to-refresh instance
const destroyPullToRefresh = () => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener("scroll", updateDebugInfo);
    document
      .querySelector("main")
      ?.removeEventListener("scroll", updateDebugInfo);
    document.body.removeEventListener("scroll", updateDebugInfo);
    document.documentElement.removeEventListener("scroll", updateDebugInfo);
    window.removeEventListener("scroll", updateDebugInfo);
  }
  if (pullToRefreshInstance) {
    PullToRefresh.destroyAll();
    pullToRefreshInstance = null;
  }
};

// Handles sorting logic based on libraries and drawer state
const { handleSortChange, sortLibraries } = useLibrarySort(
  libraries,
  isDrawerOpen,
);

// ============= Methods =============
// Triggered by the AddLibrary modal upon successful creation
const handleLibraryCreated = async () => {
  await refreshLibraries(); // Refresh the list to include the new library
};

// ============= Event Handlers =============
// Listener for the global event to open the Add Library modal
const onOpenAddLibraryModal = () => {
  isAddLibraryModalOpen.value = true;
};

// Listener for the global event indicating a library's details were updated
const onLibraryUpdated = (event: Event) => {
  const { id, name } = (event as CustomEvent).detail;
  const index = libraries.value.findIndex((lib) => lib.id === id);
  if (index !== -1) {
    // Update the library data in the main list
    libraries.value[index] = { ...libraries.value[index], name };
    sortLibraries(); // Re-sort the list
    // If the updated library is currently selected in the drawer, update its name there too
    if (selectedLibrary.value && selectedLibrary.value.id === id) {
      selectedLibrary.value.name = name;
      // Notify navbar to update displayed title
      window.dispatchEvent(
        new CustomEvent(EVENTS.LIBRARY.NAVBAR_NAME_UPDATE, { detail: name }),
      );
    }
  }
};

// Listener for the global event indicating a library was deleted
const onLibraryDeleted = async (event: Event) => {
  const id = (event as CustomEvent).detail;
  // If the deleted library is the one open in the drawer, close the drawer
  if (selectedLibrary.value?.id === id) {
    closeDrawer();
  }
  // Remove the library from the main list
  libraries.value = libraries.value.filter((lib) => lib.id !== id);
  sortLibraries(); // Re-sort the list
};

// Sets up global event listeners managed by this component
const setupEventListeners = () => {
  window.addEventListener(EVENTS.MODAL.OPEN_ADD_LIBRARY, onOpenAddLibraryModal);
  window.addEventListener(EVENTS.LIBRARY.UPDATED, onLibraryUpdated);
  window.addEventListener(EVENTS.LIBRARY.DELETED, onLibraryDeleted);
  // Listen for sort changes triggered elsewhere (e.g., Navbar)
  window.addEventListener(EVENTS.LIBRARY.SORT_CHANGED, handleSortChange);
};

// ============= Lifecycle =============
onMounted(() => {
  setupEventListeners();
  // Initialize pull-to-refresh after the DOM is ready
  setTimeout(() => {
    initializePullToRefresh();
  }, 100);
});

onUnmounted(() => {
  // Clean up pull-to-refresh
  destroyPullToRefresh();

  // Clean up the global listeners when the component is destroyed
  window.removeEventListener(
    EVENTS.MODAL.OPEN_ADD_LIBRARY,
    onOpenAddLibraryModal,
  );
  window.removeEventListener(EVENTS.LIBRARY.UPDATED, onLibraryUpdated);
  window.removeEventListener(EVENTS.LIBRARY.DELETED, onLibraryDeleted);
  window.removeEventListener(EVENTS.LIBRARY.SORT_CHANGED, handleSortChange);
});

// Calculates the parallax effect style for the libraries list based on drawer progress
const getParallaxStyle = (hasLibrary: boolean) => {
  const progress = libraryDrawerProgress.value;

  // No parallax if no library is selected
  if (!hasLibrary) return { transform: "translateX(0%)", transition: "none" };

  const offsetValue = -progress * ANIMATION.LIBRARY_DRAWER.PARALLAX_OFFSET;

  // Synchronized transition with drawer animation
  return {
    transform: `translateX(${offsetValue}%)`,
    transition:
      progress === 0 || progress === 1
        ? `transform ${ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION}ms ease-out`
        : "none",
  };
};
</script>

<template>
  <div
    class="bg-light-bg dark:bg-dark-bg w-full h-full flex flex-col"
    ref="mainContainer"
  >
    <!-- Debug Panel for Mobile Testing -->
    <div
      class="fixed top-20 right-2 z-50 bg-red-500 text-white p-2 rounded text-xs max-w-xs"
    >
      <div><strong>PTR Debug</strong></div>
      <div>Calls: {{ debugInfo.callCount }}</div>
      <div>Container: {{ debugInfo.scrollTop }}</div>
      <div>Main: {{ debugInfo.mainScrollTop }}</div>
      <div>Body: {{ debugInfo.bodyScrollTop }}</div>
      <div>HTML: {{ debugInfo.htmlScrollTop }}</div>
      <div>Window: {{ debugInfo.windowScrollY }}</div>
      <div>At Top: {{ debugInfo.isAtTop }}</div>
      <div>Allowed: {{ debugInfo.allowed }}</div>
    </div>

    <!-- Scrollable Content Container - PullToRefresh library will handle the pull indicator -->
    <div class="flex-1 overflow-auto" ref="scrollContainer">
      <!-- Initial loading state -->
      <div
        v-if="isLoading && libraries.length === 0"
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
          @click="() => refreshLibraries()"
          :disabled="isLoading || isRefreshing"
          class="px-4 py-2 bg-light-nav text-white rounded-lg disabled:opacity-50"
        >
          Try Again
        </button>
      </div>

      <template v-else>
        <!-- Libraries List -->
        <div
          v-if="libraries.length > 0"
          class="flex flex-col"
          :style="getParallaxStyle(!!selectedLibrary)"
        >
          <ul
            class="divide-y divide-light-border/40 dark:divide-dark-border/40"
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
                  <div class="absolute inset-0 flex items-center">
                    <div class="flex -space-x-3">
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
    </div>

    <!-- Library Drawer -->
    <LibraryDrawer
      v-if="selectedLibrary"
      :libraryId="selectedLibrary.id"
      @close="closeDrawer"
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
