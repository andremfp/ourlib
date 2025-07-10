<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonFooter,
  IonButton,
} from "@ionic/vue";
import BookForm from "./BookForm.vue";
import type { BookFormData } from "./composables/useAddBook";

interface Props {
  formData: BookFormData;
  thumbnailUrl: string;
  isFormValid: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  "update:formData": [formData: BookFormData];
  continue: [];
}>();

const handleFormDataUpdate = (newFormData: BookFormData) => {
  emit("update:formData", newFormData);
};

const handleContinue = () => {
  emit("continue");
};
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/add-book"></ion-back-button>
        </ion-buttons>
        <ion-title>Manual Entry</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div class="p-6">
        <BookForm
          :form-data="formData"
          :thumbnail-url="thumbnailUrl"
          :is-loading-book-details="false"
          @update:form-data="handleFormDataUpdate"
        />
      </div>
    </ion-content>
    <ion-footer>
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
