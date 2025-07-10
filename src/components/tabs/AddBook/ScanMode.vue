<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButton,
} from "@ionic/vue";
import CameraComponent from "@/components/Camera.vue";
import BookForm from "./BookForm.vue";
import type { BookFormData } from "./composables/useAddBook";

interface Props {
  scannedISBN: string;
  isLoadingBookDetails: boolean;
  formData: BookFormData;
  thumbnailUrl: string;
  isFormValid: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  "isbn-scanned": [isbn: string];
  "update:formData": [formData: BookFormData];
  continue: [];
  cancel: [];
}>();

const handleISBNScanned = (isbn: string) => {
  emit("isbn-scanned", isbn);
};

const handleFormDataUpdate = (newFormData: BookFormData) => {
  emit("update:formData", newFormData);
};

const handleContinue = () => {
  emit("continue");
};

const handleCancel = () => {
  // In the new navigation model, cancel is just going back.
  // The back button in the header handles this automatically.
  // This function can be kept if there's other logic to run on cancel.
  emit("cancel");
};
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{
          scannedISBN ? "Scanned Book" : "Scan Barcode"
        }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <!-- Scanning Phase -->
      <div v-if="!scannedISBN" class="h-full flex flex-col">
        <CameraComponent
          @isbn-scanned="handleISBNScanned"
          @cancel="handleCancel"
        />
      </div>

      <!-- Form Phase -->
      <div v-else class="h-full flex flex-col">
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
    <ion-footer v-if="scannedISBN">
      <ion-toolbar>
        <ion-button
          @click="handleContinue"
          :disabled="!isFormValid"
          expand="block"
          class="ion-margin"
        >
          Continue
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>
