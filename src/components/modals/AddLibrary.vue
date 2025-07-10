<script setup lang="ts">
import { ref } from "vue";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonButtons,
  modalController,
} from "@ionic/vue";
import { getAuth } from "firebase/auth";
import { createLibrary } from "@/apis/libraryAPI";
import type { Library } from "@/schema";
import { UI_LIMITS } from "@/constants/constants";
import { firestore } from "@/firebase";
import { doc, DocumentReference } from "firebase/firestore";
import { COLLECTION_NAMES } from "@/constants";
import type { User } from "@/schema";

const libraryName = ref("");
const errorMessage = ref("");
const isSubmitting = ref(false);

async function handleSubmit() {
  const trimmedName = libraryName.value.trim();

  if (!trimmedName) {
    errorMessage.value = "Library name is required";
    return;
  }
  if (trimmedName.length < UI_LIMITS.LIBRARY.NAME_MIN_LENGTH) {
    errorMessage.value = `Library name must be at least ${UI_LIMITS.LIBRARY.NAME_MIN_LENGTH} characters`;
    return;
  }
  if (trimmedName.length > UI_LIMITS.LIBRARY.NAME_MAX_LENGTH) {
    errorMessage.value = `Library name cannot exceed ${UI_LIMITS.LIBRARY.NAME_MAX_LENGTH} characters`;
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
</script>

<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Create New Library</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="cancel()">Cancel</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-list>
      <ion-item>
        <ion-input
          label="Library Name"
          label-placement="floating"
          v-model="libraryName"
          placeholder="Enter library name"
          @keyup.enter="handleSubmit"
        ></ion-input>
      </ion-item>
    </ion-list>

    <p
      v-if="errorMessage"
      class="mt-2 text-sm text-red-600 dark:text-red-400 ion-padding-horizontal"
    >
      {{ errorMessage }}
    </p>

    <ion-button
      class="ion-margin-top"
      expand="block"
      :disabled="isSubmitting"
      @click="handleSubmit"
    >
      <span v-if="isSubmitting">Creating...</span>
      <span v-else>Create Library</span>
    </ion-button>
  </ion-content>
</template>
