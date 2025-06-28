<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import ScanMode from "./ScanMode.vue";
import ManualMode from "./ManualMode.vue";
import LibrarySelection from "@/components/modals/LibrarySelection.vue";
import { useAddBook } from "./composables/useAddBook";

const {
  mode,
  scannedISBN,
  isLoadingBookDetails,
  formData,
  libraries,
  isLoadingLibraries,
  isFormValid,
  thumbnailUrl,
  startScanning,
  startManual,
  cancelOperation,
  handleISBN,
  proceedToLibrarySelection,
  selectLibrary,
  completeAddition,
  setupEventListeners,
  cleanupEventListeners,
} = useAddBook();

// Modal state
const isLibraryModalOpen = ref(false);

// Handle form data updates
const handleFormDataUpdate = (newFormData: any) => {
  Object.assign(formData, newFormData);
};

// Handle continue from form to library selection
const handleContinueToLibrarySelection = () => {
  proceedToLibrarySelection();
  isLibraryModalOpen.value = true;
};

// Handle library selection from modal
const handleLibrarySelected = (library: any) => {
  selectLibrary(library);
  isLibraryModalOpen.value = false;
  handleSave(); // Automatically save after library selection
};

// Handle modal close
const handleModalClose = () => {
  isLibraryModalOpen.value = false;
};

const handleSave = async () => {
  const success = await completeAddition();
  if (success) {
    // Could show success message here if needed
  }
};

// Set up event listeners for Navbar integration
onMounted(() => {
  setupEventListeners();
});

onUnmounted(() => {
  cleanupEventListeners();
});
</script>

<template>
  <div class="flex flex-col bg-light-bg dark:bg-dark-bg h-full">
    <!-- Selection Mode: Two Options -->
    <div v-if="mode === 'selection'" class="flex-1 flex flex-col">
      <!-- Scan Barcode Option -->
      <button
        @click="startScanning"
        class="flex-1 bg-light-card dark:bg-dark-card border-transparent hover:border-menu-blue transition-colors duration-200 relative after:absolute after:bottom-0 after:left-6 after:right-6 after:h-0.5 after:bg-light-border after:dark:bg-dark-border"
      >
        <div
          class="flex flex-col items-center justify-end h-full space-y-4 pb-24"
        >
          <div
            class="w-20 h-20 bg-menu-blue rounded-full flex items-center justify-center"
          >
            <svg
              class="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div class="text-center max-w-xs">
            <h3
              class="text-2xl font-semibold text-light-primary-text dark:text-dark-primary-text mb-1"
            >
              Scan Barcode
            </h3>
            <p
              class="text-light-secondary-text dark:text-dark-secondary-text text-base"
            >
              Use your camera to scan the book's barcode
            </p>
          </div>
        </div>
      </button>

      <!-- Manual Input Option -->
      <button
        @click="startManual"
        class="flex-1 bg-light-card dark:bg-dark-card border-2 border-transparent hover:border-menu-blue transition-colors duration-200"
      >
        <div
          class="flex flex-col items-center justify-top h-full space-y-4 pt-24"
        >
          <div
            class="w-20 h-20 bg-menu-blue rounded-full flex items-center justify-center"
          >
            <svg
              class="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <div class="text-center max-w-xs">
            <h3
              class="text-2xl font-semibold text-light-primary-text dark:text-dark-primary-text mb-1"
            >
              Manual Entry
            </h3>
            <p
              class="text-light-secondary-text dark:text-dark-secondary-text text-base"
            >
              Enter book details manually
            </p>
          </div>
        </div>
      </button>
    </div>

    <!-- Scanning Mode -->
    <ScanMode
      v-else-if="mode === 'scan' || mode === 'form'"
      :scanned-i-s-b-n="scannedISBN"
      :is-loading-book-details="isLoadingBookDetails"
      :form-data="formData"
      :thumbnail-url="thumbnailUrl"
      :is-form-valid="isFormValid"
      @isbn-scanned="handleISBN"
      @update:form-data="handleFormDataUpdate"
      @continue="handleContinueToLibrarySelection"
      @cancel="cancelOperation"
    />

    <!-- Manual Mode -->
    <ManualMode
      v-else-if="mode === 'manual'"
      :form-data="formData"
      :thumbnail-url="thumbnailUrl"
      :is-form-valid="isFormValid"
      @update:form-data="handleFormDataUpdate"
      @continue="handleContinueToLibrarySelection"
    />

    <!-- Library Selection Modal -->
    <LibrarySelection
      :is-open="isLibraryModalOpen"
      :libraries="libraries"
      :is-loading-libraries="isLoadingLibraries"
      :book-title="formData.title"
      @close="handleModalClose"
      @library-selected="handleLibrarySelected"
    />
  </div>
</template>
