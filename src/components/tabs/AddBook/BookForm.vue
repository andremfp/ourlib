<script setup lang="ts">
import { IonButton, IonIcon } from "@ionic/vue";
import { bookOutline, alertCircleOutline } from "ionicons/icons";
import type { BookFormData } from "./composables/useAddBook";

interface Props {
  formData: BookFormData;
  thumbnailUrl: string;
  isLoadingBookDetails: boolean;
  scannedISBN?: string;
  isFormValid: boolean;
  showContinueButton?: boolean;
  bookNotFound: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:formData": [formData: BookFormData];
  continue: [];
}>();

// Update form data reactively
const updateFormData = <K extends keyof BookFormData>(
  field: K,
  value: BookFormData[K],
) => {
  const updatedData = { ...props.formData };
  updatedData[field] = value;
  emit("update:formData", updatedData);
};
</script>

<template>
  <div class="p-4">
    <!-- Loading State for Scanned Books -->
    <div
      v-if="isLoadingBookDetails"
      class="fixed inset-0 flex justify-center items-center z-50"
    >
      <div class="flex items-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-menu-blue border-t-transparent"
        ></div>
        <span
          class="ml-3 text-light-secondary-text dark:text-dark-secondary-text"
        >
          Fetching book details...
        </span>
      </div>
    </div>

    <!-- Book Not Found Message -->
    <div
      v-if="bookNotFound && !isLoadingBookDetails"
      class="fixed inset-0 flex items-center justify-center z-50 px-4"
    >
      <div class="text-center">
        <div class="mb-4">
          <ion-icon
            :icon="alertCircleOutline"
            class="w-16 h-16 text-orange-500 mx-auto"
          ></ion-icon>
        </div>
        <h3
          class="text-lg font-medium text-light-primary-text dark:text-dark-primary-text mb-2"
        >
          Book Not Found
        </h3>
        <p class="text-light-secondary-text dark:text-dark-secondary-text mb-4">
          We couldn't find details for ISBN: {{ scannedISBN }}
        </p>
        <p
          class="text-sm text-light-secondary-text dark:text-dark-secondary-text"
        >
          You can still add the book manually by filling out the form below.
        </p>
      </div>
    </div>

    <!-- Book Form -->
    <div v-if="!isLoadingBookDetails && !bookNotFound">
      <!-- Book Thumbnail -->
      <div class="flex justify-center mb-6">
        <div
          class="w-32 h-48 bg-light-border dark:bg-dark-border rounded-lg flex items-center justify-center overflow-hidden"
        >
          <img
            v-if="thumbnailUrl"
            :src="thumbnailUrl"
            alt="Book Thumbnail"
            class="w-full h-full object-cover"
          />
          <ion-icon
            v-else
            :icon="bookOutline"
            class="w-16 h-16 text-light-secondary-text dark:text-dark-secondary-text"
          ></ion-icon>
        </div>
      </div>

      <div class="text-center">
        <p
          class="text-sm text-light-secondary-text dark:text-dark-secondary-text"
        >
          ISBN: {{ scannedISBN }}
        </p>
      </div>

      <!-- Form Fields -->
      <div class="space-y-4">
        <!-- Title (Required) -->
        <div>
          <label
            class="block text-sm font-medium text-light-primary-text dark:text-dark-primary-text mb-2"
          >
            Title *
          </label>
          <input
            :value="formData.title"
            @input="
              updateFormData('title', ($event.target as HTMLInputElement).value)
            "
            type="text"
            class="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-menu-blue focus:border-transparent text-light-primary-text dark:text-dark-primary-text"
            placeholder="Enter book title"
          />
        </div>

        <!-- Authors (Required) -->
        <div>
          <label
            class="block text-sm font-medium text-light-primary-text dark:text-dark-primary-text mb-2"
          >
            Authors *
          </label>
          <input
            :value="formData.authors"
            @input="
              updateFormData(
                'authors',
                ($event.target as HTMLInputElement).value,
              )
            "
            type="text"
            class="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-menu-blue focus:border-transparent text-light-primary-text dark:text-dark-primary-text"
            placeholder="Enter authors (comma-separated)"
          />
          <p
            class="text-xs text-light-secondary-text dark:text-dark-secondary-text mt-1"
          >
            Separate multiple authors with commas
          </p>
        </div>

        <!-- Publisher -->
        <div>
          <label
            class="block text-sm font-medium text-light-primary-text dark:text-dark-primary-text mb-2"
          >
            Publisher
          </label>
          <input
            :value="formData.publisher"
            @input="
              updateFormData(
                'publisher',
                ($event.target as HTMLInputElement).value,
              )
            "
            type="text"
            class="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-menu-blue focus:border-transparent text-light-primary-text dark:text-dark-primary-text"
            placeholder="Enter publisher"
          />
        </div>

        <!-- Language and Pages Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Language -->
          <div>
            <label
              class="block text-sm font-medium text-light-primary-text dark:text-dark-primary-text mb-2"
            >
              Language
            </label>
            <input
              :value="formData.language"
              @input="
                updateFormData(
                  'language',
                  ($event.target as HTMLInputElement).value,
                )
              "
              type="text"
              class="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-menu-blue focus:border-transparent text-light-primary-text dark:text-dark-primary-text"
              placeholder="e.g., English"
            />
          </div>

          <!-- Pages -->
          <div>
            <label
              class="block text-sm font-medium text-light-primary-text dark:text-dark-primary-text mb-2"
            >
              Pages
            </label>
            <input
              :value="formData.pages || ''"
              @input="
                updateFormData(
                  'pages',
                  ($event.target as HTMLInputElement).value
                    ? parseInt(($event.target as HTMLInputElement).value)
                    : undefined,
                )
              "
              type="number"
              class="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-menu-blue focus:border-transparent text-light-primary-text dark:text-dark-primary-text"
              placeholder="Number of pages"
            />
          </div>
        </div>

        <!-- Publish Date -->
        <div>
          <label
            class="block text-sm font-medium text-light-primary-text dark:text-dark-primary-text mb-2"
          >
            Published Date
          </label>
          <input
            :value="formData.publishDate"
            @input="
              updateFormData(
                'publishDate',
                ($event.target as HTMLInputElement).value,
              )
            "
            type="text"
            class="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-menu-blue focus:border-transparent text-light-primary-text dark:text-dark-primary-text"
            placeholder="e.g., 2023 or 2023-03-15"
          />
        </div>
      </div>

      <!-- Continue Button -->
      <div class="mt-8 text-center">
        <ion-button
          @click="emit('continue')"
          :disabled="!isFormValid"
          expand="block"
          class="ion-margin"
        >
          Continue
        </ion-button>
      </div>
    </div>
  </div>
</template>
