<script setup lang="ts">
import { ref, watch } from "vue";
import { getAuth } from "firebase/auth";
import { createLibrary } from "@/apis/libraryAPI";
import type { Library } from "@/apis/schema";
import { UI_LIMITS } from "@/constants/constants";

// ============= PROPS & EMITS =============
const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["close", "libraryCreated"]);

// ============= STATE =============
// Form state
const libraryName = ref("");
const errorMessage = ref("");
const isSubmitting = ref(false);

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

// ============= FORM HANDLING =============
/**
 * Submit the form to create a new library
 */
async function handleSubmit() {
  const trimmedName = libraryName.value.trim();

  if (!trimmedName) {
    errorMessage.value = "Library name is required";
    return;
  }

  if (trimmedName.length < UI_LIMITS.LIBRARY.NAME_MIN_LENGTH) {
    errorMessage.value = `Library name must be at least ${UI_LIMITS.LIBRARY.NAME_MIN_LENGTH} characters`;
    return;
  }

  if (trimmedName.length > UI_LIMITS.LIBRARY.NAME_MAX_LENGTH) {
    errorMessage.value = `Library name cannot exceed ${UI_LIMITS.LIBRARY.NAME_MAX_LENGTH} characters`;
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
      name: trimmedName,
      ownerId: userId,
      booksCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Library);

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
}

/**
 * Close the modal and reset form state
 */
function closeModal() {
  libraryName.value = "";
  errorMessage.value = "";
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
          class="relative z-[51] w-full max-w-md bg-light-bg dark:bg-dark-nav rounded-xl p-4"
        >
          <!-- Modal header -->
          <div class="flex justify-between items-center">
            <h3
              class="text-modal-title font-semibold text-light-primary-text dark:text-dark-primary-text mb-4"
            >
              Create New Library
            </h3>
          </div>

          <!-- Library creation inputs -->
          <div class="mb-4">
            <label
              for="libraryName"
              class="block text-modal-text text-light-secondary-text dark:text-dark-secondary-text mb-1"
            >
              Library Name
            </label>
            <input
              id="libraryName"
              v-model="libraryName"
              type="text"
              class="w-full px-3 py-2 text-modal-text bg-light-card dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg text-light-primary-text dark:text-dark-primary-text focus:outline-none"
              placeholder="Enter library name"
              @keyup.enter="handleSubmit"
            />

            <!-- Error message -->
            <p
              v-if="errorMessage"
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {{ errorMessage }}
            </p>
          </div>

          <!-- Action buttons -->
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 text-modal-button text-menu-blue bg-transparent rounded-lg"
              @click="closeModal"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="isSubmitting"
              class="px-4 py-2 text-white bg-menu-blue rounded-lg text-modal-button"
              @click="handleSubmit"
            >
              <span v-if="isSubmitting">Creating...</span>
              <span v-else>Create Library</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </teleport>
</template>
