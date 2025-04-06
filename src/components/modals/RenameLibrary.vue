<script setup lang="ts">
import { ref, watch } from "vue";
import { UI_LIMITS } from "@/constants/constants";

// ============= PROPS & EMITS =============
const props = defineProps<{
  isOpen: boolean;
  libraryName: string;
}>();

const emit = defineEmits<{
  close: [];
  rename: [newName: string];
}>();

// ============= STATE =============
// Form state
const newLibraryName = ref(props.libraryName);
const errorMessage = ref("");

// Reset form when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      newLibraryName.value = props.libraryName;
      errorMessage.value = "";
    }
  },
  { immediate: true },
);

// ============= EVENT HANDLERS =============
/**
 * Handle renaming a library, with input validation
 */
function handleRename() {
  const trimmedName = newLibraryName.value.trim();

  // Validate input
  if (!trimmedName) {
    errorMessage.value = "Library name cannot be empty";
    return;
  }

  if (trimmedName === props.libraryName) {
    errorMessage.value = "Please enter a different name";
    return;
  }

  if (trimmedName.length < UI_LIMITS.LIBRARY.NAME_MIN_LENGTH) {
    errorMessage.value = `Name must be at least ${UI_LIMITS.LIBRARY.NAME_MIN_LENGTH} characters`;
    return;
  }

  if (trimmedName.length > UI_LIMITS.LIBRARY.NAME_MAX_LENGTH) {
    errorMessage.value = `Name cannot be longer than ${UI_LIMITS.LIBRARY.NAME_MAX_LENGTH} characters`;
    return;
  }

  // Submit valid name
  emit("rename", trimmedName);
}
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Modal -->
    <div class="w-full bg-light-bg dark:bg-dark-nav rounded-xl p-4">
      <!-- Header -->
      <h3
        class="text-modal-title font-semibold text-light-primary-text dark:text-dark-primary-text mb-4"
      >
        Rename Library
      </h3>

      <!-- Input field -->
      <input
        v-model="newLibraryName"
        type="text"
        class="w-full p-2 mb-1 text-modal-text bg-light-card dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg text-light-primary-text dark:text-dark-primary-text focus:outline-none"
        :class="{ 'border-red-500': errorMessage }"
        @keyup.enter="handleRename"
      />

      <!-- Error message -->
      <p v-if="errorMessage" class="text-red-500 text-sm mb-3">
        {{ errorMessage }}
      </p>

      <!-- Action buttons -->
      <div class="flex justify-end space-x-2">
        <button
          class="px-4 py-2 text-modal-button text-menu-blue bg-transparent rounded-lg"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 text-white bg-menu-blue rounded-lg text-modal-button"
          @click="handleRename"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>
