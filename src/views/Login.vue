<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon,
} from "@ionic/vue";
import { auth, firestore } from "@/firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import logger from "@/utils/logger";
import logoLight from "@/assets/ourlib-logo.webp";
import logoDark from "@/assets/ourlib-logo-dark.webp";
import { logoGoogle, eyeOutline, eyeOffOutline } from "ionicons/icons";

const router = useRouter();
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const isLoading = ref(false);
const isGoogleLoading = ref(false);
const isResettingPassword = ref(false);
const showPassword = ref(false);

const validateInputs = (): { valid: boolean; message: string } => {
  if (!email.value.trim()) {
    return { valid: false, message: "Email is required." };
  }

  if (!password.value.trim()) {
    return { valid: false, message: "Password is required." };
  }

  return { valid: true, message: "" };
};

const handleLogin = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  // Validate inputs
  const validation = validateInputs();
  if (!validation.valid) {
    errorMessage.value = validation.message;
    return;
  }

  try {
    isLoading.value = true;

    // Login with Firebase
    const credential = await signInWithEmailAndPassword(
      auth,
      email.value.trim(),
      password.value,
    );

    // Enforce email verification for email/password sign-ins
    const currentUser = credential.user;
    if (currentUser && !currentUser.emailVerified) {
      errorMessage.value =
        "Please verify your email address. We've resent the verification email.";
      try {
        // Resend verification email
        await import("firebase/auth").then(async (m) => {
          const actionCodeSettings = {
            url: `${window.location.origin}/email-actions`,
            handleCodeInApp: true,
          };
          await m.sendEmailVerification(currentUser, actionCodeSettings);
        });
      } catch (verificationError: any) {
        logger.error(
          "Failed to resend verification email:",
          verificationError?.message || verificationError,
        );
      }
      // Sign out and stop login flow
      await auth.signOut();
      return;
    }

    logger.info("User logged in successfully");
    // Clear inputs after successful login
    email.value = "";
    password.value = "";
    router.push("/");
  } catch (error: any) {
    logger.error("Login error:", error.message);

    // Set user-friendly error message based on Firebase error codes
    switch (error.code) {
      case "auth/invalid-email":
        errorMessage.value = "Invalid email address.";
        break;
      case "auth/user-disabled":
        errorMessage.value = "This account has been disabled.";
        break;
      case "auth/user-not-found":
        errorMessage.value = "No account found with this email address.";
        break;
      case "auth/wrong-password":
        errorMessage.value = "Incorrect password. Please try again.";
        break;
      case "auth/invalid-credential":
        errorMessage.value = "User does not exist.";
        break;
      case "auth/too-many-requests":
        errorMessage.value =
          "Too many failed attempts. Please try again later.";
        break;
      case "auth/network-request-failed":
        errorMessage.value = "Network error. Please check your connection.";
        break;
      default:
        errorMessage.value =
          "An error occurred during login. Please try again.";
    }
  } finally {
    isLoading.value = false;
  }
};

const handleLoginWithGoogle = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  try {
    isGoogleLoading.value = true;

    const provider = new GoogleAuthProvider();
    // Use redirect for mobile browsers, popup for desktop
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    let result;
    if (isMobile) {
      await signInWithRedirect(auth, provider);
      return; // Redirect will handle the rest
    } else {
      result = await signInWithPopup(auth, provider);
    }
    const user = result.user;

    // Ensure Firestore user document exists
    const userRef = doc(firestore, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const emailValue = user.email || "";
      const usernameValue = emailValue
        ? emailValue.split("@")[0]
        : (user.displayName || "user").replace(/\s+/g, "").toLowerCase();
      await setDoc(userRef, {
        email: emailValue,
        username: usernameValue,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    logger.info("User logged in with Google successfully");
    router.push("/");
  } catch (error: any) {
    logger.error("Google login error:", error?.message || error);
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
          "An error occurred during Google login. Please try again.";
    }
  } finally {
    isGoogleLoading.value = false;
  }
};

const goToRegister = () => {
  router.push("/register");
};

const handleForgotPassword = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  // Validate email input
  if (!email.value.trim()) {
    errorMessage.value = "Please enter your email address first.";
    return;
  }

  try {
    isResettingPassword.value = true;

    // Get the current domain for the action URL
    const actionCodeSettings = {
      url: `${window.location.origin}/email-actions`,
      handleCodeInApp: true,
    };

    await sendPasswordResetEmail(auth, email.value.trim(), actionCodeSettings);

    successMessage.value = `Password reset email sent to ${email.value}! Check your inbox and follow the link to reset your password.`;
    logger.info("Password reset email sent to:", email.value);
  } catch (error: any) {
    logger.error("Password reset error:", error?.message || error);

    switch (error?.code) {
      case "auth/user-not-found":
        errorMessage.value = "No account found with this email address.";
        break;
      case "auth/invalid-email":
        errorMessage.value = "Invalid email address.";
        break;
      case "auth/too-many-requests":
        errorMessage.value = "Too many requests. Please try again later.";
        break;
      case "auth/network-request-failed":
        errorMessage.value = "Network error. Please check your connection.";
        break;
      default:
        errorMessage.value =
          "Failed to send password reset email. Please try again.";
    }
  } finally {
    isResettingPassword.value = false;
  }
};

// Handle redirect result for mobile Google sign-in
const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;

      // Ensure Firestore user document exists
      const userRef = doc(firestore, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const emailValue = user.email || "";
        const usernameValue = emailValue
          ? emailValue.split("@")[0]
          : (user.displayName || "user").replace(/\s+/g, "").toLowerCase();
        await setDoc(userRef, {
          email: emailValue,
          username: usernameValue,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      logger.info("User logged in with Google successfully (redirect)");
      router.push("/");
    }
  } catch (error: any) {
    logger.error("Google redirect login error:", error?.message || error);
    errorMessage.value =
      "An error occurred during Google login. Please try again.";
  }
};

// Check for redirect result on component mount
onMounted(() => {
  handleRedirectResult();
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
              Login
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-200">Welcome back</p>
          </div>
          <ion-button
            expand="block"
            class="ion-margin-top mt-8"
            :disabled="isLoading || isGoogleLoading || isResettingPassword"
            @click="handleLoginWithGoogle"
          >
            <ion-icon :icon="logoGoogle" class="mr-2"></ion-icon>
            <ion-spinner
              v-if="isGoogleLoading"
              name="crescent"
              class="ion-margin-end"
            ></ion-spinner>
            {{ isGoogleLoading ? "Signing in..." : "Continue with Google" }}
          </ion-button>

          <div class="flex items-center my-6">
            <div class="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
            <span class="px-3 text-sm text-gray-500 dark:text-gray-400"
              >Or continue with email</span
            >
            <div class="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
          </div>

          <form @submit.prevent="handleLogin">
            <ion-input
              v-model="email"
              class="ion-margin-bottom"
              type="text"
              :disabled="isLoading || isGoogleLoading || isResettingPassword"
              autocomplete="email"
              placeholder="Email"
              fill="outline"
              mode="md"
              required
            ></ion-input>

            <ion-input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :disabled="isLoading || isGoogleLoading || isResettingPassword"
              autocomplete="current-password"
              placeholder="Password"
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

            <div class="flex justify-end">
              <ion-button
                fill="clear"
                class="text-modal-text forgot-password-btn"
                :disabled="isLoading || isGoogleLoading || isResettingPassword"
                @click="handleForgotPassword"
              >
                <ion-spinner
                  v-if="isResettingPassword"
                  name="crescent"
                  class="ion-margin-end"
                ></ion-spinner>
                {{ isResettingPassword ? "Sending..." : "Forgot password?" }}
              </ion-button>
            </div>

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
              :disabled="isLoading || isGoogleLoading || isResettingPassword"
            >
              <ion-spinner
                v-if="isLoading"
                name="crescent"
                class="ion-margin-end"
              ></ion-spinner>
              {{ isLoading ? "Signing in..." : "Login" }}
            </ion-button>
          </form>

          <ion-button
            expand="block"
            fill="clear"
            @click="goToRegister"
            :disabled="isLoading || isGoogleLoading || isResettingPassword"
          >
            Don't have an account? Register
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.forgot-password-btn {
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 4px;
  --padding-bottom: 2px;
  min-height: auto;
  height: auto;
  font-size: 0.9rem;
}
</style>
