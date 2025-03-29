<script setup lang="ts">
import { ANIMATION, UI_STATE } from "@/constants/constants";
import type { TabName } from "@/types/types";

defineProps<{
  activeTab: TabName | string;
  currentLibraryName: string;
  drawerProgress: number;
}>();

const emit = defineEmits(["goBack", "addLibrary", "toggleOptions"]);

const goBack = () => {
  emit("goBack");
};

const addLibrary = () => {
  emit("addLibrary");
};

const toggleOptions = () => {
  emit("toggleOptions");
};
</script>

<template>
  <div class="relative h-8">
    <div class="absolute left-0 w-8 h-8 z-10">
      <button
        class="absolute inset-0 flex items-center justify-center text-light-nav-text dark:text-dark-nav-text"
        :style="{
          opacity: currentLibraryName
            ? drawerProgress
            : UI_STATE.LIBRARY_DRAWER.CLOSED,
          pointerEvents:
            currentLibraryName &&
            drawerProgress >= UI_STATE.NAVBAR.INTERACTION_THRESHOLD
              ? 'auto'
              : 'none',
          transition:
            drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
            drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
              ? `opacity ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
              : 'none',
          transform: `translateX(${ANIMATION.NAVBAR.BACK_BUTTON_OFFSET}px)`,
        }"
        @click="goBack"
      >
        <svg
          class="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
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

      <button
        class="absolute inset-0 flex items-center justify-center text-light-nav-text dark:text-dark-nav-text"
        :style="{
          opacity: currentLibraryName
            ? UI_STATE.LIBRARY_DRAWER.OPEN - drawerProgress
            : UI_STATE.LIBRARY_DRAWER.OPEN,
          pointerEvents:
            !currentLibraryName ||
            drawerProgress < UI_STATE.NAVBAR.INTERACTION_THRESHOLD
              ? 'auto'
              : 'none',
          transition:
            drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
            drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
              ? `opacity ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
              : 'none',
        }"
        @click="addLibrary"
      >
        <svg
          class="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
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

    <!-- Add in the navbar next to the back button -->
    <div class="absolute right-0 w-8 h-8 z-10">
      <button
        class="absolute inset-0 flex items-center justify-center text-light-nav-text dark:text-dark-nav-text"
        :style="{
          opacity: currentLibraryName
            ? drawerProgress
            : UI_STATE.LIBRARY_DRAWER.CLOSED,
          pointerEvents:
            currentLibraryName &&
            drawerProgress >= UI_STATE.NAVBAR.INTERACTION_THRESHOLD
              ? 'auto'
              : 'none',
          transition:
            drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
            drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
              ? `opacity ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
              : 'none',
        }"
        @click="toggleOptions"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
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

    <div
      class="absolute inset-x-0 h-full flex items-center justify-center overflow-hidden"
    >
      <p
        class="absolute text-nav text-light-nav-text dark:text-dark-nav-text text-center whitespace-nowrap"
        :style="{
          opacity: currentLibraryName
            ? Math.max(
                UI_STATE.LIBRARY_DRAWER.CLOSED,
                drawerProgress * ANIMATION.NAVBAR.TITLE_SLIDE_MULTIPLIER -
                  ANIMATION.NAVBAR.TITLE_SLIDE_OFFSET,
              )
            : UI_STATE.LIBRARY_DRAWER.CLOSED,
          left: '50%',
          transform: `translateX(calc(-50% + ${
            (UI_STATE.LIBRARY_DRAWER.OPEN - drawerProgress) *
            ANIMATION.NAVBAR.LIBRARY_NAME_SLIDE
          }%))`,
          transition:
            drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
            drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
              ? `all ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
              : 'none',
        }"
      >
        {{ currentLibraryName }}
      </p>

      <p
        class="absolute text-nav text-light-nav-text dark:text-dark-nav-text text-center whitespace-nowrap"
        :style="{
          opacity: currentLibraryName
            ? Math.max(
                UI_STATE.LIBRARY_DRAWER.CLOSED,
                UI_STATE.LIBRARY_DRAWER.OPEN -
                  drawerProgress * ANIMATION.NAVBAR.TITLE_SLIDE_MULTIPLIER +
                  ANIMATION.NAVBAR.TITLE_SLIDE_OFFSET,
              )
            : UI_STATE.LIBRARY_DRAWER.OPEN,
          left: '50%',
          transform: `translateX(calc(-50% + ${
            drawerProgress * ANIMATION.NAVBAR.TAB_NAME_SLIDE
          }%))`,
          transition:
            drawerProgress === UI_STATE.LIBRARY_DRAWER.CLOSED ||
            drawerProgress === UI_STATE.LIBRARY_DRAWER.OPEN
              ? `all ${ANIMATION.NAVBAR.TRANSITION_DURATION}ms ease-in-out`
              : 'none',
        }"
      >
        {{ activeTab }}
      </p>
    </div>
  </div>
</template>
