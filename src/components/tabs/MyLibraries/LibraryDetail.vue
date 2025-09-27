<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="" defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ libraryName }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openOptions">
            <ion-icon :icon="ellipsisHorizontal"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Sort Controls -->
      <SortControls
        type="books"
        :initial-sort-by="sortBy"
        :initial-sort-reverse="sortReverse"
        class="bg-light-nav-secondary dark:bg-dark-nav-secondary px-3"
        @sort-changed="handleSortControlsChange"
      /><!-- Sort Controls -->
    </ion-header>

    <ion-content @click="handleContentClick">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center h-full">
        <ion-spinner name="crescent"></ion-spinner>
        <span class="ml-2">Loading books...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center">
        <p class="text-red-500 mb-4">{{ error }}</p>
        <ion-button @click="fetchLibraryData(libraryId)">Try Again</ion-button>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="books.length === 0"
        class="flex flex-col items-center justify-center h-full p-4"
      >
        <ion-icon
          :icon="bookOutline"
          class="text-6xl text-gray-400 mb-4"
        ></ion-icon>
        <h2 class="text-xl font-semibold mb-2">No Books Yet</h2>
        <p class="text-gray-500 text-center mb-4">
          This library is empty. Add some books to get started!
        </p>
        <ion-button @click="goToAddBook">
          <ion-icon :icon="add" slot="start"></ion-icon>
          Add Book
        </ion-button>
      </div>

      <!-- Books List -->
      <ion-list v-else ref="bookListEl" @click="handleContentClick">
        <ion-item-sliding
          v-for="book in sortedBooks"
          :key="book.id"
          @ionItemSliding="handleItemSliding"
          @click="handleContentClick"
        >
          <ion-item
            button
            class="book-item"
            @click="handleBookClick(book.id, $event)"
          >
            <ion-thumbnail slot="start" class="book-thumb">
              <img
                v-if="book.thumbnailUrl"
                :src="book.thumbnailUrl"
                alt="Book cover"
                class="w-full h-full object-contain"
              />
              <div v-else class="thumb-placeholder">
                <ion-icon
                  :icon="bookOutline"
                  class="thumb-placeholder-icon"
                ></ion-icon>
              </div>
            </ion-thumbnail>
            <ion-label class="book-item-label">
              <h2>{{ book.title }}</h2>
              <p>{{ book.authors?.join(", ") || "Unknown Author" }}</p>
            </ion-label>
          </ion-item>

          <!-- Overlay divider to fill the left gap under the thumbnail -->
          <div class="thumb-gap-divider" aria-hidden="true"></div>

          <ion-item-options slot="end">
            <ion-item-option @click="handleDelete(book.id)">
              <ion-label>Delete</ion-label>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
    </ion-content>
    <!-- Options Menu -->
    <LibraryOptions
      :isOpen="isOptionsOpen"
      :libraryName="libraryName"
      @close="closeOptions"
      @closed="onOptionsClosed"
      @rename="handleRename"
      @delete="handleDeleteLibrary"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, markRaw, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
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
  IonButtons,
  IonBackButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonThumbnail,
  onIonViewWillLeave,
} from "@ionic/vue";
import { bookOutline, add, ellipsisHorizontal } from "ionicons/icons";
import { useActiveLibrary } from "./composables/useActiveLibrary";
import { useBookSort } from "./composables/useBookSort";
import SortControls from "@/components/SortControls.vue";
import LibraryOptions from "@/components/menus/LibraryOptions.vue";
import { SORT } from "@/constants/constants";
import { useTabStore } from "@/stores/tabStore";
import { deleteBook } from "@/apis/bookAPI";
import BookDetail from "./BookDetail.vue";

// ============= Props =============
const props = defineProps<{
  libraryId: string;
}>();

// ============= Computed Properties =============
const libraryId = computed(() => props.libraryId);

// ============= Composables =============
const router = useRouter();
const tabStore = useTabStore();
const {
  books,
  libraryName,
  isLoading,
  error,
  fetchLibraryData,
  handleLibraryRename,
  handleLibraryDelete,
} = useActiveLibrary(libraryId);

// Book sorting
const { sortedBooks, handleSortChange } = useBookSort(books);

// Local sort state for the SortControls component
const sortBy = ref(SORT.BY.TITLE);
const sortReverse = ref(SORT.DIRECTION.ASC);

// Handle sort changes from SortControls component
const handleSortControlsChange = (
  newSortBy: string,
  newSortReverse: boolean,
) => {
  // Create a custom event that matches what useBookSort expects
  const customEvent = new CustomEvent("sortChange", {
    detail: {
      sortBy: newSortBy,
      sortReverse: newSortReverse,
    },
  });
  handleSortChange(customEvent);
};

// ============= Event Handling for Local State Updates =============
const handleBookDeleted = (event: Event) => {
  const detail = (event as CustomEvent).detail;
  if (detail && detail.bookId) {
    const index = books.value.findIndex((b) => b.id === detail.bookId);
    if (index > -1) {
      books.value.splice(index, 1);
    }
  }
};

const handleBookUpdated = (event: Event) => {
  const detail = (event as CustomEvent).detail;
  if (detail && detail.bookId) {
    const index = books.value.findIndex((b) => b.id === detail.bookId);
    if (index > -1) {
      books.value[index] = { ...books.value[index], ...detail.updatedBook };
    }
  }
};

onMounted(() => {
  window.addEventListener("ourlib:bookDeleted", handleBookDeleted);
  window.addEventListener("ourlib:bookUpdated", handleBookUpdated);
});

onUnmounted(() => {
  window.removeEventListener("ourlib:bookDeleted", handleBookDeleted);
  window.removeEventListener("ourlib:bookUpdated", handleBookUpdated);
});

// ============= Navigation =============
const bookComponent = markRaw(BookDetail);

const getNavController = () => {
  const navElement = document.querySelector("ion-nav");
  return navElement;
};

const handleBookClick = async (bookId: string, event: Event) => {
  // Block navigation if any sliding item is open
  if (
    isClosingSlidingItem.value ||
    hasSlidingItemOpen.value ||
    (await getOpenItem())
  ) {
    event.preventDefault();
    event.stopPropagation();
    (event as any).stopImmediatePropagation?.();
    return;
  }

  // Navigate to book detail page
  try {
    const navController = getNavController();
    if (navController) {
      await navController.push(bookComponent, {
        bookId,
        libraryId: libraryId.value,
      });
    }
  } catch (error) {
    console.error("Navigation failed:", error);
  }
};

const goToAddBook = () => {
  // Update the store first
  tabStore.setActiveTab("Add Book");
  // Then navigate to the tabs page to trigger the tab switch
  router.push("/");
};

// ============= Sliding Item Management (mirrors LibraryList) =============
const bookListEl = ref<any>(null);
const hasSlidingItemOpen = ref(false);
const isClosingSlidingItem = ref(false);

const getOpenItem = async (): Promise<any | null> => {
  if (!bookListEl.value) {
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

  const domElement = bookListEl.value.$el || bookListEl.value;
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

  if (bookListEl.value) {
    const domElement = bookListEl.value.$el || bookListEl.value;
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

// intentionally omitted hasOpenSlidingItem helper (not needed here)

const handleContentClick = async (event: Event) => {
  await nextTick();

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
    (event as any).stopImmediatePropagation?.();
    return;
  }

  if (hasSlidingItemOpen.value) {
    isClosingSlidingItem.value = true;
    await closeAllSlidingItems();
    setTimeout(() => {
      isClosingSlidingItem.value = false;
    }, 500);
    event.preventDefault();
    event.stopPropagation();
    (event as any).stopImmediatePropagation?.();
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

const handleDelete = async (bookId: string) => {
  await deleteBook(bookId, libraryId.value);
  books.value = books.value.filter((b) => b.id !== bookId);
  hasSlidingItemOpen.value = false;
  // Inform list view to update counts immediately
  window.dispatchEvent(new CustomEvent("ourlib:refreshLibraries"));
};

// Notify parent list to refresh when leaving this view
onIonViewWillLeave(() => {
  window.dispatchEvent(new CustomEvent("ourlib:refreshLibraries"));
});

// ============= Options Menu Management =============
const isOptionsOpen = ref(false);
const openOptions = () => {
  isOptionsOpen.value = true;
};
const closeOptions = () => {
  // Parent requests close; child will emit `closed` after transition
};

const onOptionsClosed = () => {
  isOptionsOpen.value = false;
};

const handleRename = async (newName: string) => {
  await handleLibraryRename(newName);
  closeOptions();
};

const handleDeleteLibrary = async () => {
  const deleted = await handleLibraryDelete();
  closeOptions();
  if (deleted) {
    // Ensure list refreshes and navigate back
    window.dispatchEvent(new CustomEvent("ourlib:refreshLibraries"));
    const nav = document.querySelector("ion-nav");
    if (nav && typeof (nav as any).pop === "function") {
      (nav as any).pop();
    }
  }
};
</script>

<style scoped>
ion-item {
  --padding-start: 0;
}

ion-item-option {
  padding-inline: 18px;
  background-color: theme("colors.danger-red");
}

ion-item-sliding {
  position: relative;
}

.book-item {
  position: relative;
  --inner-padding-start: 0;
  --thumb-size: 60px;
  --min-height: calc(var(--thumb-size) + 24px);
  min-height: var(--min-height);
}

.book-item-label {
  padding-left: 2px;
}

.book-item-label h2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}

.book-item-label p {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-thumb {
  --size: var(--thumb-size);
  margin-right: 12px;
  margin-left: 12px;
  position: relative;
}

.book-thumb::after {
  display: none;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  background: var(--placeholder-bg);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-placeholder-icon {
  width: 32px;
  height: 32px;
  color: var(--ion-color-medium);
}

.thumb-gap-divider {
  position: absolute;
  left: 0;
  bottom: 0;
  width: calc(12px + var(--thumb-size, 60px) + 12px);
  height: var(--inner-border-width, 0.55px);
  background: var(--ion-item-border-color, var(--ion-border-color));
  pointer-events: none;
  z-index: 2;
}
</style>
