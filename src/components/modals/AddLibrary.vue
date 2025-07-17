<script setup lang="ts">
import { ref, onMounted } from "vue";
import { IonInput, IonButton, modalController } from "@ionic/vue";
import { getAuth } from "firebase/auth";
import { createLibrary } from "@/apis/libraryAPI";
import type { Library } from "@/schema";
import { firestore } from "@/firebase";
import { doc, DocumentReference } from "firebase/firestore";
import { COLLECTION_NAMES } from "@/constants";
import type { User } from "@/schema";

const libraryName = ref("");
const errorMessage = ref("");
const isSubmitting = ref(false);
const libraryInput = ref<InstanceType<typeof IonInput> | null>(null);

async function handleSubmit() {
  const trimmedName = libraryName.value.trim();

  if (!trimmedName) {
    errorMessage.value = "Library name is required";
    return;
  }

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  if (!userId) {
    errorMessage.value = "You must be logged in to create a library";
    return;
  }

  try {
    isSubmitting.value = true;
    errorMessage.value = "";

    const userRef = doc(
      firestore,
      COLLECTION_NAMES.USERS,
      userId,
    ) as DocumentReference<User>;

    await createLibrary({
      name: trimmedName,
      owner: userRef,
      booksCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Library);

    modalController.dismiss(null, "created");
  } catch (error) {
    errorMessage.value = "Failed to create library. Please try again.";
    console.error("Error creating library:", error);
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
    <h1>Create New Library</h1>

    <ion-input
      ref="libraryInput"
      :clear-input="true"
      v-model="libraryName"
      placeholder="Library name"
      @keyup.enter="handleSubmit"
      aria-describedby="library-name-error"
      fill="outline"
      mode="md"
      :maxlength="25"
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
      <ion-button fill="clear" @click="cancel" :disabled="isSubmitting">
        Cancel
      </ion-button>
      <ion-button
        @click="handleSubmit"
        :disabled="isSubmitting || !libraryName.trim()"
      >
        <span v-if="isSubmitting">Creating...</span>
        <span v-else>Create</span>
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

<style>
ion-modal.add-library-modal {
  --width: 90%;
  --height: fit-content;
  --border-radius: 12px;
  --box-shadow: 0 28px 48px rgba(0, 0, 0, 0.4);
}
</style>
