<script setup lang="ts">
/**
 * Specific Navbar variant displayed when the 'Add Book' tab is active.
 * Shows a back button when not in selection mode and handles back navigation.
 */
import { computed } from "vue";
import type { TabName } from "@/types/types";
import logger from "@/utils/logger";

// --- Props ---
const props = defineProps<{
  /** The name of the currently active tab. */
  activeTab: TabName | string;
  /** The current mode of the AddBook component. */
  addBookMode: string;
}>();

// --- Emits ---
const emit = defineEmits(["goBack"]);

// --- Methods ---
/** Emits the 'goBack' event when the back button is clicked. */
const goBack = () => {
  logger.debug("[AddBookNavbar] Back button clicked.");
  emit("goBack");
};

// --- Computed Properties ---
/** Determines if the back button should be visible. */
const showBackButton = computed(() => props.addBookMode !== "selection");
</script>

<template>
  <div class="relative h-8">
    <!-- Left Actions: Back Button -->
    <div class="absolute left-0 w-8 h-8 z-10">
      <!-- Back Button (visible when not in selection mode) -->
      <button
        v-if="showBackButton"
        class="absolute inset-0 flex items-center justify-center text-light-nav-text dark:text-dark-nav-text hover:opacity-80 transition-opacity"
        @click="goBack"
        aria-label="Go back"
      >
        <svg
          class="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
            stroke="currentColor"
          />
        </svg>
      </button>
    </div>

    <!-- Center Content: Title -->
    <div class="flex items-center justify-center h-full">
      <p
        class="text-nav text-light-nav-text dark:text-dark-nav-text text-center whitespace-nowrap"
      >
        {{ activeTab }}
      </p>
    </div>
  </div>
</template>
