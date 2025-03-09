<script setup lang="ts">
// ============= Imports =============
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useTabStore } from "@/stores/tabStore";
import { useSearchStore } from "@/stores/searchStore";
import { useRoute } from "vue-router";

// ============= Constants =============
const TRANSITION_DURATION = 300; // milliseconds

// ============= State =============
const route = useRoute();
const tabStore = useTabStore();
const searchStore = useSearchStore();
const activeTab = computed(() => tabStore.activeTab);
const currentLibraryName = ref("");
const searchQuery = ref("");
const drawerProgress = ref(1);

// ============= Computed Properties =============
// Determine if navbar should be hidden
const isNavbarHidden = computed(() => {
  return ["login", "register", "not-found"].includes(route.name as string);
});

// Search placeholder text based on active tab
const searchPlaceholder = computed(() => {
  if (activeTab.value === "My Libraries") {
    return "Search books in your libraries";
  }
  return "Search book";
});

// ============= Event Handlers =============
// Watch for changes in the search query and update the store
watch(searchQuery, (newQuery) => {
  searchStore.setSearchQuery(newQuery);
});

// Function to open the Add Library modal
const openAddLibraryModal = () => {
  window.dispatchEvent(new Event("openAddLibraryModal"));
};

// Function to go back to libraries list
const goBackToLibraries = () => {
  window.dispatchEvent(new Event("backToLibraries"));

  // Delay clearing the library name until animation completes
  setTimeout(() => {
    currentLibraryName.value = "";
  }, TRANSITION_DURATION);
};

// ============= Event Listeners =============
// Listen for library name updates
const updateLibraryName = (event: Event) => {
  const customEvent = event as CustomEvent;
  currentLibraryName.value = customEvent.detail;
};

// Handle drawer progress updates
const handleDrawerProgress = (event: Event) => {
  const progress = (event as CustomEvent).detail;
  drawerProgress.value = progress;
};

// ============= Lifecycle =============
onMounted(() => {
  window.addEventListener("libraryNameUpdate", updateLibraryName);
  window.addEventListener("drawerProgress", handleDrawerProgress);
});

onUnmounted(() => {
  window.removeEventListener("libraryNameUpdate", updateLibraryName);
  window.removeEventListener("drawerProgress", handleDrawerProgress);
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
        v-if="!['Add Book', 'Profile', 'My Libraries'].includes(activeTab)"
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
              opacity: currentLibraryName ? Math.max(0, 1 - drawerProgress) : 0,
              pointerEvents:
                currentLibraryName && drawerProgress < 0.5 ? 'auto' : 'none',
              transition:
                drawerProgress === 0 || drawerProgress === 1
                  ? `opacity ${TRANSITION_DURATION}ms ease-in-out`
                  : 'none',
              transform: `translateX(-8px)`,
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
              opacity: currentLibraryName ? Math.max(0, drawerProgress) : 1,
              pointerEvents:
                !currentLibraryName || drawerProgress >= 0.5 ? 'auto' : 'none',
              transition:
                drawerProgress === 0 || drawerProgress === 1
                  ? `opacity ${TRANSITION_DURATION}ms ease-in-out`
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

        <div
          class="absolute inset-x-0 h-full flex items-center justify-center overflow-hidden"
        >
          <p
            class="absolute text-nav text-light-nav-text dark:text-dark-nav-text text-center whitespace-nowrap"
            :style="{
              opacity: currentLibraryName
                ? Math.max(0, 1 - drawerProgress * 3 + 0.5)
                : 0,
              left: '50%',
              transform: `translateX(calc(-50% + ${drawerProgress * 250}%))`,
              transition:
                drawerProgress === 0 || drawerProgress === 1
                  ? `all ${TRANSITION_DURATION}ms ease-in-out`
                  : 'none',
            }"
          >
            {{ currentLibraryName }}
          </p>

          <p
            class="absolute text-nav text-light-nav-text dark:text-dark-nav-text text-center whitespace-nowrap"
            :style="{
              opacity: currentLibraryName
                ? Math.max(0, drawerProgress * 3 - 1.5)
                : 1,
              left: '50%',
              transform: `translateX(calc(-50% + ${(1 - drawerProgress) * -120}%))`,
              transition:
                drawerProgress === 0 || drawerProgress === 1
                  ? `all ${TRANSITION_DURATION}ms ease-in-out`
                  : 'none',
            }"
          >
            {{ activeTab }}
          </p>
        </div>
      </div>

      <!-- Simple title for Add Book and Profile tabs -->
      <div v-else class="text-center">
        <p class="text-nav text-light-nav-text dark:text-dark-nav-text">
          {{ activeTab }}
        </p>
      </div>
    </div>
  </nav>
</template>
