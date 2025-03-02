<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { getAuth } from "firebase/auth";
import { getUserLibraries } from "@/apis/libraryAPI";
import BooksList from "@/components/BooksList.vue";
import { useTabStore } from "@/stores/tabStore";
import type { Library } from "@/apis/types";

const auth = getAuth();
const libraries = ref<Library[]>([]);
const allLibraries = ref<Library[]>([]);
const selectedLibrary = ref<Library | null>(null);
const searchQuery = ref("");

// Set the active tab when this component is mounted
const tabStore = useTabStore();
onMounted(() => {
  tabStore.setActiveTab("My Libraries");
});

// Fetch libraries owned by the current user
onMounted(async () => {
  const userId = auth.currentUser?.uid;
  if (userId) {
    const fetchedLibraries = await getUserLibraries(userId);
    allLibraries.value = fetchedLibraries;
    libraries.value = fetchedLibraries;
  }
});

// Watch for changes in the search query from the Navbar component
// This would typically be passed as a prop or through a store
watch(
  () => searchQuery.value,
  (newQuery) => {
    if (newQuery.trim() === "") {
      // If search is empty, show all libraries
      libraries.value = allLibraries.value;
    } else {
      // Filter libraries based on search query
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
    <!-- Header -->
    <h2 class="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
      My Libraries
    </h2>

    <!-- List of Libraries -->
    <ul v-if="libraries.length > 0" class="space-y-4">
      <li
        v-for="library in libraries"
        :key="library.id"
        class="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
        @click="selectLibrary(library)"
      >
        <div class="flex justify-between items-center">
          <span class="font-semibold text-gray-800 dark:text-white">
            {{ library.name }}
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ library.booksCount || 0 }} books
          </span>
        </div>
      </li>
    </ul>

    <!-- No Libraries Message -->
    <p v-else class="text-gray-500 dark:text-gray-400">
      You don't have any libraries yet.
    </p>

    <!-- Books List Component -->
    <BooksList
      v-if="selectedLibrary"
      :libraryId="selectedLibrary.id"
      @close="selectedLibrary = null"
    />
  </div>
</template>
