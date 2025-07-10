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
  modalController,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonMenu,
  IonButtons,
  menuController,
} from "@ionic/vue";
import { add, trash } from "ionicons/icons";
import AddLibraryComponent from "@/components/modals/AddLibrary.vue";
import { useLibraryList } from "./composables/useLibraryList";
import { useActiveLibrary } from "./composables/useActiveLibrary";

// ============= State =============
const selectedLibraryId = ref<string | null>(null);

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

// ============= Methods =============
const handleRefresh = async (event: CustomEvent) => {
  await refreshLibraries();
  (event.target as any).complete();
};

const openAddLibraryModal = async () => {
  const modal = await modalController.create({
    component: AddLibraryComponent,
  });
  modal.present();

  const { role } = await modal.onWillDismiss();

  if (role === "created") {
    await refreshLibraries();
  }
};

const handleDelete = (libraryId: string) => {
  // NOTE: You'll need to add your API call to delete the library from the database here.
  console.log("Deleting library with ID:", libraryId);
  libraries.value = libraries.value.filter((lib) => lib.id !== libraryId);
};

const selectLibrary = (libraryId: string) => {
  selectedLibraryId.value = libraryId;
  menuController.open("library-menu");
};

watch(selectedLibraryId, (newId) => {
  if (newId) {
    fetchLibraryData(newId);
  }
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
        <ion-title>My Libraries</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openAddLibraryModal">
            <ion-icon :icon="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" :scroll-y="false">
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
      <ion-list v-else>
        <ion-item-sliding v-for="library in libraries" :key="library.id">
          <ion-item button @click="selectLibrary(library.id)">
            <ion-label>
              <h2>{{ library.name }}</h2>
              <p>{{ library.booksCount || 0 }} books</p>
            </ion-label>
          </ion-item>

          <ion-item-options slot="end">
            <ion-item-option color="danger" @click="handleDelete(library.id)">
              <ion-icon slot="icon-only" :icon="trash"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
    </ion-content>
  </ion-page>
</template>
