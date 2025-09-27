<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import {
  IonButton,
  IonSelect,
  IonSelectOption,
  modalController,
} from "@ionic/vue";
// no icons currently used
import type { Library } from "@/schema";

// ============= PROPS & EMITS =============
const props = defineProps<{
  isOpen?: boolean;
  libraries?: Library[];
  isLoadingLibraries?: boolean;
  bookTitle?: string;
}>();

const emit = defineEmits<{
  close: [];
  librarySelected: [library: Library];
}>();

// ============= STATE =============
const selectedLibraryId = ref<string>("");

// Get props with defaults - these will be set by the modal controller
const libraries = ref<Library[]>(props.libraries || []);
const isLoadingLibraries = ref<boolean>(props.isLoadingLibraries || false);
const bookTitle = ref<string>(props.bookTitle || "");

// ============= WATCHERS =============
// Reset selection when modal opens
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      selectedLibraryId.value = ""; // Reset selection
    }
  },
);

// Update local state when props change
watch(
  () => props.libraries,
  (newLibraries) => {
    if (newLibraries) {
      libraries.value = newLibraries;
    }
  },
  { immediate: true },
);

watch(
  () => props.isLoadingLibraries,
  (newLoading) => {
    isLoadingLibraries.value = newLoading || false;
  },
  { immediate: true },
);

watch(
  () => props.bookTitle,
  (newTitle) => {
    bookTitle.value = newTitle || "";
  },
  { immediate: true },
);

// ============= LIBRARY SELECTION =============
/**
 * Confirm library selection
 */
function confirmSelection() {
  const lib = libraries.value.find((l) => l.id === selectedLibraryId.value);
  if (!lib) return;
  emit("librarySelected", lib);
  modalController.dismiss(lib, "selected");
}

/**
 * Close the modal
 */
function closeModal() {
  selectedLibraryId.value = "";
  modalController.dismiss(null, "cancel");
}

// Initialize data directly from props
onMounted(() => {
  console.log("LibrarySelection onMounted - props:", props);

  // Set data directly from props
  if (props.libraries) {
    libraries.value = props.libraries;
  }
  if (props.isLoadingLibraries !== undefined) {
    isLoadingLibraries.value = props.isLoadingLibraries;
  }
  if (props.bookTitle) {
    bookTitle.value = props.bookTitle;
  }

  console.log("Final state:", {
    libraries: libraries.value,
    isLoadingLibraries: isLoadingLibraries.value,
    bookTitle: bookTitle.value,
  });

  // Add keyboard event listener for Escape key
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeModal();
    }
  };

  document.addEventListener("keydown", handleKeydown);

  // Cleanup on unmount
  return () => {
    document.removeEventListener("keydown", handleKeydown);
  };
});
</script>

<template>
  <div class="wrapper">
    <h1>Choose Library</h1>

    <p class="subtitle">Select which library to add "{{ bookTitle }}" to</p>

    <div v-if="isLoadingLibraries" class="loading">
      <div class="spinner"></div>
      <span>Loading libraries...</span>
    </div>

    <template v-else>
      <ion-select
        interface="popover"
        :interface-options="{ cssClass: 'generic-modal' }"
        placeholder="Select a library"
        aria-label="Library"
        v-model="selectedLibraryId"
        :disabled="!libraries || libraries.length === 0"
      >
        <ion-select-option
          v-for="library in libraries"
          :key="library.id"
          :value="library.id"
          class="justify-end"
        >
          {{ library.name }}
        </ion-select-option>
      </ion-select>

      <p v-if="libraries && libraries.length === 0" class="empty">
        No libraries found
      </p>

      <div class="dialog-actions">
        <ion-button fill="clear" @click="closeModal">Cancel</ion-button>
        <ion-button :disabled="!selectedLibraryId" @click="confirmSelection">
          Add to Library
        </ion-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.wrapper {
  padding: 16px;
}

.wrapper h1 {
  margin: 0 0 16px;
  font-size: theme("fontSize.modal-title");
  font-weight: theme("fontWeight.bold");
}

.subtitle {
  margin: 0 0 16px;
  font-size: theme("fontSize.modal-text");
  color: theme("colors.light-secondary-text");
}

.loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
}

.spinner {
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  border: 4px solid var(--ion-color-primary);
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty {
  margin-top: 12px;
  color: theme("colors.light-secondary-text");
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

.dialog-actions ion-button {
  margin: 0;
  height: 44px;
  --border-radius: 8px;
  font-weight: 500;
  min-width: 90px;
  text-transform: none;
}
</style>
