<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
} from "@ionic/vue";
import { auth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import logger from "@/utils/logger";

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
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form @submit.prevent="handleLogin">
        <ion-list>
          <ion-item>
            <ion-input
              label="Username"
              label-placement="floating"
              type="text"
              v-model="username"
              :disabled="isLoading"
              autocomplete="username"
              placeholder="Enter your username"
              required
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-input
              label="Password"
              label-placement="floating"
              type="password"
              v-model="password"
              :disabled="isLoading"
              autocomplete="current-password"
              placeholder="Enter your password"
              required
            ></ion-input>
          </ion-item>
        </ion-list>

        <div v-if="errorMessage" class="ion-padding text-red-500 text-sm mt-2">
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
    </ion-content>
  </ion-page>
</template>
