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
const showOptionsMenu = ref(false);
const showRenameModal = ref(false);
const showDeleteConfirmation = ref(false);
const newLibraryName = ref("");

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

// Options menu functions
const toggleOptionsMenu = () => {
  showOptionsMenu.value = !showOptionsMenu.value;
};

const openRenameModal = () => {
  newLibraryName.value = currentLibraryName.value;
  showRenameModal.value = true;
  showOptionsMenu.value = false;
};

const openDeleteConfirmation = () => {
  showDeleteConfirmation.value = true;
  showOptionsMenu.value = false;
};

const cancelOptionsMenu = () => {
  showOptionsMenu.value = false;
};

const handleRename = () => {
  // TODO: Implement API call to rename library
  if (newLibraryName.value.trim()) {
    window.dispatchEvent(
      new CustomEvent("renameLibrary", {
        detail: {
          oldName: currentLibraryName.value,
          newName: newLibraryName.value,
        },
      }),
    );
    currentLibraryName.value = newLibraryName.value;
  }
  showRenameModal.value = false;
};

const handleDelete = () => {
  // Dispatch event to delete library
  window.dispatchEvent(
    new CustomEvent("deleteLibrary", {
      detail: currentLibraryName.value,
    }),
  );
  showDeleteConfirmation.value = false;
  goBackToLibraries();
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

        <!-- 3-dot menu button (only visible when library is selected) -->
        <div class="absolute right-0 w-8 h-8 z-10">
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
            }"
            @click="toggleOptionsMenu"
          >
            <svg
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
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
        <p class="text-light-nav-text dark:text-dark-nav-text">
          {{ activeTab }}
        </p>
      </div>
    </div>
  </nav>

  <!-- Options Menu (iOS style) - Teleported to body -->
  <teleport to="body">
    <div
      v-if="showOptionsMenu"
      class="fixed inset-0 bg-black/40 z-[100] flex items-end justify-center p-4"
      @click.self="cancelOptionsMenu"
    >
      <div class="flex flex-col gap-2 w-full max-w-md">
        <!-- Options group -->
        <div
          class="bg-light-bg/80 dark:bg-dark-nav/80 backdrop-blur-md rounded-xl w-full overflow-hidden"
        >
          <div
            class="p-2 text-center text-light-secondary-text dark:text-dark-secondary-text text-sm"
          >
            {{ currentLibraryName }}
          </div>

          <div class="border-t border-dark-border/30">
            <button
              class="w-full py-4 text-center text-ios-blue"
              @click="openRenameModal"
            >
              Rename
            </button>
          </div>

          <div class="border-t border-dark-border/30">
            <button
              class="w-full py-4 text-center text-ios-red font-medium"
              @click="openDeleteConfirmation"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Cancel button (separate) -->
        <div
          class="bg-light-bg dark:bg-dark-nav rounded-xl w-full overflow-hidden"
        >
          <button
            class="w-full py-3 text-center font-medium text-ios-blue"
            @click="cancelOptionsMenu"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </teleport>

  <!-- Rename Modal -->
  <teleport to="body">
    <div
      v-if="showRenameModal"
      class="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4"
      @click.self="showRenameModal = false"
    >
      <div
        class="w-full max-w-md bg-white/80 dark:bg-dark-nav/80 backdrop-blur-md rounded-xl p-4"
      >
        <h3
          class="text-xl font-semibold text-light-primary-text dark:text-dark-primary-text mb-4"
        >
          Rename Library
        </h3>
        <input
          v-model="newLibraryName"
          type="text"
          class="w-full p-2 mb-4 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg text-light-primary-text dark:text-dark-primary-text"
          placeholder="Library name"
        />
        <div class="flex justify-end space-x-2">
          <button
            class="px-4 py-2 text-ios-blue bg-transparent rounded-lg"
            @click="showRenameModal = false"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-white bg-ios-blue rounded-lg font-medium"
            @click="handleRename"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </teleport>

  <!-- Delete Confirmation Modal -->
  <teleport to="body">
    <div
      v-if="showDeleteConfirmation"
      class="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4"
      @click.self="showDeleteConfirmation = false"
    >
      <div
        class="w-full max-w-md bg-white/80 dark:bg-dark-nav/80 backdrop-blur-md rounded-xl p-4"
      >
        <h3
          class="text-xl font-semibold text-light-primary-text dark:text-dark-primary-text mb-2"
        >
          Delete Library
        </h3>
        <p class="text-light-secondary-text dark:text-dark-secondary-text mb-4">
          Are you sure you want to delete "{{ currentLibraryName }}"? This
          action cannot be undone.
        </p>
        <div class="flex justify-end space-x-2">
          <button
            class="px-4 py-2 text-ios-blue bg-transparent rounded-lg"
            @click="showDeleteConfirmation = false"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-white bg-ios-red rounded-lg font-medium"
            @click="handleDelete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
