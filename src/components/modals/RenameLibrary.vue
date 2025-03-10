// src/components/modals/RenameLibraryModal.vue
<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  isOpen: boolean;
  libraryName: string;
}>();

const emit = defineEmits<{
  close: [];
  rename: [newName: string];
}>();

const newLibraryName = ref(props.libraryName);
const errorMessage = ref("");

const MAX_LENGTH = 50;

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      newLibraryName.value = props.libraryName;
      errorMessage.value = "";
    }
  },
);

console.log(props.libraryName);

const handleRename = () => {
  const trimmedName = newLibraryName.value.trim();

  if (!trimmedName) {
    errorMessage.value = "Library name cannot be empty";
    return;
  }

  if (trimmedName === props.libraryName) {
    errorMessage.value = "Please enter a different name";
    return;
  }

  if (trimmedName.length > MAX_LENGTH) {
    errorMessage.value = `Name cannot be longer than ${MAX_LENGTH} characters`;
    return;
  }

  emit("rename", trimmedName);
  emit("close");
};
</script>

<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/20 z-[100] flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-md bg-light-bg/80 dark:bg-dark-nav/80 backdrop-blur-lg rounded-xl p-4"
      >
        <h3
          class="text-modal-title font-semibold text-light-primary-text dark:text-dark-primary-text mb-4"
        >
          Rename Library
        </h3>
        <input
          v-model="newLibraryName"
          type="text"
          class="w-full p-2 mb-1 text-modal-text bg-light-card dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg text-light-primary-text dark:text-dark-primary-text"
          :class="{ 'border-red-500': errorMessage }"
        />
        <p v-if="errorMessage" class="text-red-500 text-sm mb-3">
          {{ errorMessage }}
        </p>
        <div class="flex justify-end space-x-2">
          <button
            class="px-4 py-2 text-modal-button text-menu-blue bg-transparent rounded-lg"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-white bg-menu-blue rounded-lg"
            @click="handleRename"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
