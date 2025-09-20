<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { IonInput, IonButton, modalController } from "@ionic/vue";
import { UI_LIMITS } from "@/constants/constants";

// ============= PROPS & EMITS =============
const props = defineProps<{
  isOpen: boolean;
  libraryName: string;
}>();

const emit = defineEmits<{
  close: [];
  rename: [newName: string];
}>();

// ============= STATE =============
// Form state
const newLibraryName = ref(props.libraryName);
const errorMessage = ref("");
const libraryInput = ref<InstanceType<typeof IonInput> | null>(null);

// Reset form when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      newLibraryName.value = props.libraryName;
      errorMessage.value = "";
    }
  },
  { immediate: true },
);

// ============= EVENT HANDLERS =============
/**
 * Handle renaming a library, with input validation
 */
function handleRename() {
  const trimmedName = newLibraryName.value.trim();

  // Validate input
  if (!trimmedName) {
    errorMessage.value = "Library name cannot be empty";
    return;
  }

  if (trimmedName === props.libraryName) {
    errorMessage.value = "Please enter a different name";
    return;
  }

  if (trimmedName.length < UI_LIMITS.LIBRARY.NAME_MIN_LENGTH) {
    errorMessage.value = `Name must be at least ${UI_LIMITS.LIBRARY.NAME_MIN_LENGTH} characters`;
    return;
  }

  if (trimmedName.length > UI_LIMITS.LIBRARY.NAME_MAX_LENGTH) {
    errorMessage.value = `Name cannot be longer than ${UI_LIMITS.LIBRARY.NAME_MAX_LENGTH} characters`;
    return;
  }

  // Submit valid name
  emit("rename", trimmedName);
  modalController.dismiss(trimmedName, "renamed");
}

/**
 * Cancel the rename operation
 */
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

  // Focus the input after a short delay to allow for the modal transition
  setTimeout(() => {
    libraryInput.value?.$el.setFocus();
  }, 300);

  // Cleanup on unmount
  return () => {
    document.removeEventListener("keydown", handleKeydown);
  };
});
</script>

<template>
  <div class="wrapper">
    <h1>Rename Library</h1>

    <ion-input
      ref="libraryInput"
      :clear-input="true"
      v-model="newLibraryName"
      placeholder="Library name"
      @keyup.enter="handleRename"
      aria-describedby="library-name-error"
      fill="outline"
      mode="md"
      :maxlength="UI_LIMITS.LIBRARY.NAME_MAX_LENGTH"
    ></ion-input>

    <p
      v-if="errorMessage"
      id="library-name-error"
      class="error-message"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <div class="dialog-actions">
      <ion-button fill="clear" @click="cancel">Cancel</ion-button>
      <ion-button
        @click="handleRename"
        :disabled="
          !newLibraryName.trim() || newLibraryName.trim() === props.libraryName
        "
      >
        Save
      </ion-button>
    </div>
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
