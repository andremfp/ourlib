<script setup lang="ts">
import { onMounted } from "vue";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  modalController,
} from "@ionic/vue";

// ============= PROPS & EMITS =============
defineProps<{
  isOpen: boolean;
  libraryName: string;
}>();

const emit = defineEmits<{
  close: [];
  delete: [];
}>();

// ============= EVENT HANDLERS =============
/**
 * Confirm deletion
 */
function confirmDelete() {
  emit("delete");
  modalController.dismiss(null, "deleted");
}

/**
 * Cancel deletion
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

  // Cleanup on unmount
  return () => {
    document.removeEventListener("keydown", handleKeydown);
  };
});
</script>

<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Delete Library</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="cancel">Cancel</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <div class="wrapper">
      <!-- Confirmation message -->
      <p
        class="text-modal-text text-light-secondary-text dark:text-dark-secondary-text mb-4"
      >
        Are you sure you want to delete "{{ libraryName }}"? This action cannot
        be undone.
      </p>

      <!-- Action buttons -->
      <div class="dialog-actions">
        <ion-button fill="clear" @click="cancel"> Cancel </ion-button>
        <ion-button color="danger" @click="confirmDelete"> Delete </ion-button>
      </div>
    </div>
  </ion-content>
</template>

<style scoped>
.wrapper {
  padding: 16px;
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
