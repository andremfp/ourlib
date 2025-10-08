<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon,
} from "@ionic/vue";
import { auth } from "@/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import logger from "@/utils/logger";
import { UI_LIMITS } from "@/constants/constants";
import logoLight from "@/assets/ourlib-logo.webp";
import logoDark from "@/assets/ourlib-logo-dark.webp";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";

const router = useRouter();
const route = useRoute();

const newPassword = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const isLoading = ref(false);
const isValidatingCode = ref(true);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const userEmail = ref("");

/**
 * Validate password against the rules in UI_LIMITS.PASSWORD
 */
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

const handleResetPassword = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  // Check if passwords match
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match.";
    return;
  }

  // Validate password
  const validation = validatePassword(newPassword.value);
  if (!validation.valid) {
    errorMessage.value = validation.message;
    return;
  }

  const oobCode = route.query.oobCode as string;
  if (!oobCode) {
    errorMessage.value =
      "Invalid reset link. Please request a new password reset.";
    return;
  }

  try {
    isLoading.value = true;
    await confirmPasswordReset(auth, oobCode, newPassword.value);

    successMessage.value =
      "Password reset successfully! Redirecting to login...";
    logger.info("Password reset successful");

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  } catch (error: any) {
    logger.error("Password reset error:", error?.message || error);

    switch (error?.code) {
      case "auth/expired-action-code":
        errorMessage.value =
          "Reset link has expired. Please request a new password reset.";
        break;
      case "auth/invalid-action-code":
        errorMessage.value =
          "Invalid reset link. Please request a new password reset.";
        break;
      case "auth/weak-password":
        errorMessage.value =
          "Password is too weak. Please choose a stronger password.";
        break;
      case "auth/network-request-failed":
        errorMessage.value =
          "Network error. Please check your connection and try again.";
        break;
      default:
        errorMessage.value =
          "An error occurred while resetting your password. Please try again.";
    }
  } finally {
    isLoading.value = false;
  }
};

// Validate the reset code on component mount
onMounted(async () => {
  const oobCode = route.query.oobCode as string;
  const mode = route.query.mode as string;

  if ((mode !== "resetPassword" && mode !== "action") || !oobCode) {
    errorMessage.value =
      "Invalid reset link. Please request a new password reset.";
    isValidatingCode.value = false;
    return;
  }

  try {
    // Verify the reset code and get user email
    const email = await verifyPasswordResetCode(auth, oobCode);
    userEmail.value = email;
    logger.info("Password reset code verified for:", email);
  } catch (error: any) {
    logger.error("Invalid reset code:", error?.message || error);
    switch (error?.code) {
      case "auth/expired-action-code":
        errorMessage.value =
          "Reset link has expired. Please request a new password reset.";
        break;
      case "auth/invalid-action-code":
        errorMessage.value =
          "Invalid reset link. Please request a new password reset.";
        break;
      default:
        errorMessage.value =
          "Invalid reset link. Please request a new password reset.";
    }
  } finally {
    isValidatingCode.value = false;
  }
});
</script>

<template>
  <ion-page>
    <ion-content :scroll-y="false" class="ion-padding">
      <div class="min-h-[100dvh] flex items-center justify-center">
        <div class="w-full max-w-md">
          <div class="text-center">
            <img
              :src="logoLight"
              alt="OurLib logo"
              class="h-16 mx-auto block dark:hidden"
            />
            <img
              :src="logoDark"
              alt="OurLib logo"
              class="h-16 mx-auto hidden dark:block"
            />
            <h1
              class="text-2xl font-bold mt-4 text-gray-800 dark:text-gray-100"
            >
              Reset Password
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-200">
              Enter your new password
            </p>
            <p
              v-if="userEmail"
              class="mt-1 text-sm text-gray-500 dark:text-gray-400"
            >
              for {{ userEmail }}
            </p>
          </div>

          <div v-if="isValidatingCode" class="mt-8 text-center">
            <ion-spinner name="crescent"></ion-spinner>
            <p class="mt-2 text-gray-600 dark:text-gray-200">
              Verifying reset link...
            </p>
          </div>

          <form
            v-else
            @submit.prevent="handleResetPassword"
            class="mt-8 space-y-4"
          >
            <div>
              <ion-input
                v-model="newPassword"
                :type="showPassword ? 'text' : 'password'"
                :disabled="isLoading"
                placeholder="New password"
                autocomplete="new-password"
                fill="outline"
                mode="md"
                required
              >
                <ion-icon
                  slot="end"
                  :icon="showPassword ? eyeOffOutline : eyeOutline"
                  @click="showPassword = !showPassword"
                  class="cursor-pointer"
                ></ion-icon>
              </ion-input>
            </div>

            <div>
              <ion-input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                :disabled="isLoading"
                placeholder="Confirm new password"
                autocomplete="new-password"
                fill="outline"
                mode="md"
                required
              >
                <ion-icon
                  slot="end"
                  :icon="showConfirmPassword ? eyeOffOutline : eyeOutline"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="cursor-pointer"
                ></ion-icon>
              </ion-input>
            </div>

            <ion-note class="block">
              <div class="mt-1 text-xs">
                Password must be {{ UI_LIMITS.PASSWORD.MIN_LENGTH }}-{{
                  UI_LIMITS.PASSWORD.MAX_LENGTH
                }}
                characters and include:
                <ul class="list-disc ml-5 mt-1">
                  <li v-if="UI_LIMITS.PASSWORD.REQUIRE_UPPERCASE">
                    Uppercase letter
                  </li>
                  <li v-if="UI_LIMITS.PASSWORD.REQUIRE_LOWERCASE">
                    Lowercase letter
                  </li>
                  <li v-if="UI_LIMITS.PASSWORD.REQUIRE_NUMBER">Number</li>
                  <li v-if="UI_LIMITS.PASSWORD.REQUIRE_SPECIAL">
                    Special character
                  </li>
                </ul>
              </div>
            </ion-note>

            <div v-if="errorMessage" class="text-red-500 text-sm">
              {{ errorMessage }}
            </div>

            <div v-if="successMessage" class="text-green-600 text-sm">
              {{ successMessage }}
            </div>

            <ion-button
              type="submit"
              expand="block"
              class="ion-margin-top"
              :disabled="isLoading || !newPassword || !confirmPassword"
            >
              <ion-spinner
                v-if="isLoading"
                name="crescent"
                class="ion-margin-end"
              ></ion-spinner>
              {{ isLoading ? "Resetting..." : "Reset Password" }}
            </ion-button>
          </form>

          <ion-button
            expand="block"
            fill="clear"
            @click="router.push('/login')"
            :disabled="isLoading"
            class="mt-4"
          >
            Back to Login
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
