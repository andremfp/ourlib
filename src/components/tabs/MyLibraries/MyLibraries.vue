<script setup lang="ts">
import { ref, watch } from "vue";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonMenu,
  IonButtons,
  menuController,
  modalController,
} from "@ionic/vue";
import { add } from "ionicons/icons";
import { useLibraryList } from "./composables/useLibraryList";
import { useActiveLibrary } from "./composables/useActiveLibrary";
import { useTabStore } from "@/stores/tabStore";
import AddLibraryComponent from "@/components/modals/AddLibrary.vue";

// ============= State =============
const selectedLibraryId = ref<string | null>(null);
const libraryListEl = ref<any>(null);

// ============= Composables =============
const { libraries, isLoading, isRefreshing, error, refreshLibraries } =
  useLibraryList();

const {
  books,
  libraryName,
  isLoading: isLoadingActiveLibrary,
  error: activeLibraryError,
  fetchLibraryData,
} = useActiveLibrary(selectedLibraryId);

const tabStore = useTabStore();

// ============= Methods =============
const getOpenItem = async (): Promise<any | null> => {
  if (!libraryListEl.value || !libraryListEl.value.querySelectorAll) {
    return null;
  }

  const items = libraryListEl.value.querySelectorAll("ion-item-sliding");
  if (!items) return null;

  for (const item of items) {
    if ((await item.getOpenAmount()) > 0) {
      return item;
    }
  }
  return null;
};

const closeAllSlidingItems = async () => {
  if (!libraryListEl.value || !libraryListEl.value.querySelectorAll) {
    console.log("libraryListEl not ready yet");
    return;
  }

  const items = libraryListEl.value.querySelectorAll("ion-item-sliding");
  if (!items) return;

  for (const item of items) {
    await item.close();
  }
};

const handleRefresh = async (event: CustomEvent) => {
  await refreshLibraries();
  (event.target as any).complete();
};

const handleDelete = (libraryId: string) => {
  // NOTE: You'll need to add your API call to delete the library from the database here.
  console.log("Deleting library with ID:", libraryId);
  libraries.value = libraries.value.filter((lib) => lib.id !== libraryId);
};

const selectLibrary = async (libraryId: string, event: Event) => {
  console.log("selectLibrary called", libraryId);

  // Check if any sliding item is open
  const openItem = await getOpenItem();
  if (openItem) {
    console.log("sliding item is open, closing it");
    // If a sliding item is open, just close it and don't select the library
    await openItem.close();
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  console.log("opening library menu");
  // Only proceed with library selection if no sliding item is open
  selectedLibraryId.value = libraryId;
  menuController.open("library-menu");
};

const presentAddLibraryModal = async (event: MouseEvent) => {
  // Blur the button that triggered the modal to prevent accessibility issues.
  if (event.currentTarget) {
    (event.currentTarget as HTMLElement).blur();
  }

  const modal = await modalController.create({
    component: AddLibraryComponent,
    cssClass: "add-library-modal",
  });
  await modal.present();
  const { role } = await modal.onDidDismiss();
  if (role === "created") {
    await refreshLibraries();
  }
};

watch(selectedLibraryId, (newId) => {
  if (newId) {
    fetchLibraryData(newId);
  }
});

// Expose refreshLibraries method for parent component
defineExpose({
  refreshLibraries,
});
</script>

<template>
  <ion-menu menu-id="library-menu" content-id="main-content" side="end">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ libraryName || "Library" }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="menuController.close('library-menu')"
            >Close</ion-button
          >
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :scroll-y="false">
      <div v-if="isLoadingActiveLibrary" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
      </div>
      <div v-else-if="activeLibraryError" class="ion-text-center ion-padding">
        <p>{{ activeLibraryError }}</p>
      </div>
      <ion-list v-else>
        <ion-item v-for="book in books" :key="book.id">
          <ion-label>
            <h2>{{ book.title }}</h2>
            <p>{{ book.authors.join(", ") }}</p>
          </ion-label>
        </ion-item>
        <ion-item v-if="books.length === 0">
          <ion-label class="ion-text-center"
            >This library has no books yet.</ion-label
          >
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-menu>

  <ion-page id="main-content">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ tabStore.activeTab }}</ion-title>
        <ion-buttons slot="start">
          <ion-button @click="presentAddLibraryModal($event)">
            <ion-icon :icon="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content
      :fullscreen="true"
      :scroll-y="false"
      @click="closeAllSlidingItems"
    >
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Initial loading state -->
      <div
        v-if="isLoading && libraries.length === 0"
        class="h-full flex justify-center items-center"
      >
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="h-full flex flex-col items-center justify-center py-12 px-4"
      >
        <p class="text-red-600 dark:text-red-400 text-center mb-4">
          {{ error }}
        </p>
        <ion-button
          @click="() => refreshLibraries()"
          :disabled="isLoading || isRefreshing"
        >
          Try Again
        </ion-button>
      </div>

      <!-- Libraries List -->
      <ion-list v-else ref="libraryListEl">
        <ion-item-sliding v-for="library in libraries" :key="library.id">
          <ion-item button @click="selectLibrary(library.id, $event)">
            <ion-label class="library-item-label">
              <h2>{{ library.name }}</h2>
              <p>{{ library.booksCount || 0 }} books</p>
            </ion-label>
          </ion-item>

          <ion-item-options slot="end">
            <ion-item-option @click="handleDelete(library.id)">
              <ion-label class="delete-label">Delete</ion-label>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<style scoped>
ion-item {
  --padding-start: 0;
}

ion-item-option {
  padding-inline: 18px;
  background-color: theme("colors.danger-red");
}

.library-item-label {
  padding-left: 12px;
}
</style>
