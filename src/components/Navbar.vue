<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useTabStore } from "@/stores/tabStore";
import { useSearchStore } from "@/stores/searchStore";
import { useRoute } from "vue-router";

const route = useRoute();
const tabStore = useTabStore();
const searchStore = useSearchStore();
const activeTab = computed(() => tabStore.activeTab);
const currentLibraryName = ref("");

const searchQuery = ref("");

// Watch for changes in the search query and update the store
watch(searchQuery, (newQuery) => {
  searchStore.setSearchQuery(newQuery);
});

// Computed property to determine if the navbar should be hidden
const isNavbarHidden = computed(() => {
  return (
    route.name === "login" ||
    route.name === "register" ||
    route.name === "not-found"
  );
});

// Computed property for search placeholder text
const searchPlaceholder = computed(() => {
  if (activeTab.value === "My Libraries") {
    return "Search books in your libraries";
  }
  return "Search book";
});

// Function to open the Add Library modal
const openAddLibraryModal = () => {
  window.dispatchEvent(new Event("openAddLibraryModal"));
};

// Function to go back to libraries list
const goBackToLibraries = () => {
  window.dispatchEvent(new Event("backToLibraries"));
  currentLibraryName.value = "";
};

// Listen for library name updates
const updateLibraryName = (event: Event) => {
  const customEvent = event as CustomEvent;
  currentLibraryName.value = customEvent.detail;
};

onMounted(() => {
  window.addEventListener("libraryNameUpdate", updateLibraryName);
});

onUnmounted(() => {
  window.removeEventListener("libraryNameUpdate", updateLibraryName);
});
</script>

<template>
  <nav
    class="sticky top-0 z-50 bg-light-nav dark:bg-dark-nav"
    :class="{
      'h-0 opacity-0 overflow-hidden': isNavbarHidden,
      'h-auto opacity-100': !isNavbarHidden,
    }"
  >
    <div class="w-full pb-nav-padding"></div>
    <div class="w-full px-4 pb-2 pt-8 sm:pb-4 sm:pt-4">
      <!-- Standard view for most tabs -->
      <div
        v-if="
          activeTab !== 'Add Book' &&
          activeTab !== 'Profile' &&
          activeTab !== 'My Libraries'
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
      <div v-else-if="activeTab === 'My Libraries'" class="space-y-2">
        <div class="relative flex justify-center items-center h-8">
          <button
            v-if="!currentLibraryName"
            @click="openAddLibraryModal"
            class="absolute left-0 w-8 h-8 flex items-center justify-center text-light-nav-text dark:text-dark-nav-text rounded-full"
            aria-label="Add Library"
          >
            <svg
              class="w-5 h-5"
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
          <button
            v-else
            @click="goBackToLibraries"
            class="absolute left-0 w-8 h-8 flex items-center justify-center text-light-nav-text dark:text-dark-nav-text rounded-full"
            aria-label="Back to Libraries"
          >
            <svg
              class="w-5 h-5"
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
          <p class="text-nav text-light-nav-text dark:text-dark-nav-text">
            {{ currentLibraryName || activeTab }}
          </p>
        </div>
      </div>

      <!-- Simple title for Add Book and Profile tabs -->
      <div v-else class="relative">
        <p
          class="text-nav text-light-nav-text dark:text-dark-nav-text text-center"
        >
          {{ activeTab }}
        </p>
      </div>
    </div>
  </nav>
</template>
