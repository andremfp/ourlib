<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonNote,
  IonIcon,
} from "@ionic/vue";
import { auth, firestore } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import logger from "@/utils/logger";
import { UI_LIMITS } from "@/constants/constants";
import { logoGoogle, eyeOutline, eyeOffOutline } from "ionicons/icons";
import EmailVerificationSent from "@/components/modals/EmailVerificationSent.vue";

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const router = useRouter();
const isGoogleLoading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

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

const register = async () => {
  errorMessage.value = "";

  // Check if passwords match
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match.";
    return;
  }

  // Validate password
  const validation = validatePassword(password.value);
  if (!validation.valid) {
    errorMessage.value = validation.message;
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value,
    );
    const user = userCredential.user;

    logger.info("User registered successfully");

    // Send verification email
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/email-actions`,
        handleCodeInApp: true,
      };
      await sendEmailVerification(user, actionCodeSettings);
      logger.info("Verification email sent");
    } catch (verificationError: any) {
      logger.error(
        "Failed to send verification email:",
        verificationError?.message || verificationError,
      );
    }

    // Store user information in Firestore
    const userRef = doc(firestore, "users", user.uid);
    await setDoc(userRef, {
      email: email.value,
      username: email.value.split("@")[0],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    logger.info("User data stored; showing verification modal");

    // Show modal informing verification email sent; redirect after close
    const { modalController } = await import("@ionic/vue");
    const modal = await modalController.create({
      component: EmailVerificationSent,
      componentProps: { email: email.value },
      cssClass: "generic-modal",
    });
    await modal.present();
    await modal.onDidDismiss();

    await signOut(auth);
    email.value = "";
    password.value = "";
    confirmPassword.value = "";
    router.push("/login");
  } catch (error: any) {
    logger.error("Registration error:", error.message);

    // Set user-friendly error message
    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage.value = "Username is already taken. Please try another.";
        break;
      case "auth/weak-password":
        errorMessage.value =
          "Password should be at least 6 characters. Please try another.";
        break;
      case "auth/invalid-email":
        errorMessage.value = "Invalid email address.";
        break;
      default:
        errorMessage.value = "An error occurred. Please try again.";
    }
  }
};

const registerWithGoogle = async () => {
  errorMessage.value = "";
  try {
    isGoogleLoading.value = true;

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Store user information in Firestore (create or update)
    const emailValue = user.email || "";
    const usernameValue = emailValue
      ? emailValue.split("@")[0]
      : (user.displayName || "user").replace(/\s+/g, "").toLowerCase();

    const userRef = doc(firestore, "users", user.uid);
    await setDoc(
      userRef,
      {
        email: emailValue,
        username: usernameValue,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );

    logger.info("User registered with Google successfully");
    router.push("/");
  } catch (error: any) {
    logger.error("Google registration error:", error?.message || error);
    switch (error?.code) {
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        errorMessage.value = "Sign-in was cancelled.";
        break;
      case "auth/popup-blocked":
        errorMessage.value =
          "Popup was blocked. Please allow popups and try again.";
        break;
      case "auth/network-request-failed":
        errorMessage.value = "Network error. Please check your connection.";
        break;
      default:
        errorMessage.value =
          "An error occurred during Google sign up. Please try again.";
    }
  } finally {
    isGoogleLoading.value = false;
  }
};

const goToLogin = () => {
  router.push("/login");
};
</script>

<template>
  <ion-page>
    <ion-content :scroll-y="false" class="ion-padding">
      <div class="min-h-[100dvh] flex items-center justify-center">
        <div class="w-full max-w-md">
          <div class="text-center">
            <h1
              class="text-2xl font-bold mt-4 text-gray-800 dark:text-gray-100"
            >
              Sign up
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-200">
              to start your library
            </p>
          </div>
          <ion-button
            expand="block"
            class="ion-margin-top mt-8"
            :disabled="isGoogleLoading"
            @click="registerWithGoogle"
          >
            <ion-icon :icon="logoGoogle" class="mr-2"></ion-icon>
            <ion-spinner
              v-if="isGoogleLoading"
              name="crescent"
              class="ion-margin-end"
            ></ion-spinner>
            {{ isGoogleLoading ? "Signing up..." : "Continue with Google" }}
          </ion-button>

          <div class="flex items-center my-6">
            <div class="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
            <span class="px-3 text-sm text-gray-500 dark:text-gray-400"
              >Or continue with email</span
            >
            <div class="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
          </div>

          <form @submit.prevent="register" class="space-y-4">
            <ion-input
              v-model="email"
              id="email"
              type="text"
              placeholder="Email"
              autocomplete="email"
              fill="outline"
              mode="md"
              required
            ></ion-input>

            <ion-input
              v-model="password"
              id="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
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

            <ion-input
              v-model="confirmPassword"
              id="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Repeat password"
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

            <div v-if="errorMessage" class="text-red-500 text-sm">
              {{ errorMessage }}
            </div>

            <ion-button type="submit" expand="block" class="ion-margin-top">
              Create Account
            </ion-button>
          </form>

          <ion-button expand="block" fill="clear" @click="goToLogin">
            Already have an account? Sign in
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
