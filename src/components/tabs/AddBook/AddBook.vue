<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton,
  IonButtons,
} from "@ionic/vue";
import { cameraOutline, createOutline, arrowBackOutline } from "ionicons/icons";
import ScanMode from "./ScanMode.vue";
import ManualMode from "./ManualMode.vue";
import { useAddBook } from "./composables/useAddBook";
import { useTabStore } from "@/stores/tabStore";

const {
  mode,
  scannedISBN,
  isLoadingBookDetails,
  formData,
  isFormValid,
  thumbnailUrl,
  bookNotFound,
  startScanning,
  startManual,
  goBack,
  handleISBN,
  proceedToLibrarySelection,
} = useAddBook();

const tabStore = useTabStore();

const go_to_scan = () => {
  startScanning();
};

const go_to_manual = () => {
  startManual();
};

const go_back_to_main = () => {
  goBack();
};

const handleFormDataUpdate = (newFormData: any) => {
  Object.assign(formData, newFormData);
};

const handleContinue = () => {
  proceedToLibrarySelection();
};
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ tabStore.activeTab }}</ion-title>

        <ion-buttons slot="start" v-if="mode !== 'selection'">
          <ion-button @click="go_back_to_main">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" :scroll-y="false">
      <!-- Main Add Book View -->
      <div
        v-if="mode === 'selection'"
        class="flex flex-col h-full justify-center"
      >
        <ion-card
          button
          @click="go_to_scan"
          class="flex-1 flex flex-col justify-center items-center"
        >
          <ion-card-header class="text-center">
            <ion-icon
              :icon="cameraOutline"
              class="text-6xl text-menu-blue mx-auto mt-4"
            ></ion-icon>
            <ion-card-title class="mt-4 text-2xl">Scan Barcode</ion-card-title>
          </ion-card-header>
          <ion-card-content class="text-center">
            Use your camera to scan the book's barcode
          </ion-card-content>
        </ion-card>

        <ion-card
          button
          @click="go_to_manual"
          class="flex-1 flex flex-col justify-center items-center mt-2"
        >
          <ion-card-header class="text-center">
            <ion-icon
              :icon="createOutline"
              class="text-6xl text-menu-blue mx-auto mt-4"
            ></ion-icon>
            <ion-card-title class="text-2xl">Manual Entry</ion-card-title>
          </ion-card-header>
          <ion-card-content class="text-center">
            Enter book details manually
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Scan Mode (handles both scanning and form phases) -->
      <ScanMode
        v-else-if="mode === 'scan' || mode === 'form'"
        :scanned-i-s-b-n="scannedISBN"
        :is-loading-book-details="isLoadingBookDetails"
        :form-data="formData"
        :thumbnail-url="thumbnailUrl"
        :is-form-valid="isFormValid"
        :book-not-found="bookNotFound"
        @isbn-scanned="handleISBN"
        @update:form-data="handleFormDataUpdate"
        @continue="handleContinue"
        @cancel="go_back_to_main"
      />

      <!-- Manual Mode -->
      <ManualMode
        v-else-if="mode === 'manual'"
        :form-data="formData"
        :thumbnail-url="thumbnailUrl"
        :is-form-valid="isFormValid"
        @update:form-data="handleFormDataUpdate"
        @continue="handleContinue"
      />
    </ion-content>
  </ion-page>
</template>
