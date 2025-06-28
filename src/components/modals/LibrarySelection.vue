<script setup lang="ts">
import { ref, watch } from "vue";
import type { Library } from "@/schema";

// ============= PROPS & EMITS =============
const props = defineProps<{
  isOpen: boolean;
  libraries: Library[];
  isLoadingLibraries: boolean;
  bookTitle: string;
}>();

const emit = defineEmits<{
  close: [];
  librarySelected: [library: Library];
}>();

// ============= STATE =============
const selectedLibrary = ref<Library | null>(null);

// Animation state
const localIsOpen = ref(props.isOpen);
const isModalLeaving = ref(false);

// ============= WATCHERS =============
// Sync with parent's isOpen prop
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      // Open the modal
      localIsOpen.value = true;
      isModalLeaving.value = false;
      selectedLibrary.value = null; // Reset selection
    } else {
      // Start closing process
      startClosingProcess();
    }
  },
);

// ============= ANIMATION HANDLING =============
/**
 * Start the closing process
 */
function startClosingProcess() {
  isModalLeaving.value = true;
}

/**
 * Complete the closing process after animations
 */
function onModalLeave() {
  localIsOpen.value = false;
  isModalLeaving.value = false;
}

// ============= LIBRARY SELECTION =============
/**
 * Select a library
 */
function selectLibrary(library: Library) {
  selectedLibrary.value = library;
}

/**
 * Confirm library selection
 */
function confirmSelection() {
  if (selectedLibrary.value) {
    emit("librarySelected", selectedLibrary.value);
    emit("close");
  }
}

/**
 * Close the modal
 */
function closeModal() {
  selectedLibrary.value = null;
  emit("close");
}
</script>

<template>
  <teleport to="body">
    <div
      v-if="localIsOpen"
      class="fixed inset-0 z-[50] flex items-center justify-center min-h-screen px-4"
    >
      <!-- Backdrop with fade transition -->
      <Transition name="fade" appear @after-leave="onModalLeave">
        <div v-if="!isModalLeaving" class="absolute inset-0 bg-black/20"></div>
      </Transition>

      <!-- Modal with animation -->
      <Transition name="modalAnim" appear>
        <div
          v-if="!isModalLeaving && props.isOpen"
          class="relative z-[51] w-full max-w-2xl bg-light-bg dark:bg-dark-nav rounded-xl p-6 max-h-[80vh] flex flex-col"
        >
          <!-- Modal header -->
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3
                class="text-modal-title font-semibold text-light-primary-text dark:text-dark-primary-text"
              >
                Choose Library
              </h3>
              <p
                class="text-sm text-light-secondary-text dark:text-dark-secondary-text mt-1"
              >
                Select which library to add "{{ bookTitle }}" to
              </p>
            </div>
            <button
              @click="closeModal"
              class="text-light-secondary-text dark:text-dark-secondary-text hover:text-light-primary-text dark:hover:text-dark-primary-text"
            >
              <svg
                class="w-6 h-6"
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

          <!-- Content area -->
          <div class="flex-1 overflow-auto">
            <!-- Loading Libraries -->
            <div
              v-if="isLoadingLibraries"
              class="flex justify-center items-center py-12"
            >
              <div
                class="animate-spin rounded-full h-12 w-12 border-4 border-menu-blue border-t-transparent"
              ></div>
              <span
                class="ml-3 text-light-secondary-text dark:text-dark-secondary-text"
              >
                Loading libraries...
              </span>
            </div>

            <!-- Libraries List -->
            <div v-else-if="libraries.length > 0" class="space-y-3">
              <button
                v-for="library in libraries"
                :key="library.id"
                @click="selectLibrary(library)"
                :class="[
                  'w-full p-4 text-left bg-light-card dark:bg-dark-card rounded-lg border-2 transition-all',
                  selectedLibrary?.id === library.id
                    ? 'border-menu-blue bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent hover:border-light-border dark:hover:border-dark-border hover:shadow-md',
                ]"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <h3
                      class="font-semibold text-light-primary-text dark:text-dark-primary-text"
                    >
                      {{ library.name }}
                    </h3>
                    <p
                      class="text-sm text-light-secondary-text dark:text-dark-secondary-text"
                    >
                      {{ library.booksCount || 0 }}
                      {{ library.booksCount === 1 ? "book" : "books" }}
                    </p>
                  </div>
                  <svg
                    v-if="selectedLibrary?.id === library.id"
                    class="w-6 h-6 text-menu-blue"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </button>
            </div>

            <!-- No Libraries -->
            <div v-else class="flex flex-col items-center justify-center py-12">
              <svg
                class="w-16 h-16 mb-4 text-light-secondary-text dark:text-dark-secondary-text"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
              <p
                class="text-light-primary-text dark:text-dark-primary-text text-lg font-medium mb-2"
              >
                No Libraries Found
              </p>
              <p
                class="text-light-secondary-text dark:text-dark-secondary-text text-center"
              >
                You need to create a library first before adding books
              </p>
            </div>
          </div>

          <!-- Action buttons -->
          <div
            class="flex justify-end space-x-3 mt-6 pt-4 border-t border-light-border dark:border-dark-border"
          >
            <button
              type="button"
              class="px-6 py-2 text-modal-button text-menu-blue bg-transparent rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              @click="closeModal"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="!selectedLibrary"
              class="px-6 py-2 text-white bg-green-600 rounded-lg text-modal-button hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="confirmSelection"
            >
              Add to Library
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </teleport>
</template>
