<template>
  <div class="wrapper">
    <h1>Edit Book</h1>

    <!-- Title (Required) -->
    <ion-input
      label="Title *"
      label-placement="stacked"
      v-model="formData.title"
      type="text"
      placeholder="Enter book title"
      fill="outline"
      mode="md"
    ></ion-input>

    <!-- Authors (Required) -->
    <ion-input
      label="Authors *"
      label-placement="stacked"
      v-model="formData.authors"
      type="text"
      placeholder="Enter authors (comma-separated)"
      helper-text="Separate multiple authors with commas"
      fill="outline"
      mode="md"
    ></ion-input>

    <!-- Publisher -->
    <ion-input
      label="Publisher"
      label-placement="stacked"
      v-model="formData.publisher"
      type="text"
      placeholder="Enter publisher"
      fill="outline"
      mode="md"
    ></ion-input>

    <!-- Language and Pages Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Language -->
      <ion-input
        label="Language"
        label-placement="stacked"
        v-model="formData.language"
        type="text"
        placeholder="e.g., English"
        fill="outline"
        mode="md"
      ></ion-input>

      <!-- Pages -->
      <ion-input
        label="Pages"
        label-placement="stacked"
        v-model="formData.pages"
        type="number"
        placeholder="Number of pages"
        fill="outline"
        mode="md"
      ></ion-input>
    </div>

    <!-- Publish Date -->
    <ion-input
      label="Published Date"
      label-placement="stacked"
      v-model="formData.publishDate"
      type="text"
      placeholder="e.g., 2023 or 2023-03-15"
      fill="outline"
      mode="md"
    ></ion-input>

    <div class="dialog-actions">
      <ion-button fill="clear" @click="handleCancel"> Cancel </ion-button>
      <ion-button @click="handleSave" :disabled="!isFormValid">
        Save
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { IonButton, IonInput, modalController } from "@ionic/vue";
import type { Book } from "@/schema";

const props = defineProps<{
  book: Book;
}>();

// Form data for book details
const formData = reactive({
  title: props.book.title || "",
  authors: props.book.authors?.join(", ") || "",
  language: props.book.language || "",
  pages: props.book.pages ?? undefined, // Use nullish coalescing to preserve `0`
  publisher: props.book.publisher || "",
  publishDate: props.book.publishDate || "",
});

// Form validation
const isFormValid = computed(() => {
  return formData.title.trim().length > 0 && formData.authors.trim().length > 0;
});

const handleCancel = () => {
  modalController.dismiss(null, "cancel");
};

const handleSave = () => {
  const { pages, ...restOfFormData } = formData;

  const updatedBookData: Partial<Book> = {
    ...restOfFormData,
    authors: formData.authors.split(",").map((author) => author.trim()),
  };

  // Handle pages separately to avoid sending `undefined` to Firestore.
  // Set to `null` if the input is empty to clear the field in the database.
  if (String(pages).trim() === "" || pages === null || pages === undefined) {
    updatedBookData.pages = null;
  } else {
    const pagesAsNumber = Number(pages);
    // Only include the field if it's a valid number.
    if (!isNaN(pagesAsNumber)) {
      updatedBookData.pages = pagesAsNumber;
    }
  }

  modalController.dismiss(updatedBookData, "edited");
};
</script>

<style scoped>
.wrapper {
  padding: 16px;
}

.wrapper h1 {
  margin: 0 0 16px;
  font-size: theme("fontSize.modal-title");
  font-weight: theme("fontWeight.bold");
}

.wrapper ion-input {
  --border-radius: 12px;
  margin-bottom: 8px; /* Add some space between inputs */
}

/* Custom styling for stacked labels */
.wrapper ion-input::part(label) {
  margin-bottom: 8px;
  font-size: theme("fontSize.sm");
  font-weight: theme("fontWeight.medium");
  color: theme("colors.light-primary-text");
}

.dark .wrapper ion-input::part(label) {
  color: theme("colors.dark-primary-text");
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 24px;
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
