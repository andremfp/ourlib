<script setup lang="ts">
import { IonContent } from "@ionic/vue";
import CameraComponent from "@/components/Camera.vue";
import BookForm from "./BookForm.vue";
import type { BookFormData } from "./composables/useAddBook";

interface Props {
  scannedISBN: string;
  isLoadingBookDetails: boolean;
  formData: BookFormData;
  thumbnailUrl: string;
  isFormValid: boolean;
  bookNotFound: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  "isbn-scanned": [isbn: string];
  "update:form-data": [formData: BookFormData];
  continue: [];
  cancel: [];
}>();

const handleISBNScanned = (isbn: string) => {
  emit("isbn-scanned", isbn);
};

const handleFormDataUpdate = (newFormData: BookFormData) => {
  emit("update:form-data", newFormData);
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
  <!-- Scanning Phase -->
  <div v-if="!scannedISBN" class="h-full flex flex-col">
    <CameraComponent @isbn-scanned="handleISBNScanned" @cancel="handleCancel" />
  </div>

  <!-- Form Phase -->
  <div v-else class="h-full flex flex-col">
    <ion-content class="flex-1">
      <div>
        <BookForm
          :form-data="formData"
          :thumbnail-url="thumbnailUrl"
          :is-loading-book-details="isLoadingBookDetails"
          :scanned-i-s-b-n="scannedISBN"
          :is-form-valid="isFormValid"
          :book-not-found="bookNotFound"
          @update:form-data="handleFormDataUpdate"
          @continue="handleContinue"
        />
      </div>
    </ion-content>
  </div>
</template>
