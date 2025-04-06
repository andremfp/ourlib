<script setup lang="ts">
// ============= PROPS & EMITS =============
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
  <div class="fixed inset-0 z-[101] flex items-center justify-center p-4">
    <!-- Modal-->
    <div class="w-full bg-light-bg dark:bg-dark-nav rounded-xl p-4">
      <!-- Header -->
      <h3
        class="text-modal-title font-semibold text-light-primary-text dark:text-dark-primary-text mb-2"
      >
        Delete Library
      </h3>

      <!-- Confirmation message -->
      <p
        class="text-modal-text text-light-secondary-text dark:text-dark-secondary-text mb-4"
      >
        Are you sure you want to delete "{{ libraryName }}"? This action cannot
        be undone.
      </p>

      <!-- Action buttons -->
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
</template>
