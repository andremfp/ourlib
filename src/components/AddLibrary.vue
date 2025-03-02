<script setup lang="ts">
import { ref, computed } from "vue";
import { getAuth } from "firebase/auth";
import { createLibrary } from "@/apis/libraryAPI";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["close", "libraryCreated"]);

const libraryName = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");

// Computed property to determine if the modal should be shown
const showModal = computed(() => props.isOpen);

const handleSubmit = async () => {
  if (!libraryName.value.trim()) {
    errorMessage.value = "Library name is required";
    return;
  }

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  if (!userId) {
    errorMessage.value = "You must be logged in to create a library";
    return;
  }

  try {
    isSubmitting.value = true;
    errorMessage.value = "";

    // Create the library
    const newLibrary = await createLibrary({
      name: libraryName.value.trim(),
      ownerId: userId,
      booksCount: 0,
    });

    // Reset form and emit success event
    libraryName.value = "";
    emit("libraryCreated", newLibrary);
    emit("close");
  } catch (error) {
    errorMessage.value = "Failed to create library. Please try again.";
    console.error("Error creating library:", error);
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  libraryName.value = "";
  errorMessage.value = "";
  emit("close");
};
</script>

<template>
  <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        @click="closeModal"
      ></div>

      <!-- Modal -->
      <div
        class="bg-white dark:bg-zinc-800 rounded-lg shadow-xl transform transition-all w-full max-w-md p-6 z-10"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Create New Library
          </h3>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="mb-4">
            <label
              for="libraryName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Library Name
            </label>
            <input
              id="libraryName"
              v-model="libraryName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:text-white"
              placeholder="Enter library name"
              required
            />
            <p
              v-if="errorMessage"
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {{ errorMessage }}
            </p>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-600 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isSubmitting">Creating...</span>
              <span v-else>Create Library</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
