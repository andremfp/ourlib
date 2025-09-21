<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonSpinner,
} from "@ionic/vue";
import { auth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import logger from "@/utils/logger";
import logoLight from "@/assets/ourlib-logo.webp";
import logoDark from "@/assets/ourlib-logo-dark.webp";

const router = useRouter();
const username = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

const validateInputs = (): { valid: boolean; message: string } => {
  if (!username.value.trim()) {
    return { valid: false, message: "Username is required." };
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
    await signInWithEmailAndPassword(
      auth,
      username.value.trim() + "@dummy.com",
      password.value,
    );

    logger.info("User logged in successfully");
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
        errorMessage.value = "Invalid email or password.";
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

          <form @submit.prevent="handleLogin" class="mt-8 space-y-4">
            <ion-input
              v-model="username"
              type="text"
              :disabled="isLoading"
              autocomplete="username"
              placeholder="Username"
              fill="outline"
              mode="md"
              required
            ></ion-input>

            <ion-input
              v-model="password"
              type="password"
              :disabled="isLoading"
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
              :disabled="isLoading"
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
            :disabled="isLoading"
          >
            Create an account
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
