<script setup lang="ts">
import { computed } from "vue";
import { useTabStore } from "@/stores/tabStore";

type SVGRect = {
  "stroke-linejoin": "round" | "miter" | "bevel" | "inherit";
  width: string;
  height: string;
  x: string;
  y: string;
  rx: string;
  ry: string;
};

type Tab = {
  name: string;
  label: string;
  outlineSvg: Record<string, string>;
  outlineRects?: SVGRect[];
  outlinePaths: Record<string, string>[];
  filledSvg: Record<string, string>;
  filledPaths: Record<string, string>[];
};

const tabStore = useTabStore();
const activeTab = computed(() => tabStore.activeTab);
const setActiveTab = tabStore.setActiveTab;

const tabs: Tab[] = [
  {
    name: "Home",
    label: "Home",
    outlineSvg: {
      fill: "none",
      "stroke-width": "1",
    },
    outlinePaths: [
      {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
      },
    ],
    filledSvg: {},
    filledPaths: [
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
    outlineRects: [
      {
        "stroke-linejoin": "round",
        width: "3",
        height: "17",
        x: "1.5",
        y: "4.5",
        rx: "1",
        ry: "1",
      },
      {
        "stroke-linejoin": "round",
        width: "6",
        height: "14",
        x: "5.2",
        y: "7.5",
        rx: "1",
        ry: "1",
      },
      {
        "stroke-linejoin": "round",
        width: "4.5",
        height: "19.5",
        x: "12",
        y: "2.2",
        rx: "1",
        ry: "1",
      },
    ],
    outlinePaths: [
      {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M5.2 10.5h6M5.2 18.7h6",
      },
      {
        "stroke-linejoin": "round",
        d: "M19.8 4.5l-1.9 0.2c-0.5 0.05-0.9 0.54-0.84 1.08l1.63 15c0.06 0.54 0.53 0.94 1.05 0.88l1.9-0.2c0.52-0.05 0.9-0.54 0.84-1.08l-1.63-15c-0.06-0.54-0.53-0.94-1.05-0.88z",
      },
    ],
    filledSvg: {},
    filledPaths: [
      {
        d: "M4 22.5H1.5c-.3 0-.5-.2-.5-.5V4.5c0-.3.2-.5.5-.5H4c.3 0 .5.2.5.5v17.5c0 .3-.2.5-.5.5M11.5 9.5V7c0-.3-.2-.5-.5-.5H6c-.3 0-.5.2-.5.5v2.5ZM5.5 19.5V22c0 .3.2.5.5.5h5c.3 0 .5-.2.5-.5v-2.5Zm0-8h6v6.5h-6zm10.5 11h-3.5c-.3 0-.5-.2-.5-.5V2.5c0-.3.2-.5.5-.5H16c.3 0 .5.2.5.5v19.5c0 .3-.2.5-.5.5m1.5-17.5l1.5 17c0 .3.3.5.6.5l3.4-.5c.3 0 .5-.3.5-.6l-1.5-17c0-.3-.3-.5-.6-.5l-3.4.4c-.2 0-.5.3-.5.7",
      },
    ],
  },
  {
    name: "Add Book",
    label: "Add Book",
    outlineSvg: {},
    outlinePaths: [{ d: "M12 4.5v15m7.5-7.5h-15" }],
    filledSvg: { "stroke-width": "2" },
    filledPaths: [{ d: "M12 4.5v15m7.5-7.5h-15" }],
  },
  {
    name: "Search",
    label: "Search",
    outlineSvg: {},
    outlinePaths: [
      {
        d: "M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z",
      },
    ],
    filledSvg: {
      "stroke-width": "0.5",
    },
    filledPaths: [
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
    outlinePaths: [
      {
        d: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
      },
    ],
    filledSvg: {},
    filledPaths: [
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
        <!-- Render rect elements if they exist -->
        <rect
          v-for="(rect, index) in activeTab !== tab.name
            ? tab.outlineRects
            : []"
          :key="`rect-${index}`"
          v-bind="rect"
        />
        <!-- Render path elements -->
        <path
          v-for="(path, index) in activeTab === tab.name
            ? tab.filledPaths
            : tab.outlinePaths"
          :key="`path-${index}`"
          v-bind="path"
        />
      </svg>
      <span class="mt-1 sm:text-xs text-xxs">{{ tab.label }}</span>
    </button>
  </div>
</template>
