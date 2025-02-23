<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { auth, firestore } from "../firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import logger from "@/utils/logger";

const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const router = useRouter();

const register = async () => {
  errorMessage.value = "";

  // Check if passwords match
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match.";
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

    await signOut(auth);
    router.push("/");
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
</script>

<template>
  <div
    class="flex items-center justify-center min-h-full bg-light-bg dark:bg-dark-nav"
  >
    <!-- Login Form Section -->
    <div class="w-full max-w-md px-6 py-10">
      <div class="text-center">
        <h1 class="text-2xl font-bold mt-4 text-gray-800 dark:text-gray-100">
          Sign up
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-200">
          to start your library
        </p>
      </div>

      <form @submit.prevent="register" class="mt-8 space-y-6">
        <div>
          <label
            for="username"
            class="block font-bold text-gray-700 dark:text-gray-100"
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
            autocomplete="new-password"
            required
          />
        </div>

        <div>
          <label
            for="confirmPassword"
            class="block font-bold text-gray-700 dark:text-gray-100"
          >
            Repeat Password
          </label>
          <input
            v-model="confirmPassword"
            id="confirmPassword"
            type="password"
            class="block w-full px-4 py-2 mt-2 bg-white dark:bg-zinc-700 dark:placeholder:text-zinc-300 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-gray-500 dark:focus:ring-zinc-500 focus:ring-2 text-gray-800 dark:text-gray-100"
            placeholder="Repeat your password"
            autocomplete="new-password"
            required
          />
        </div>

        <div v-if="errorMessage" class="text-red-500 text-sm mt-2">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Create Account
        </button>
      </form>
      <p class="mt-4 text-center text-gray-600 dark:text-zinc-300 text-sm">
        Already have an account?
        <router-link
          to="/"
          class="text-blue-500 underline"
          aria-label="Go to login page"
        >
          Sign in
        </router-link>
      </p>
    </div>
  </div>
</template>
