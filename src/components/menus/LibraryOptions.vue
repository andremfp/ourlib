// src/components/menus/LibraryOptionsMenu.vue
<script setup lang="ts">
defineProps<{
  isOpen: boolean;
  libraryName: string;
}>();

const emit = defineEmits<{
  close: [];
  rename: [];
  delete: [];
}>();
</script>

<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/20 z-[100] flex items-end justify-center px-4 pb-footer-padding"
      @click.self="emit('close')"
    >
      <div class="flex flex-col gap-2 w-full max-w-md">
        <!-- Options group -->
        <div
          class="bg-light-bg/80 dark:bg-dark-nav/80 backdrop-blur-lg rounded-xl w-full overflow-hidden"
        >
          <div
            class="p-2 text-menu-text text-center text-light-secondary-text dark:text-dark-secondary-text"
          >
            {{ libraryName }}
          </div>
          <div
            class="border-t border-hairline border-black/5 dark:border-white/10"
          >
            <button
              class="w-full py-4 text-center text-menu-title text-menu-blue"
              @click="emit('rename')"
            >
              Rename
            </button>
          </div>

          <div
            class="border-t border-hairline border-black/5 dark:border-white/10"
          >
            <button
              class="w-full py-4 text-center text-warning-red text-menu-title"
              @click="emit('delete')"
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
            class="w-full py-3 text-center text-menu-title text-menu-blue"
            @click="emit('close')"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
