<script setup lang="ts">
import { IonContent } from "@ionic/vue";
import BookForm from "./BookForm.vue";
import type { BookFormData } from "./composables/useAddBook";

interface Props {
  formData: BookFormData;
  thumbnailUrl: string;
  isFormValid: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  "update:form-data": [formData: BookFormData];
  continue: [];
}>();

const handleFormDataUpdate = (newFormData: BookFormData) => {
  emit("update:form-data", newFormData);
};

const handleContinue = () => {
  emit("continue");
};
</script>

<template>
  <div class="h-full flex flex-col">
    <ion-content class="flex-1">
      <div>
        <BookForm
          :form-data="formData"
          :thumbnail-url="thumbnailUrl"
          :is-loading-book-details="false"
          :is-form-valid="isFormValid"
          :show-continue-button="true"
          :book-not-found="false"
          @update:form-data="handleFormDataUpdate"
          @continue="handleContinue"
        />
      </div>
    </ion-content>
  </div>
</template>
