<script setup lang="ts">
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
  emit("cancel");
};
</script>

<template>
  <div class="flex-1 flex flex-col">
    <!-- Scanning Phase -->
    <div v-if="!scannedISBN" class="flex-1 flex flex-col">
      <div class="flex-1 flex justify-center">
        <CameraComponent
          @isbn-scanned="handleISBNScanned"
          @cancel="handleCancel"
        />
      </div>
    </div>

    <!-- Form Phase -->
    <div v-else class="flex-1 flex flex-col">
      <div
        class="pt-4 bg-light-card dark:bg-dark-card shadow-sm flex justify-center"
      >
        <h2
          class="text-xl font-semibold text-light-primary-text dark:text-dark-primary-text"
        >
          Scanned Book
        </h2>
      </div>
      <div class="flex justify-center">
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

      <!-- Continue Button -->
      <div
        class="p-6 bg-light-card dark:bg-dark-card border-t border-light-border dark:border-dark-border"
      >
        <button
          @click="handleContinue"
          :disabled="!isFormValid"
          class="w-full px-6 py-3 bg-menu-blue text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
</template>
