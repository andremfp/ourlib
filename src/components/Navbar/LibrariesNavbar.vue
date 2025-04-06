<script setup lang="ts">
/**
 * Specific Navbar variant displayed when the 'My Libraries' tab is active.
 * Handles the animated transition between the tab title and the library name,
 * and displays context-specific action buttons (back, add, options).
 */
import { computed } from "vue"; // Import computed
import { ANIMATION, UI_STATE } from "@/constants/constants";
import type { TabName } from "@/types/types";
import logger from "@/utils/logger"; // Import logger

// --- Props ---
const props = defineProps<{
  /** The name of the currently active tab. */
  activeTab: TabName | string;
  /** The name of the library currently open in the drawer, if any. */
  currentLibraryName: string;
  /** The progress of the library drawer opening (0-1). */
  drawerProgress: number;
}>();

// --- Emits ---
const emit = defineEmits(["goBack", "addLibrary", "toggleOptions"]);

// --- Methods ---
/** Emits the 'goBack' event when the back button is clicked. */
const goBack = () => {
  logger.debug("[LibrariesNavbar] Back button clicked.");
  emit("goBack");
};

/** Emits the 'addLibrary' event when the add button is clicked. */
const addLibrary = () => {
  logger.debug("[LibrariesNavbar] Add library button clicked.");
  emit("addLibrary");
};

/** Emits the 'toggleOptions' event when the options button is clicked. */
const toggleOptions = () => {
  logger.debug("[LibrariesNavbar] Toggle options button clicked.");
  emit("toggleOptions");
};

// --- Style Calculations ---
// Note: These calculations were previously in useDrawerTransition.ts
// Moved here as they are specific to this component's template.

/** Calculates dynamic styles for the library title paragraph. */
const libraryTitleStyle = computed(() => ({
  opacity: props.currentLibraryName
    ? Math.max(
        UI_STATE.LIBRARY_DRAWER.CLOSED,
        props.drawerProgress * ANIMATION.NAVBAR.TITLE_SLIDE_MULTIPLIER -
          ANIMATION.NAVBAR.TITLE_SLIDE_OFFSET,
      )
    : UI_STATE.LIBRARY_DRAWER.CLOSED,
  transform: `translateX(calc(-50% + ${
    (UI_STATE.LIBRARY_DRAWER.OPEN - props.drawerProgress) *
    ANIMATION.NAVBAR.LIBRARY_NAME_SLIDE
  }%))`, // Slide based on inverse progress
  transition:
    props.drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
    props.drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
      ? `all ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
      : "none", // Apply transition only at endpoints
}));

/** Calculates dynamic styles for the active tab title paragraph. */
const activeTabTitleStyle = computed(() => ({
  opacity: props.currentLibraryName
    ? Math.max(
        UI_STATE.LIBRARY_DRAWER.CLOSED,
        UI_STATE.LIBRARY_DRAWER.OPEN -
          props.drawerProgress * ANIMATION.NAVBAR.TITLE_SLIDE_MULTIPLIER +
          ANIMATION.NAVBAR.TITLE_SLIDE_OFFSET,
      )
    : UI_STATE.LIBRARY_DRAWER.OPEN,
  transform: `translateX(calc(-50% + ${
    props.drawerProgress * ANIMATION.NAVBAR.TAB_NAME_SLIDE
  }%))`, // Slide based on progress
  transition:
    props.drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
    props.drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
      ? `all ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
      : "none", // Apply transition only at endpoints
}));

/** Calculates dynamic styles for buttons that appear when drawer is OPEN. */
const drawerOpenButtonStyle = computed(() => ({
  opacity: props.currentLibraryName
    ? props.drawerProgress
    : UI_STATE.LIBRARY_DRAWER.CLOSED,
  pointerEvents:
    props.currentLibraryName &&
    props.drawerProgress >= UI_STATE.NAVBAR.INTERACTION_THRESHOLD
      ? "auto"
      : ("none" as "auto" | "none"), // Explicitly type pointerEvents
  transition:
    props.drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
    props.drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
      ? `opacity ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
      : "none",
}));

/** Calculates dynamic styles for buttons that appear when drawer is CLOSED. */
const drawerClosedButtonStyle = computed(() => ({
  opacity: props.currentLibraryName
    ? UI_STATE.LIBRARY_DRAWER.OPEN - props.drawerProgress
    : UI_STATE.LIBRARY_DRAWER.OPEN,
  pointerEvents:
    !props.currentLibraryName ||
    props.drawerProgress < UI_STATE.NAVBAR.INTERACTION_THRESHOLD
      ? "auto"
      : ("none" as "auto" | "none"), // Explicitly type pointerEvents
  transition:
    props.drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
    props.drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
      ? `opacity ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
      : "none",
}));
</script>

<template>
  <div class="relative h-8">
    <!-- Left Actions: Back / Add Library -->
    <div class="absolute left-0 w-8 h-8 z-10">
      <!-- Back Button (visible when drawer is open) -->
      <button
        class="absolute inset-0 flex items-center justify-center text-light-nav-text dark:text-dark-nav-text"
        :style="{
          ...drawerOpenButtonStyle,
          // Specific transform for back button visual effect
          transform: `translateX(${ANIMATION.NAVBAR.BACK_BUTTON_OFFSET}px)`,
        }"
        @click="goBack"
        aria-label="Back to Libraries"
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

      <!-- Add Library Button (visible when drawer is closed) -->
      <button
        class="absolute inset-0 flex items-center justify-center text-light-nav-text dark:text-dark-nav-text"
        :style="drawerClosedButtonStyle"
        @click="addLibrary"
        aria-label="Add new library"
      >
        <svg
          class="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 4V20M4 12H20"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- Right Actions: Options -->
    <div class="absolute right-0 w-8 h-8 z-10">
      <!-- Options Button (visible when drawer is open) -->
      <button
        class="absolute inset-0 flex items-center justify-center text-light-nav-text dark:text-dark-nav-text"
        :style="drawerOpenButtonStyle"
        @click="toggleOptions"
        aria-label="Library options"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <!-- Ellipsis icon -->
          <path
            d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- Center Content: Sliding Titles -->
    <div
      class="absolute inset-x-0 h-full flex items-center justify-center overflow-hidden"
    >
      <!-- Library Name Title (visible when drawer is opening/open) -->
      <p
        class="absolute text-nav text-light-nav-text dark:text-dark-nav-text text-center whitespace-nowrap"
        :style="{
          ...libraryTitleStyle,
          left: '50%', // Keep centered horizontally
        }"
      >
        {{ currentLibraryName }}
      </p>

      <!-- Active Tab Title (visible when drawer is closing/closed) -->
      <p
        class="absolute text-nav text-light-nav-text dark:text-dark-nav-text text-center whitespace-nowrap"
        :style="{
          ...activeTabTitleStyle,
          left: '50%', // Keep centered horizontally
        }"
      >
        {{ activeTab }}
      </p>
    </div>
  </div>
</template>
