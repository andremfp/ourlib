<script setup lang="ts">
import { computed } from "vue";
import { useTabStore } from "@/stores/tabStore";

const tabStore = useTabStore();
const activeTab = computed(() => tabStore.activeTab);
const setActiveTab = tabStore.setActiveTab;

const tabs = [
  {
    name: "Home",
    label: "Home",
    outlineSvg: {
      fill: "none",
      "stroke-width": "1",
    },
    outlineIcon: [
      {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
      },
    ],
    filledSvg: {},
    filledIcon: [
      {
        d: "M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z",
      },
      {
        d: "M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z",
      },
    ],
  },
  {
    name: "My Libraries",
    label: "My Libraries",
    outlineSvg: {
      fill: "none",
      "stroke-width": "1",
    },
    outlineIcon: [
      {
        d: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25",
      },
    ],
    filledSvg: {},
    filledIcon: [
      {
        d: "M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z",
      },
    ],
  },
  {
    name: "Add Book",
    label: "Add Book",
    outlineSvg: {},
    outlineIcon: [{ d: "M12 4.5v15m7.5-7.5h-15" }],
    filledSvg: { "stroke-width": "2" },
    filledIcon: [{ d: "M12 4.5v15m7.5-7.5h-15" }],
  },
  {
    name: "Search",
    label: "Search",
    outlineSvg: {},
    outlineIcon: [
      {
        d: "M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z",
      },
    ],
    filledSvg: {
      "stroke-width": "0.5",
    },
    filledIcon: [
      {
        d: "M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z",
      },
    ],
  },
  {
    name: "Profile",
    label: "Profile",
    outlineSvg: {
      fill: "none",
      "stroke-width": "1",
    },
    outlineIcon: [
      {
        d: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
      },
    ],
    filledSvg: {},
    filledIcon: [
      {
        d: "M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z",
      },
    ],
  },
];
</script>

<template>
  <div
    class="flex border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-dark-bg whitespace-nowrap"
  >
    <button
      v-for="tab in tabs"
      :key="tab.name"
      @click="setActiveTab(tab.name)"
      :class="[
        'flex-1 flex flex-col items-center justify-center pt-1 sm:py-2',
        activeTab === tab.name
          ? 'text-black dark:text-gray-200 border-t-2 border-black dark:border-gray-200'
          : 'text-gray-400 dark:text-gray-400 border-transparent',
      ]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        v-bind="activeTab === tab.name ? tab.filledSvg : tab.outlineSvg"
        :class="[
          'w-6 h-6',
          tab.name === 'Search'
            ? activeTab === tab.name
              ? 'fill-current stroke-current text-black dark:text-gray-200'
              : 'fill-current text-gray-400 dark:text-gray-400'
            : tab.name === 'Add Book'
              ? activeTab === tab.name
                ? 'stroke-current text-black dark:text-gray-200'
                : 'stroke-current text-gray-400 dark:text-gray-400'
              : activeTab === tab.name
                ? 'fill-current text-black dark:text-gray-200'
                : 'stroke-current text-gray-400 dark:text-gray-400',
        ]"
        :viewBox="'0 0 24 24'"
      >
        <path
          v-for="(path, index) in activeTab === tab.name
            ? tab.filledIcon
            : tab.outlineIcon"
          :key="index"
          v-bind="path"
        />
      </svg>
      <span class="mt-1 sm:text-xs text-xxs">{{ tab.label }}</span>
    </button>
  </div>
</template>
