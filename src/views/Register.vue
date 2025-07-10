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
  IonNote,
} from "@ionic/vue";
import { auth, firestore } from "../firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import logger from "@/utils/logger";
import { UI_LIMITS } from "@/constants/constants";

const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const router = useRouter();

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
    const dummyEmail = username.value + "@dummy.com";
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      dummyEmail,
      password.value,
    );
    const user = userCredential.user;

    logger.info("User registered successfully");

    // Store user information in Firestore
    const userRef = doc(firestore, "users", user.uid);
    await setDoc(userRef, {
      username: username.value,
      createdAt: new Date(),
    });

    logger.info("User data stored, signing out and redirecting to Login");
    await signOut(auth);
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
      default:
        errorMessage.value = "An error occurred. Please try again.";
    }
  }
};

const goToLogin = () => {
  router.push("/login");
};
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Sign Up</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="text-center">
        <h1 class="text-2xl font-bold mt-4 text-gray-800 dark:text-gray-100">
          Sign up
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-200">
          to start your library
        </p>
      </div>

      <form @submit.prevent="register" class="mt-8 space-y-6">
        <ion-list>
          <ion-item>
            <ion-input
              label="Username"
              label-placement="floating"
              v-model="username"
              id="username"
              type="text"
              placeholder="Enter your username"
              autocomplete="username"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-input
              label="Password"
              label-placement="floating"
              v-model="password"
              id="password"
              type="password"
              placeholder="Enter your password"
              autocomplete="new-password"
              required
            ></ion-input>
          </ion-item>
          <ion-note class="ion-padding-start">
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

          <ion-item>
            <ion-input
              label="Repeat Password"
              label-placement="floating"
              v-model="confirmPassword"
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              autocomplete="new-password"
              required
            ></ion-input>
          </ion-item>
        </ion-list>

        <div v-if="errorMessage" class="ion-padding text-red-500 text-sm mt-2">
          {{ errorMessage }}
        </div>

        <ion-button type="submit" expand="block" class="ion-margin-top">
          Create Account
        </ion-button>
      </form>
      <ion-button expand="block" fill="clear" @click="goToLogin">
        Already have an account? Sign in
      </ion-button>
    </ion-content>
  </ion-page>
</template>
