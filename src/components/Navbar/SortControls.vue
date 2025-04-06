<script setup lang="ts">
import { ANIMATION, UI_STATE } from "@/constants/constants";

defineProps<{
  sortBy: string;
  sortReverse: boolean;
  savedSortBy: string;
  savedSortReverse: boolean;
  currentLibraryName: string;
  drawerProgress: number;
}>();

const emit = defineEmits(["changeSortBy", "toggleSortDirection"]);

const changeSortBy = () => {
  emit("changeSortBy");
};

const toggleSortDirection = () => {
  emit("toggleSortDirection");
};

const transitionStyle = (progress: number) => ({
  transition:
    progress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
    progress === UI_STATE.LIBRARY_DRAWER.OPEN
      ? `all ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
      : "none",
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
        <!-- Libraries view sort value -->
        <span
          :style="{
            opacity: currentLibraryName ? 1 - drawerProgress : 1,
            position: 'absolute',
            ...transitionStyle(drawerProgress),
          }"
        >
          {{ savedSortBy }}
        </span>

        <!-- Drawer view sort value -->
        <span
          :style="{
            opacity: currentLibraryName ? drawerProgress : 0,
            ...transitionStyle(drawerProgress),
          }"
        >
          {{ sortBy }}
        </span>

        <!-- Invisible spacer to maintain width -->
        <span class="invisible">{{
          savedSortBy.length > sortBy.length ? savedSortBy : sortBy
        }}</span>
      </div>
      <!-- Make button cover both spans but not extend beyond its parent -->
      <button
        @click="changeSortBy"
        class="absolute inset-0 w-full h-full"
        aria-label="Change sort method"
      ></button>
    </div>

    <!-- Right side: Sort direction control -->
    <div class="flex items-center">
      <div class="relative mr-1 w-4 h-4">
        <!-- Libraries view arrow -->
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

        <!-- Drawer view arrow -->
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
      <button
        @click="toggleSortDirection"
        class="font-bold"
        aria-label="Reverse sort direction"
      >
        REVERSE
      </button>
    </div>
  </div>
</template>
