<script setup lang="ts">
/**
 * Component displaying sort controls (method and direction) for the 'My Libraries' tab.
 * Adapts its display based on whether the main list or a library drawer is active,
 * using transitions coordinated with the drawer's progress.
 */
import { ANIMATION, UI_STATE } from "@/constants/constants";
import logger from "@/utils/logger"; // Import logger

// --- Props ---
defineProps<{
  /** Current sort method in the active view (drawer or main list). */
  sortBy: string;
  /** Current sort direction in the active view (drawer or main list). */
  sortReverse: boolean;
  /** Sort method saved from the main list view (shown when drawer is closed/closing). */
  savedSortBy: string;
  /** Sort direction saved from the main list view (shown when drawer is closed/closing). */
  savedSortReverse: boolean;
  /** Name of the library currently open in the drawer, if any. */
  currentLibraryName: string;
  /** The progress of the library drawer opening (0-1). */
  drawerProgress: number;
}>();

// --- Emits ---
const emit = defineEmits(["changeSortBy", "toggleSortDirection"]);

// --- Methods ---
/** Emits event to change the sort method. */
const changeSortBy = () => {
  logger.debug("[SortControls] Change sort method button clicked.");
  emit("changeSortBy");
};

/** Emits event to toggle the sort direction. */
const toggleSortDirection = () => {
  logger.debug("[SortControls] Toggle sort direction button clicked.");
  emit("toggleSortDirection");
};

// --- Style Calculations ---
/**
 * Calculates the transition style, applying it only when the drawer is fully open or closed
 * to match the behavior of other Navbar elements.
 *
 * @param {number} progress - The current drawer progress (0-1).
 * @returns {object} Style object containing the conditional transition property.
 */
const transitionStyle = (progress: number) => ({
  transition:
    progress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
    progress === UI_STATE.LIBRARY_DRAWER.OPEN
      ? `all ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out` // Use 'all' for opacity and transform (arrow rotation)
      : ("none" as "none" | string), // Explicit type to satisfy StyleValue
});
</script>

<template>
  <div
    class="flex justify-between items-center px-4 py-2 bg-light-nav-sort-controls dark:bg-dark-nav-sort-controls text-nav-subtext text-light-nav-text dark:text-dark-nav-text border-t border-light-border/20 dark:border-dark-border/20"
  >
    <!-- Left side: Sort method -->
    <div class="flex items-center relative">
      <span class="font-light mr-1">SORTED BY:</span>
      <div class="relative font-bold">
        <!-- Libraries view sort value (visible when drawer closed/closing) -->
        <span
          :style="{
            opacity: currentLibraryName ? 1 - drawerProgress : 1,
            position: 'absolute',
            ...transitionStyle(drawerProgress),
          }"
          aria-hidden="true"
        >
          {{ savedSortBy }}
        </span>

        <!-- Drawer view sort value (visible when drawer open/opening) -->
        <span
          :style="{
            opacity: currentLibraryName ? drawerProgress : 0,
            position: 'absolute', // Keep position absolute
            ...transitionStyle(drawerProgress),
          }"
          aria-hidden="true"
        >
          {{ sortBy }}
        </span>

        <!-- Invisible text spacer to maintain width based on the longer sort method name -->
        <span class="invisible" aria-hidden="true">{{
          savedSortBy.length > sortBy.length ? savedSortBy : sortBy
        }}</span>
      </div>
      <!-- Clickable area covering the sort method text -->
      <button
        @click="changeSortBy"
        class="absolute inset-0 w-full h-full"
        aria-label="Change sort method"
        type="button"
      ></button>
    </div>

    <!-- Right side: Sort direction control -->
    <div class="flex items-center">
      <!-- Container for the animated arrow icons -->
      <div class="relative mr-1 w-4 h-4" aria-hidden="true">
        <!-- Libraries view arrow (visible when drawer closed/closing) -->
        <svg
          class="w-4 h-4 absolute"
          :class="{ 'transform rotate-180': savedSortReverse }"
          :style="{
            opacity: currentLibraryName ? 1 - drawerProgress : 1,
            ...transitionStyle(drawerProgress),
          }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M12 5v14M12 19l7-7M12 19l-7-7"
          />
        </svg>

        <!-- Drawer view arrow (visible when drawer open/opening) -->
        <svg
          class="w-4 h-4 absolute"
          :class="{ 'transform rotate-180': sortReverse }"
          :style="{
            opacity: currentLibraryName ? drawerProgress : 0,
            ...transitionStyle(drawerProgress),
          }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M12 5v14M12 19l7-7M12 19l-7-7"
          />
        </svg>
      </div>
      <!-- Button to toggle sort direction -->
      <button
        @click="toggleSortDirection"
        class="font-bold"
        aria-label="Reverse sort direction"
        type="button"
      >
        REVERSE
      </button>
    </div>
  </div>
</template>
