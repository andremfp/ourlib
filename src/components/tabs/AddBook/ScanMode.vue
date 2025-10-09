<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import { IonContent, IonButton, IonIcon, modalController } from "@ionic/vue";
import { createOutline } from "ionicons/icons";
// Lazy-load heavy children
const CameraComponent = defineAsyncComponent(
  () => import("@/components/Camera.vue"),
);
const BookForm = defineAsyncComponent(() => import("./BookForm.vue"));
const ManualISBNInput = defineAsyncComponent(
  () => import("@/components/modals/ManualISBNInput.vue"),
);
import type { BookFormData } from "./composables/useAddBook";

interface Props {
  scannedISBN: string;
  isLoadingBookDetails: boolean;
  formData: BookFormData;
  thumbnailUrl: string;
  isFormValid: boolean;
  bookNotFound: boolean;
  errorState: { message: string } | null;
}

defineProps<Props>();

const emit = defineEmits<{
  "isbn-scanned": [isbn: string];
  "update:form-data": [formData: BookFormData];
  continue: [];
  cancel: [];
}>();

// Track whether we're showing the manual input modal
const isManualInputMode = ref(false);

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

const openManualISBNInput = async () => {
  // Stop the camera by unmounting it
  isManualInputMode.value = true;

  // Small delay to ensure camera is stopped
  await new Promise((resolve) => setTimeout(resolve, 100));

  const modal = await modalController.create({
    component: ManualISBNInput,
    cssClass: "generic-modal",
  });

  await modal.present();

  const { data, role } = await modal.onWillDismiss();

  if (role === "confirmed" && data) {
    // Emit the manually entered ISBN (camera stays off)
    handleISBNScanned(data);
  } else {
    // User canceled - restart the camera
    isManualInputMode.value = false;
  }
};
</script>

<template>
  <!-- Scanning Phase -->
  <div v-if="!scannedISBN" class="h-full flex flex-col">
    <!-- Camera (only shown when not in manual input mode) -->
    <div v-if="!isManualInputMode" class="flex-1 flex flex-col">
      <CameraComponent
        @isbn-scanned="handleISBNScanned"
        @cancel="handleCancel"
      />
    </div>

    <!-- Placeholder while modal is open -->
    <div
      v-else
      class="flex-1 flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg"
    >
      <div class="flex flex-col items-center space-y-4 py-8">
        <svg
          class="animate-spin h-12 w-12 text-menu-blue"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p
          class="text-lg font-medium text-light-secondary-text dark:text-dark-secondary-text"
        >
          Camera paused
        </p>
      </div>
    </div>

    <!-- Manual ISBN Input Button -->
    <div class="manual-input-section">
      <p class="manual-input-text">Can't scan the barcode?</p>
      <ion-button
        expand="block"
        fill="outline"
        @click="openManualISBNInput"
        class="manual-input-button"
        :disabled="isManualInputMode"
      >
        <ion-icon slot="start" :icon="createOutline"></ion-icon>
        Enter ISBN Manually
      </ion-button>
    </div>
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
          :error-state="errorState"
          @update:form-data="handleFormDataUpdate"
          @continue="handleContinue"
        />
      </div>
    </ion-content>
  </div>
</template>

<style scoped>
.manual-input-section {
  padding: 16px;
  background: var(--ion-background-color, #ffffff);
}

.manual-input-text {
  margin: 0 0 12px 0;
  text-align: center;
  font-size: 14px;
  color: var(--ion-text-color-step-400, #6b7280);
}

.manual-input-button {
  --border-radius: 12px;
  --border-width: 2px;
  font-weight: 500;
}
</style>
