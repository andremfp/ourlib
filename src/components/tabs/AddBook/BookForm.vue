<script setup lang="ts">
import type { BookFormData } from "./composables/useAddBook";

interface Props {
  formData: BookFormData;
  thumbnailUrl: string;
  isLoadingBookDetails: boolean;
  scannedISBN?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:formData": [formData: BookFormData];
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
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Loading State for Scanned Books -->
    <div
      v-if="isLoadingBookDetails"
      class="flex justify-center items-center py-12"
    >
      <div
        class="animate-spin rounded-full h-12 w-12 border-4 border-menu-blue border-t-transparent"
      ></div>
      <span
        class="ml-3 text-light-secondary-text dark:text-dark-secondary-text"
      >
        Fetching book details...
      </span>
    </div>

    <!-- Book Form -->
    <div v-else>
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
          <svg
            v-else
            class="w-16 h-16 text-light-secondary-text dark:text-dark-secondary-text"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
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
    </div>
  </div>
</template>
