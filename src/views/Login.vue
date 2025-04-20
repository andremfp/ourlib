<script setup lang="ts">
import { ref } from "vue";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useViewStore } from "@/stores/viewStore";
import logger from "@/utils/logger";

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const auth = getAuth();
const viewStore = useViewStore();

// Login handler
const login = async () => {
  errorMessage.value = "";

  // Check if the user is already logged in
  if (auth.currentUser) {
    logger.info("User is already logged in, setting view to Main");
    viewStore.setView("Main");
    return;
  }

  try {
    // Just expose username to frontend
    const dummyEmail = username.value + "@dummy.com";
    await signInWithEmailAndPassword(auth, dummyEmail, password.value);
    logger.info("User logged in successfully, setting view to Main");

    viewStore.setView("Main");
  } catch (error: any) {
    logger.error("Login error:", error.message);

    // Set user-friendly error message
    switch (error.code) {
      case "auth/invalid-credential":
        errorMessage.value = "Incorrect password. Please try again.";
        break;
      case "auth/invalid-email":
        errorMessage.value = "Invalid username. Please try again.";
        break;
      default:
        errorMessage.value = "An error occurred. Please try again.";
    }
  }
};

// Function to switch to Register view
const goToRegister = () => {
  viewStore.setView("Register");
};
</script>

<template>
  <div
    class="flex items-center justify-center min-h-full bg-light-bg dark:bg-dark-nav"
  >
    <!-- Login Form Section -->
    <div class="w-full max-w-md px-6 py-10">
      <div class="text-center">
        <img
          class="mx-auto scale-90 dark:hidden"
          src="@/assets/ourlib-logo.webp"
          alt="Logo"
          width="500"
          height="150"
        />
        <img
          class="mx-auto scale-90 height-150px width-500px hidden dark:block"
          src="@/assets/ourlib-logo-dark.webp"
          alt="Logo Dark"
          width="500"
          height="150"
        />

        <h1 class="text-2xl font-bold mt-4 text-gray-800 dark:text-gray-100">
          Sign in
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-200">
          to access your libraries
        </p>
      </div>

      <form @submit.prevent="login" class="mt-8 space-y-6">
        <div>
          <label
            for="username"
            class="block font-bold text-black dark:text-gray-100"
          >
            Username
          </label>
          <input
            v-model="username"
            id="username"
            type="text"
            class="block w-full px-4 py-2 mt-2 bg-white dark:bg-zinc-700 dark:placeholder:text-zinc-300 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-gray-500 dark:focus:ring-zinc-500 focus:ring-2 text-gray-800 dark:text-gray-100"
            placeholder="Enter your username"
            autocomplete="username"
            required
          />
        </div>

        <div>
          <label
            for="password"
            class="block font-bold text-gray-700 dark:text-gray-100"
          >
            Password
          </label>
          <input
            v-model="password"
            id="password"
            type="password"
            class="block w-full px-4 py-2 mt-2 bg-white dark:bg-zinc-700 dark:placeholder:text-zinc-300 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-gray-500 dark:focus:ring-zinc-500 focus:ring-2 text-gray-800 dark:text-gray-100"
            placeholder="Enter your password"
            autocomplete="current-password"
            required
          />
        </div>

        <div v-if="errorMessage" class="text-red-500 text-sm mt-2">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-500 text-white rounded-lg"
        >
          Sign In
        </button>
      </form>

      <p class="mt-4 text-center text-gray-600 dark:text-zinc-300 text-sm">
        Don't have an account?
        <button
          type="button"
          @click="goToRegister"
          class="text-blue-500 underline bg-transparent border-none cursor-pointer p-0 m-0 align-baseline"
          aria-label="Go to registration page"
        >
          Sign up
        </button>
      </p>
    </div>
  </div>
</template>
