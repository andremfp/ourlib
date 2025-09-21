<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  IonInput,
  IonButton,
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
    // Provide specific feedback for common Firebase auth errors
    if (error?.code === "auth/too-many-requests") {
      errorMessage.value = "Too many attempts. Please try again later.";
    } else {
      errorMessage.value =
        "Failed to change password. Please check your current password and try again.";
    }
  }
};
</script>

<template>
  <div class="wrapper">
    <h1>Change Password</h1>

    <form @submit.prevent="changePassword">
      <!-- Off-screen username for browser password managers/accessibility -->
      <input
        aria-hidden="true"
        autocomplete="username"
        :value="username || ''"
        tabindex="-1"
        style="
          position: absolute;
          left: -9999px;
          width: 1px;
          height: 1px;
          opacity: 0;
        "
      />

      <div class="form-group">
        <ion-input
          :clear-input="false"
          v-model="currentPassword"
          placeholder="Current password"
          type="password"
          autocomplete="current-password"
          required
          fill="outline"
          mode="md"
        ></ion-input>
      </div>

      <div class="form-group">
        <ion-input
          :clear-input="false"
          v-model="newPassword"
          placeholder="New password"
          type="password"
          autocomplete="new-password"
          required
          fill="outline"
          mode="md"
        ></ion-input>
      </div>

      <div class="form-group">
        <ion-input
          :clear-input="false"
          v-model="confirmNewPassword"
          placeholder="Confirm new password"
          type="password"
          autocomplete="new-password"
          required
          fill="outline"
          mode="md"
        ></ion-input>
      </div>

      <p v-if="errorMessage" class="error-message" role="alert">
        {{ errorMessage }}
      </p>

      <div class="dialog-actions">
        <ion-button fill="clear" @click="cancel">Cancel</ion-button>
        <ion-button type="submit">Update</ion-button>
      </div>
    </form>
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

.form-group {
  margin-bottom: 12px;
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
  min-height: 28px;
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
