<script setup lang="ts">
import { IonPage, IonContent } from "@ionic/vue";
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
    <ion-content>
      <div class="p-6">
        <BookForm
          :form-data="formData"
          :thumbnail-url="thumbnailUrl"
          :is-loading-book-details="false"
          :is-form-valid="isFormValid"
          :show-continue-button="true"
          @update:form-data="handleFormDataUpdate"
          @continue="handleContinue"
        />
      </div>
    </ion-content>
  </ion-page>
</template>
