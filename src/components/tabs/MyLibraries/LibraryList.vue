<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>My Libraries</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content @click="handleContentClick">
    <ion-refresher slot="fixed" @ionrefresh="handleRefresh">
      <ion-refresher-content></ion-refresher-content>
    </ion-refresher>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center h-full">
      <ion-spinner name="crescent"></ion-spinner>
      <span class="ml-2">Loading libraries...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-4 text-center">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <ion-button @click="refreshLibraries" :disabled="isRefreshing">
        <ion-spinner
          v-if="isRefreshing"
          name="crescent"
          class="mr-2"
        ></ion-spinner>
        Try Again
      </ion-button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="showEmptyState"
      class="flex flex-col items-center justify-center h-full p-4"
    >
      <ion-icon :icon="library" class="text-6xl text-gray-400 mb-4"></ion-icon>
      <h2 class="text-xl font-semibold mb-2">No Libraries Yet</h2>
      <p class="text-gray-500 text-center mb-4">
        Create your first library to start organizing your books
      </p>
      <ion-button>
        <ion-icon :icon="add" slot="start"></ion-icon>
        Create Library
      </ion-button>
    </div>

    <!-- Libraries List -->
    <ion-list v-else ref="libraryListEl" @click="handleContentClick">
      <ion-item-sliding
        v-for="lib in sortedLibraries"
        :key="lib.id"
        @ionItemSliding="handleItemSliding"
        @click="handleContentClick"
      >
        <ion-item
          button
          @click="handleItemClick(lib.id, $event)"
          class="library-item"
        >
          <ion-icon
            :icon="library"
            slot="start"
            class="text-primary"
          ></ion-icon>
          <ion-label>
            <h2>{{ lib.name }}</h2>
            <p>{{ lib.booksCount || 0 }} books</p>
          </ion-label>
        </ion-item>

        <ion-item-options slot="end">
          <ion-item-option @click="handleDelete(lib.id)">
            <ion-label class="delete-label">Delete</ion-label>
          </ion-item-option>
        </ion-item-options>
      </ion-item-sliding>
    </ion-list>

    <!-- FAB for adding new library -->
    <ion-fab
      v-if="hasLibraries"
      slot="fixed"
      vertical="bottom"
      horizontal="end"
    >
      <ion-fab-button>
        <ion-icon :icon="add"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import {
  IonHeader,
  IonTitle,
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from "@ionic/vue";
import { add, library } from "ionicons/icons";
import { useLibraryList } from "./composables/useLibraryList";

import { markRaw } from "vue";
import LibraryDetail from "./LibraryDetail.vue";

// ============= State =============
const libraryListEl = ref<any>(null);
const hasSlidingItemOpen = ref(false);
const isClosingSlidingItem = ref(false);

// ============= Composables =============
const { libraries, isLoading, isRefreshing, error, refreshLibraries } =
  useLibraryList();

// ============= Computed Properties =============
const hasLibraries = computed(() => libraries.value.length > 0);
const showEmptyState = computed(() => !isLoading.value && !hasLibraries.value);
const sortedLibraries = computed(() => {
  return [...libraries.value].sort((a, b) => a.name.localeCompare(b.name));
});

// ============= Navigation Setup =============
const libraryComponent = markRaw(LibraryDetail);

const getNavController = () => {
  const navElement = document.querySelector("ion-nav");
  return navElement;
};

// ============= Sliding Item Management =============
const getOpenItem = async (): Promise<any | null> => {
  if (!libraryListEl.value) {
    const element = document.querySelector("#main-content ion-list");
    if (element) {
      const items = element.querySelectorAll("ion-item-sliding");
      for (const item of items) {
        const openAmount = await item.getOpenAmount();
        if (openAmount > 0) {
          return item;
        }
      }
    }
    return null;
  }

  const domElement = libraryListEl.value.$el || libraryListEl.value;
  const items = domElement.querySelectorAll("ion-item-sliding");

  for (const item of items) {
    const openAmount = await item.getOpenAmount();
    if (openAmount > 0) {
      return item;
    }
  }
  return null;
};

const closeAllSlidingItems = async () => {
  let items: any = null;

  if (libraryListEl.value) {
    const domElement = libraryListEl.value.$el || libraryListEl.value;
    if (domElement && domElement.querySelectorAll) {
      items = domElement.querySelectorAll("ion-item-sliding");
    }
  }

  if (!items) {
    const element = document.querySelector("#main-content ion-list");
    if (element) {
      items = element.querySelectorAll("ion-item-sliding");
    }
  }

  if (!items) return;

  for (const item of items) {
    await item.close();
  }
  hasSlidingItemOpen.value = false;
};

// Check if any sliding item is open by looking for visible options
const hasOpenSlidingItem = (): boolean => {
  if (!libraryListEl.value) {
    const element = document.querySelector("#main-content ion-list");
    if (element) {
      const options = element.querySelectorAll("ion-item-options");
      for (const option of options) {
        const style = window.getComputedStyle(option);
        if (style.display !== "none" && style.visibility !== "hidden") {
          return true;
        }
      }
    }
    return false;
  }

  const domElement = libraryListEl.value.$el || libraryListEl.value;
  const options = domElement.querySelectorAll("ion-item-options");
  for (const option of options) {
    const style = window.getComputedStyle(option);
    if (style.display !== "none" && style.visibility !== "hidden") {
      return true;
    }
  }
  return false;
};

// ============= Event Handlers =============
const handleRefresh = async (event: CustomEvent) => {
  await refreshLibraries();
  (event.target as any).complete();
};

const handleItemClick = async (libraryId: string, event: Event) => {
  // Block navigation if any sliding item is open
  if (
    isClosingSlidingItem.value ||
    hasSlidingItemOpen.value ||
    hasOpenSlidingItem() ||
    (await getOpenItem())
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return;
  }

  // Navigate to library detail page
  try {
    const navController = getNavController();
    if (navController) {
      await navController.push(libraryComponent, { libraryId });
    }
  } catch (error) {
    console.error("Navigation failed:", error);
  }
};

const handleContentClick = async (event: Event) => {
  // Wait for DOM to be ready
  await nextTick();

  // Check if any sliding item is open
  const openItem = await getOpenItem();
  if (openItem) {
    isClosingSlidingItem.value = true;
    hasSlidingItemOpen.value = true;
    await openItem.close();
    hasSlidingItemOpen.value = false;
    setTimeout(() => {
      isClosingSlidingItem.value = false;
    }, 500);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return;
  }

  // Also check our reactive state
  if (hasSlidingItemOpen.value) {
    isClosingSlidingItem.value = true;
    await closeAllSlidingItems();
    setTimeout(() => {
      isClosingSlidingItem.value = false;
    }, 500);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return;
  }
};

const handleItemSliding = async (event: CustomEvent) => {
  const target = event.target as any;
  if (target && typeof target.getOpenAmount === "function") {
    const openAmount = await target.getOpenAmount();
    hasSlidingItemOpen.value = openAmount > 0;
  }
};

const handleDelete = (libraryId: string) => {
  libraries.value = libraries.value.filter((lib) => lib.id !== libraryId);
  hasSlidingItemOpen.value = false;
};
</script>

<style scoped>
.library-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --min-height: 72px;
}

.library-item ion-icon {
  font-size: 24px;
  margin-right: 16px;
}

ion-item-option {
  padding-inline: 18px;
  background-color: theme("colors.danger-red");
}

.delete-label {
  color: white;
}
</style>
