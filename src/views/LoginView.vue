<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const router = useRouter();

// Login handler
const login = async () => {
  errorMessage.value = "";
  try {
    // Just expose username to frontend
    const dummyEmail = username.value + "@dummy.com";
    await signInWithEmailAndPassword(auth, dummyEmail, password.value);
    console.log("User logged in successfully");

    // Redirect to main page
    await router.push("/about");
  } catch (error: any) {
    console.error("Login error:", error.message);

    // Set user-friendly error message
    switch (error.code) {
      case "auth/invalid-credential":
        errorMessage.value = "Incorrect password. Please try again.";
        break;
      default:
        errorMessage.value = "An error occurred. Please try again.";
    }
  }
};
</script>

<template>
  <div
    class="h-screen w-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
  >
    <!-- Login Form Section -->
    <div
      class="w-full max-w-md px-6 py-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg"
    >
      <div class="text-center">
        <img
          class="w-auto h-10 sm:h-12 mx-auto"
          src="https://merakiui.com/images/logo.svg"
          alt="Logo"
        />
        <h1 class="text-2xl font-bold mt-4 text-gray-800 dark:text-gray-200">
          Sign In
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Log in to your account and get started.
        </p>
      </div>

      <form @submit.prevent="login" class="mt-8 space-y-6">
        <div>
          <label
            for="username"
            class="block text-sm text-gray-700 dark:text-gray-300"
          >
            Username
          </label>
          <input
            v-model="username"
            id="username"
            type="text"
            class="block w-full px-4 py-2 mt-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-200"
            placeholder="Enter your username"
            required
          />
        </div>

        <div>
          <label
            for="password"
            class="block text-sm text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <input
            v-model="password"
            id="password"
            type="password"
            class="block w-full px-4 py-2 mt-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-200"
            placeholder="Enter your password"
            required
          />
        </div>

        <div v-if="errorMessage" class="text-red-500 text-sm mt-2">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition duration-200"
        >
          Sign In
        </button>
      </form>

      <p class="mt-4 text-center text-gray-600 dark:text-gray-400 text-sm">
        Don't have an account?
        <router-link to="/register" class="text-blue-500 hover:underline">
          Sign up
        </router-link>
      </p>
    </div>
  </div>
</template>
