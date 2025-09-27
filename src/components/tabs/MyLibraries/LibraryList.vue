<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="presentAddLibraryModal">
            <ion-icon :icon="add"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>My Libraries</ion-title>
      </ion-toolbar>

      <!-- Sort Controls -->
      <SortControls
        type="libraries"
        :initial-sort-by="sortBy"
        :initial-sort-reverse="sortReverse"
        class="bg-light-nav-secondary dark:bg-dark-nav-secondary px-3"
        @sort-changed="handleSortControlsChange"
      />
    </ion-header>

    <ion-content
      style="--background: var(--ion-background-color)"
      @click="handleContentClick"
    >
      <ion-refresher slot="fixed" @ion-refresh="handleRefresh">
        <ion-refresher-content
          :pulling-icon="arrowDownOutline"
          pulling-text="Pull to refresh"
          refreshing-text="Refreshing..."
          refreshing-spinner="circular"
          release-to-refresh-text="Release to refresh"
        >
        </ion-refresher-content>
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
        <ion-icon
          :icon="library"
          class="text-6xl text-gray-400 mb-4"
        ></ion-icon>
        <h2 class="text-xl font-semibold mb-2">No Libraries Yet</h2>
        <p class="text-gray-500 text-center mb-4">
          Create your first library to start organizing your books
        </p>
      </div>

      <!-- Libraries List -->
      <ion-list v-else ref="libraryListEl" @click="handleContentClick">
        <ion-item-sliding
          v-for="lib in libraries"
          :key="lib.id"
          @ionItemSliding="handleItemSliding"
          @click="handleContentClick"
        >
          <ion-item
            button
            class="library-item"
            @click="handleItemClick(lib.id, $event)"
          >
            <ion-thumbnail slot="start" class="library-thumb">
              <template v-if="lib.thumbnails && lib.thumbnails.length">
                <div class="library-stack">
                  <template
                    v-for="(src, idx) in lib.thumbnails.slice(0, 3)"
                    :key="idx"
                  >
                    <img
                      v-if="src"
                      :src="src"
                      alt="Cover"
                      class="stack-img"
                      :class="`pos-${idx}`"
                    />
                    <div v-else class="stack-placeholder" :class="`pos-${idx}`">
                      <ion-icon
                        :icon="bookOutline"
                        class="stack-placeholder-icon"
                      ></ion-icon>
                    </div>
                  </template>
                </div>
              </template>
              <template v-else>
                <div class="library-empty">
                  <ion-icon :icon="library" class="empty-icon"></ion-icon>
                </div>
              </template>
            </ion-thumbnail>
            <ion-label class="library-item-label">
              <h2>{{ lib.name }}</h2>
              <p>{{ lib.booksCount || 0 }} books</p>
            </ion-label>
          </ion-item>

          <!-- Overlay divider to fill the left gap under the thumbnail -->
          <div class="library-thumb-gap-divider" aria-hidden="true"></div>

          <ion-item-options slot="end">
            <ion-item-option @click="handleDelete(lib.id)">
              <ion-label>Delete</ion-label>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import {
  IonPage,
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
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButtons,
  IonThumbnail,
  modalController,
  onIonViewWillEnter,
  onIonViewDidEnter,
} from "@ionic/vue";
import { add, library, arrowDownOutline, bookOutline } from "ionicons/icons";
import { useLibraryList } from "./composables/useLibraryList";
import { useLibrarySort } from "./composables/useLibrarySort";
import { markRaw } from "vue";
import LibraryDetail from "./LibraryDetail.vue";
import AddLibraryComponent from "@/components/modals/AddLibrary.vue";
import SortControls from "@/components/SortControls.vue";
import { SORT } from "@/constants/constants";
import { deleteLibrary } from "@/apis/libraryAPI";

// ============= State =============
const libraryListEl = ref<any>(null);
const hasSlidingItemOpen = ref(false);
const isClosingSlidingItem = ref(false);

// ============= Composables =============
const { libraries, isLoading, isRefreshing, error, refreshLibraries } =
  useLibraryList();

// Create a ref for drawer state (we'll set it to false since we're not using the drawer in this view)
const isDrawerOpen = ref(false);
const { handleSortChange } = useLibrarySort(libraries, isDrawerOpen);

// Local sort state for the SortControls component
const sortBy = ref(SORT.BY.NAME);
const sortReverse = ref(SORT.DIRECTION.ASC);

// Handle sort changes from SortControls component
const handleSortControlsChange = (
  newSortBy: string,
  newSortReverse: boolean,
) => {
  // Create a custom event that matches what useLibrarySort expects
  const customEvent = new CustomEvent("sortChange", {
    detail: {
      sortBy: newSortBy,
      sortReverse: newSortReverse,
    },
  });
  handleSortChange(customEvent);
};

// ============= Computed Properties =============
const hasLibraries = computed(() => libraries.value.length > 0);
const showEmptyState = computed(() => !isLoading.value && !hasLibraries.value);

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
      const items = Array.from(
        element.querySelectorAll("ion-item-sliding"),
      ) as any[];
      for (const item of items) {
        const openAmount = await (item as any).getOpenAmount();
        if (openAmount > 0) {
          return item;
        }
      }
    }
    return null;
  }

  const domElement = libraryListEl.value.$el || libraryListEl.value;
  const items = Array.from(
    domElement.querySelectorAll("ion-item-sliding"),
  ) as any[];

  for (const item of items) {
    const openAmount = await (item as any).getOpenAmount();
    if (openAmount > 0) {
      return item;
    }
  }
  return null;
};

const closeAllSlidingItems = async () => {
  let items: any[] | null = null;

  if (libraryListEl.value) {
    const domElement = libraryListEl.value.$el || libraryListEl.value;
    if (domElement && domElement.querySelectorAll) {
      items = Array.from(
        domElement.querySelectorAll("ion-item-sliding"),
      ) as any[];
    }
  }

  if (!items) {
    const element = document.querySelector("#main-content ion-list");
    if (element) {
      items = Array.from(element.querySelectorAll("ion-item-sliding")) as any[];
    }
  }

  if (!items) return;

  for (const item of items) {
    await (item as any).close();
  }
  hasSlidingItemOpen.value = false;
};

// Check if any sliding item is open by looking for visible options
const hasOpenSlidingItem = (): boolean => {
  if (!libraryListEl.value) {
    const element = document.querySelector("#main-content ion-list");
    if (element) {
      const options = Array.from(
        element.querySelectorAll("ion-item-options"),
      ) as HTMLElement[];
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
  const options = Array.from(
    domElement.querySelectorAll("ion-item-options"),
  ) as HTMLElement[];
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

const handleDelete = async (libraryId: string) => {
  await deleteLibrary(libraryId);
  libraries.value = libraries.value.filter((lib) => lib.id !== libraryId);
  hasSlidingItemOpen.value = false;
};

// ============= Modal Management =============
const presentAddLibraryModal = async () => {
  const modal = await modalController.create({
    component: AddLibraryComponent,
    cssClass: "generic-modal",
  });
  await modal.present();
  const { role } = await modal.onDidDismiss();
  if (role === "created") {
    await refreshLibraries();
  }
};

// Refresh libraries whenever this view is (re)entered
onIonViewWillEnter(async () => {
  await refreshLibraries(true);
});

onIonViewDidEnter(async () => {
  await refreshLibraries(true);
});

// Also listen to a custom event fired by detail view when leaving
const handleExternalRefresh = async () => {
  await refreshLibraries(true);
};

onMounted(() => {
  window.addEventListener("ourlib:refreshLibraries", handleExternalRefresh);
});

onBeforeUnmount(() => {
  window.removeEventListener("ourlib:refreshLibraries", handleExternalRefresh);
});
</script>

<style scoped>
ion-item {
  --padding-start: 0;
}

ion-item-option {
  padding-inline: 18px;
  background-color: theme("colors.danger-red");
}

.library-item {
  --inner-padding-start: 0;
  --thumb-size: 64px;
  --min-height: calc(var(--thumb-size) + 24px);
  min-height: var(--min-height);
}

.library-item-label {
  padding-left: 12px;
}

.library-thumb {
  --size: var(--thumb-size);
  margin-left: 14px;
  margin-right: 14px;
  position: relative;
}

.library-thumb::after {
  content: "";
  position: absolute;
  left: -14px;
  right: -14px;
  bottom: 0;
  height: var(--inner-border-width, 0.55px);
  background: var(--ion-item-border-color, var(--ion-border-color));
  pointer-events: none;
}

.library-stack {
  position: relative;
  width: 100%;
  height: 100%;
}

.stack-img {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 60px;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.stack-placeholder {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 54px;
  width: 40px;
  height: 60px;
  background: var(--placeholder-bg);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.stack-placeholder-icon {
  color: var(--ion-color-medium);
  width: 26px;
  height: 26px;
}

.stack-img.pos-0,
.stack-placeholder.pos-0 {
  left: 0;
  z-index: 3;
}
.stack-img.pos-1,
.stack-placeholder.pos-1 {
  left: 20px;
  z-index: 2;
}
.stack-img.pos-2,
.stack-placeholder.pos-2 {
  left: 38px;
  z-index: 1;
}

.library-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: 8px;
  margin-left: 6px;
}

.library-empty .empty-icon {
  font-size: 46px;
  color: var(--ion-color-medium);
}

.library-thumb-gap-divider {
  position: absolute;
  left: 0;
  bottom: 0;
  width: calc(14px + var(--thumb-size, 64px) + 14px);
  height: var(--inner-border-width, 0.55px);
  background: var(--ion-item-border-color, var(--ion-border-color));
  pointer-events: none;
  z-index: 2;
}
</style>
