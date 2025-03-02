<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
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

// Set the active tab when this component is mounted
const tabStore = useTabStore();
onMounted(() => {
  tabStore.setActiveTab("My Libraries");
});

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

// Register a custom event to listen for the openAddLibraryModal event from Navbar
const customEventBus = () => {
  window.addEventListener("openAddLibraryModal", () => {
    openAddLibraryModal();
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
  selectedLibrary.value = library;
};
</script>

<template>
  <div class="mx-auto p-6 bg-light-bg dark:bg-dark-bg">
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

    <!-- List of Libraries -->
    <ul v-else-if="libraries.length > 0" class="space-y-4">
      <li
        v-for="library in libraries"
        :key="library.id"
        class="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
        @click="selectLibrary(library)"
      >
        <div class="flex justify-between items-center">
          <span
            class="font-semibold text-light-primary-text dark:text-dark-primary-text"
          >
            {{ library.name }}
          </span>
          <span
            class="text-sm text-light-secondary-text dark:text-dark-secondary-text"
          >
            {{ library.booksCount || 0 }} books
          </span>
        </div>
      </li>
    </ul>

    <!-- No Libraries Message -->
    <div v-else class="flex flex-col items-center justify-center py-12 px-4">
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

    <!-- Books List Component -->
    <BooksList
      v-if="selectedLibrary"
      :libraryId="selectedLibrary.id"
      @close="selectedLibrary = null"
    />

    <!-- Add Library Modal -->
    <AddLibraryComponent
      :isOpen="isAddLibraryModalOpen"
      @close="closeAddLibraryModal"
      @libraryCreated="handleLibraryCreated"
    />
  </div>
</template>
