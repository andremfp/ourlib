<script setup lang="ts">
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
  <div class="flex-1 flex flex-col">
    <div class="flex-1 overflow-auto p-6">
      <BookForm
        :form-data="formData"
        :thumbnail-url="thumbnailUrl"
        :is-loading-book-details="false"
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
</template>
