<script setup lang="ts">
import { ref } from "vue";
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
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import logger from "@/utils/logger";
import logoLight from "@/assets/ourlib-logo.webp";
import logoDark from "@/assets/ourlib-logo-dark.webp";
import { logoGoogle } from "ionicons/icons";

const router = useRouter();
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);
const isGoogleLoading = ref(false);

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
          await m.sendEmailVerification(currentUser);
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
  try {
    isGoogleLoading.value = true;

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
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
            :disabled="isLoading || isGoogleLoading"
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

          <form @submit.prevent="handleLogin" class="space-y-4">
            <ion-input
              v-model="email"
              type="text"
              :disabled="isLoading || isGoogleLoading"
              autocomplete="email"
              placeholder="Email"
              fill="outline"
              mode="md"
              required
            ></ion-input>

            <ion-input
              v-model="password"
              type="password"
              :disabled="isLoading || isGoogleLoading"
              autocomplete="current-password"
              placeholder="Password"
              fill="outline"
              mode="md"
              required
            ></ion-input>

            <div v-if="errorMessage" class="text-red-500 text-sm">
              {{ errorMessage }}
            </div>

            <ion-button
              type="submit"
              expand="block"
              class="ion-margin-top"
              :disabled="isLoading || isGoogleLoading"
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
            :disabled="isLoading || isGoogleLoading"
          >
            Don't have an account? Register
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
