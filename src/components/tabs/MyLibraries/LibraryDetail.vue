<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button>
          <ion-back-button text=""></ion-back-button>
        </ion-button>
      </ion-buttons>
      <ion-title>{{ libraryName }}</ion-title>
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

  <ion-content>
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
      <ion-button>
        <ion-icon :icon="add" slot="start"></ion-icon>
        Add Book
      </ion-button>
    </div>

    <!-- Books List -->
    <ion-list v-else>
      <ion-item v-for="book in books" :key="book.id" class="book-item">
        <ion-label>
          <h2>{{ book.title }}</h2>
          <p>{{ book.authors?.join(", ") || "Unknown Author" }}</p>
        </ion-label>
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
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
  IonButtons,
  IonBackButton,
} from "@ionic/vue";
import { bookOutline, add } from "ionicons/icons";
import { useActiveLibrary } from "./composables/useActiveLibrary";
import { useBookSort } from "./composables/useBookSort";
import SortControls from "@/components/SortControls.vue";
import { SORT } from "@/constants/constants";

// ============= Props =============
const props = defineProps<{
  libraryId: string;
}>();

// ============= Computed Properties =============
const libraryId = computed(() => props.libraryId);

// ============= Composables =============
const { books, libraryName, isLoading, error, fetchLibraryData } =
  useActiveLibrary(libraryId);

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
</script>

<style scoped>
.book-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --min-height: 72px;
}

.book-item ion-icon {
  font-size: 24px;
  margin-right: 16px;
}
</style>
