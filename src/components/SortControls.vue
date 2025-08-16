<template>
  <div
    class="sort-controls bg-light-nav-secondary dark:bg-dark-nav-secondary px-3"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span
          class="text-sort-controls font-medium text-light-nav-text dark:text-dark-nav-text uppercase tracking-wide"
        >
          Sorted by:
        </span>
        <ion-button
          fill="clear"
          size="small"
          class="sort-option-btn"
          @click="cycleSortOption"
        >
          {{ getCurrentSortLabel() }}
        </ion-button>
      </div>

      <div class="flex items-center space-x-2">
        <ion-button
          fill="clear"
          size="small"
          @click="toggleSortDirection"
          class="sort-direction-btn"
        >
          <ion-icon
            :icon="sortReverse ? arrowUp : arrowDown"
            class="mr-1"
          ></ion-icon>
          <span class="text-sort-controls font-medium uppercase tracking-wide">
            {{ sortReverse ? "Reverse" : "Reverse" }}
          </span>
        </ion-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { IonButton, IonIcon } from "@ionic/vue";
import { arrowUp, arrowDown } from "ionicons/icons";
import { SORT } from "@/constants/constants";

// ============= Props =============
const props = defineProps<{
  type: "libraries" | "books";
  initialSortBy?: string;
  initialSortReverse?: boolean;
}>();

// ============= Emits =============
const emit = defineEmits<{
  "sort-changed": [sortBy: string, sortReverse: boolean];
}>();

// ============= State =============
const sortBy = ref(props.initialSortBy || getDefaultSortBy());
const sortReverse = ref(props.initialSortReverse || false);

// ============= Computed Properties =============
const sortOptions = computed(() => {
  if (props.type === "libraries") {
    return [
      { value: SORT.BY.NAME, label: "Name" },
      { value: SORT.BY.DATE, label: "Date Added" },
    ];
  } else {
    return [
      { value: SORT.BY.TITLE, label: "Title" },
      { value: SORT.BY.AUTHOR, label: "Author" },
      { value: SORT.BY.DATE, label: "Date Added" },
    ];
  }
});

// ============= Methods =============
function getDefaultSortBy(): string {
  return props.type === "libraries" ? SORT.BY.NAME : SORT.BY.TITLE;
}

function setSortBy(value: string) {
  if (sortBy.value !== value) {
    sortBy.value = value;
    emitSortChange();
  }
}

function toggleSortDirection() {
  sortReverse.value = !sortReverse.value;
  emitSortChange();
}

function resetSortDirection() {
  sortReverse.value = false;
}

function emitSortChange() {
  emit("sort-changed", sortBy.value, sortReverse.value);
}

function cycleSortOption() {
  const currentIndex = sortOptions.value.findIndex(
    (option) => option.value === sortBy.value,
  );
  const nextIndex = (currentIndex + 1) % sortOptions.value.length;
  setSortBy(sortOptions.value[nextIndex].value);
  resetSortDirection();
}

function getCurrentSortLabel(): string {
  const currentOption = sortOptions.value.find(
    (option) => option.value === sortBy.value,
  );
  return currentOption ? currentOption.label : "N/A";
}

// ============= Watchers =============
watch(
  () => props.initialSortBy,
  (newSortBy) => {
    if (newSortBy !== undefined) {
      sortBy.value = newSortBy;
    }
  },
);

watch(
  () => props.initialSortReverse,
  (newSortReverse) => {
    if (newSortReverse !== undefined) {
      sortReverse.value = newSortReverse;
    }
  },
);
</script>

<style scoped>
.sort-controls {
  background-color: theme("colors.light-sort-controls");
}

body.dark .sort-controls {
  background-color: theme("colors.dark-sort-controls");
}

.sort-direction-btn {
  --color: theme("colors.light-nav-text");
  font-size: theme("fontSize.sort-controls");
  transition: all theme("transitionDuration.backdrop")
    theme("transitionTimingFunction.smooth");
  min-height: auto;
}

body.dark .sort-direction-btn {
  --color: theme("colors.dark-nav-text");
}

.sort-option-btn {
  --color: theme("colors.light-nav-text");
  font-size: theme("fontSize.sort-controls");
  font-weight: 500;
  transition: all theme("transitionDuration.backdrop")
    theme("transitionTimingFunction.smooth");
  min-height: auto;
  --padding-start: 0;
}

body.dark .sort-option-btn {
  --color: theme("colors.dark-nav-text");
}
</style>
