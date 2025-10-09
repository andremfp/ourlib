<script setup lang="ts">
import { ref, onMounted } from "vue";
import { IonInput, IonButton, modalController } from "@ionic/vue";

const isbn = ref("");
const errorMessage = ref("");
const isSubmitting = ref(false);
const isbnInput = ref<InstanceType<typeof IonInput> | null>(null);

const isValidISBN = (code: string): boolean => {
  const cleanCode = code.replace(/[-\s]/g, "");
  return /^(\d{10}|\d{13})$/.test(cleanCode);
};

async function handleSubmit() {
  const trimmedISBN = isbn.value.trim();

  if (!trimmedISBN) {
    errorMessage.value = "ISBN is required";
    return;
  }

  if (!isValidISBN(trimmedISBN)) {
    errorMessage.value = "Invalid ISBN. Must be 10 or 13 digits";
    return;
  }

  try {
    isSubmitting.value = true;
    errorMessage.value = "";

    // Clean the ISBN (remove any dashes or spaces)
    const cleanISBN = trimmedISBN.replace(/[-\s]/g, "");

    // Dismiss modal with the ISBN
    modalController.dismiss(cleanISBN, "confirmed");
  } catch (error) {
    errorMessage.value = "An error occurred. Please try again.";
    console.error("Error processing ISBN:", error);
  } finally {
    isSubmitting.value = false;
  }
}

function cancel() {
  modalController.dismiss(null, "cancel");
}

// Focus management for accessibility
onMounted(() => {
  // Add keyboard event listener for Escape key
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      cancel();
    }
  };

  document.addEventListener("keydown", handleKeydown);

  // Focus the input after a short delay to allow for the modal transition.
  // This prevents an accessibility warning about focus being on a hidden element.
  setTimeout(() => {
    isbnInput.value?.$el.setFocus();
  }, 300);

  // Cleanup on unmount
  return () => {
    document.removeEventListener("keydown", handleKeydown);
  };
});
</script>

<template>
  <div class="wrapper">
    <h1>Enter ISBN Manually</h1>
    <p class="subtitle">
      Enter the book's ISBN barcode number (10 or 13 digits)
    </p>

    <ion-input
      ref="isbnInput"
      :clear-input="true"
      v-model="isbn"
      placeholder="e.g., 9780547928227"
      @keyup.enter="handleSubmit"
      aria-describedby="isbn-error"
      fill="outline"
      mode="md"
      type="text"
      inputmode="numeric"
      :maxlength="17"
    ></ion-input>

    <p v-if="errorMessage" id="isbn-error" class="error-message" role="alert">
      {{ errorMessage }}
    </p>

    <div class="dialog-actions">
      <ion-button fill="clear" @click="cancel" :disabled="isSubmitting">
        Cancel
      </ion-button>
      <ion-button
        @click="handleSubmit"
        :disabled="isSubmitting || !isbn.trim()"
      >
        <span v-if="isSubmitting">Processing...</span>
        <span v-else>Confirm</span>
      </ion-button>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  padding: 16px;
}

.wrapper h1 {
  margin: 0 0 8px;
  font-size: theme("fontSize.modal-title");
  font-weight: theme("fontWeight.bold");
}

.subtitle {
  margin: 0 0 16px;
  font-size: theme("fontSize.modal-text");
  color: theme("colors.light-secondary-text");
}

.wrapper ion-input {
  --border-radius: 12px;
  padding-left: 0px;
}

.error-message {
  margin: 0;
  padding: 0 4px;
  font-size: theme("fontSize.modal-text");
  color: theme("colors.danger-red");
  min-height: 28px; /* Reserve space to prevent layout shift */
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

.dialog-actions ion-button {
  margin: 0;
  height: 44px; /* Standard iOS tap size */
  --border-radius: 8px;
  font-weight: 500;
  min-width: 90px;
  text-transform: none; /* iOS buttons don't use all-caps */
}
</style>
