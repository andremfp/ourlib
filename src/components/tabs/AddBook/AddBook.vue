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
import BookForm from "./BookForm.vue";
import { useAddBook } from "./composables/useAddBook";

const {
  mode,
  scannedISBN,
  isLoadingBookDetails,
  formData,
  isFormValid,
  thumbnailUrl,
  startScanning,
  startManual,
  goBack,
  handleISBN,
  proceedToLibrarySelection,
} = useAddBook();

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
        <ion-title v-if="mode === 'selection'">Add Book</ion-title>
        <ion-title v-else-if="mode === 'scan'">Scan Barcode</ion-title>
        <ion-title v-else-if="mode === 'manual'">Manual Entry</ion-title>
        <ion-title v-else-if="mode === 'form'">Book Details</ion-title>
        <ion-buttons slot="start" v-if="mode !== 'selection'">
          <ion-button @click="go_back_to_main">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
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
              class="text-6xl text-blue-500"
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
          class="flex-1 flex flex-col justify-center items-center mt-4"
        >
          <ion-card-header class="text-center">
            <ion-icon
              :icon="createOutline"
              class="text-6xl text-blue-500"
            ></ion-icon>
            <ion-card-title class="mt-4 text-2xl">Manual Entry</ion-card-title>
          </ion-card-header>
          <ion-card-content class="text-center">
            Enter book details manually
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Scan Mode -->
      <ScanMode
        v-else-if="mode === 'scan'"
        :scanned-i-s-b-n="scannedISBN"
        :is-loading-book-details="isLoadingBookDetails"
        :form-data="formData"
        :thumbnail-url="thumbnailUrl"
        :is-form-valid="isFormValid"
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

      <!-- Form Mode (after scanning) -->
      <div v-else-if="mode === 'form'" class="h-full flex flex-col">
        <div class="ion-padding-horizontal ion-padding-top text-center">
          <p
            class="text-sm text-light-secondary-text dark:text-dark-secondary-text"
          >
            ISBN: {{ scannedISBN }}
          </p>
        </div>

        <div class="flex-1 overflow-auto p-6">
          <BookForm
            :form-data="formData"
            :thumbnail-url="thumbnailUrl"
            :is-loading-book-details="isLoadingBookDetails"
            :scanned-i-s-b-n="scannedISBN"
            @update:form-data="handleFormDataUpdate"
          />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
