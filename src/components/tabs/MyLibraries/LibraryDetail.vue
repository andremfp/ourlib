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
          v-for="book in books"
          :key="book.id"
          @ionItemSliding="handleItemSliding"
          @click="handleContentClick"
        >
          <ion-item button class="book-item">
            <ion-label class="book-item-label">
              <h2>{{ book.title }}</h2>
              <p>{{ book.authors?.join(", ") || "Unknown Author" }}</p>
            </ion-label>
          </ion-item>

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
import { computed, ref, nextTick } from "vue";
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
const { handleSortChange } = useBookSort(books);

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
      const items = element.querySelectorAll("ion-item-sliding");
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

  if (bookListEl.value) {
    const domElement = bookListEl.value.$el || bookListEl.value;
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

.book-item-label {
  padding-left: 12px;
}
</style>
