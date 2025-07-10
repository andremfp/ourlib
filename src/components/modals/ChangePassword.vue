<script setup lang="ts">
import { ref, onMounted } from "vue";
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
  alertController,
} from "@ionic/vue";
import {
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { getUser } from "@/apis/userAPI";
import logger from "@/utils/logger";
import { UI_LIMITS } from "@/constants/constants";

const auth = getAuth();
const currentPassword = ref("");
const newPassword = ref("");
const confirmNewPassword = ref("");
const errorMessage = ref("");
const username = ref<string | null>(null);

const fetchUser = async (uid: string) => {
  try {
    const user = await getUser(uid);
    username.value = user ? user.username : "Unknown User";
  } catch (error: any) {
    logger.error("Error fetching user:", error.message);
    username.value = "Unknown User";
  }
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUser(user.uid);
    }
  });
});

const cancel = () => {
  modalController.dismiss();
};

const validatePassword = (
  password: string,
): { valid: boolean; message: string } => {
  // Check length
  if (password.length < UI_LIMITS.PASSWORD.MIN_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${UI_LIMITS.PASSWORD.MIN_LENGTH} characters long.`,
    };
  }

  if (password.length > UI_LIMITS.PASSWORD.MAX_LENGTH) {
    return {
      valid: false,
      message: `Password cannot exceed ${UI_LIMITS.PASSWORD.MAX_LENGTH} characters.`,
    };
  }

  // Check character requirements
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const missingRequirements = [];

  if (UI_LIMITS.PASSWORD.REQUIRE_UPPERCASE && !hasUppercase) {
    missingRequirements.push("uppercase letter");
  }

  if (UI_LIMITS.PASSWORD.REQUIRE_LOWERCASE && !hasLowercase) {
    missingRequirements.push("lowercase letter");
  }

  if (UI_LIMITS.PASSWORD.REQUIRE_NUMBER && !hasNumber) {
    missingRequirements.push("number");
  }

  if (UI_LIMITS.PASSWORD.REQUIRE_SPECIAL && !hasSpecial) {
    missingRequirements.push("special character");
  }

  if (missingRequirements.length > 0) {
    return {
      valid: false,
      message: `Password must include at least one ${missingRequirements.join(", ")}.`,
    };
  }

  return { valid: true, message: "" };
};

const changePassword = async () => {
  errorMessage.value = "";

  // Check if passwords match
  if (newPassword.value !== confirmNewPassword.value) {
    errorMessage.value = "New passwords do not match.";
    return;
  }

  // Validate new password
  const validation = validatePassword(newPassword.value);
  if (!validation.valid) {
    errorMessage.value = validation.message;
    return;
  }

  const user = auth.currentUser;
  if (!user || !user.email) {
    errorMessage.value = "User not authenticated.";
    return;
  }

  try {
    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword.value,
    );
    await reauthenticateWithCredential(user, credential);

    // Update the password
    await updatePassword(user, newPassword.value);

    const alert = await alertController.create({
      header: "Success",
      message: "Your password has been updated successfully.",
      buttons: ["OK"],
    });
    await alert.present();

    modalController.dismiss();
  } catch (error: any) {
    logger.error("Error changing password:", error.message);
    errorMessage.value =
      "Failed to change password. Please check your current password and try again.";
  }
};
</script>

<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Change Password</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="cancel()">Cancel</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <form @submit.prevent="changePassword">
      <ion-list>
        <ion-item>
          <ion-input
            label="Current Password"
            label-placement="floating"
            type="password"
            v-model="currentPassword"
            autocomplete="current-password"
            required
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            label="New Password"
            label-placement="floating"
            type="password"
            v-model="newPassword"
            autocomplete="new-password"
            required
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            label="Confirm New Password"
            label-placement="floating"
            type="password"
            v-model="confirmNewPassword"
            autocomplete="new-password"
            required
          ></ion-input>
        </ion-item>
      </ion-list>
      <div
        v-if="errorMessage"
        class="ion-padding-horizontal mt-2 text-sm text-red-500"
      >
        {{ errorMessage }}
      </div>
      <ion-button type="submit" expand="block" class="ion-margin-top">
        Update Password
      </ion-button>
    </form>
  </ion-content>
</template>
