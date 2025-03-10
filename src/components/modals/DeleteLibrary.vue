// src/components/modals/DeleteLibraryModal.vue
<script setup lang="ts">
defineProps<{
  isOpen: boolean;
  libraryName: string;
}>();

const emit = defineEmits<{
  close: [];
  delete: [];
}>();
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
          class="text-modal-title font-semibold text-light-primary-text dark:text-dark-primary-text mb-2"
        >
          Delete Library
        </h3>
        <p
          class="text-modal-text text-light-secondary-text dark:text-dark-secondary-text mb-4"
        >
          Are you sure you want to delete "{{ libraryName }}"? This action
          cannot be undone.
        </p>
        <div class="flex justify-end space-x-2">
          <button
            class="px-4 py-2 text-menu-blue bg-transparent rounded-lg text-modal-button"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-white bg-warning-red rounded-lg text-modal-button"
            @click="emit('delete')"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
