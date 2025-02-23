<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
      Change Password
    </h2>
    <form @submit.prevent="changePassword">
      <!-- Username (hidden)-->
      <input
        type="text"
        id="username"
        name="username"
        autocomplete="username"
        aria-hidden="true"
        v-model="username"
        style="display: none"
      />
      <!-- Current Password -->
      <div class="mb-4">
        <label
          for="currentPassword"
          class="block font-bold text-gray-700 dark:text-gray-100"
          >Current Password</label
        >
        <input
          type="password"
          id="currentPassword"
          v-model="currentPassword"
          autocomplete="current-password"
          required
          class="block w-full px-4 py-2 mt-2 bg-white dark:bg-zinc-700 dark:placeholder:text-zinc-300 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-gray-500 dark:focus:ring-zinc-500 focus:ring-2 text-gray-800 dark:text-gray-100"
        />
      </div>
      <!-- New Password -->
      <div class="mb-4">
        <label
          for="newPassword"
          class="block font-bold text-gray-700 dark:text-gray-100"
          >New Password</label
        >
        <input
          type="password"
          id="newPassword"
          autocomplete="new-password"
          v-model="newPassword"
          required
          class="block w-full px-4 py-2 mt-2 bg-white dark:bg-zinc-700 dark:placeholder:text-zinc-300 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-gray-500 dark:focus:ring-zinc-500 focus:ring-2 text-gray-800 dark:text-gray-100"
        />
      </div>
      <!-- Confirm New Password -->
      <div class="mb-6">
        <label
          for="confirmNewPassword"
          class="block font-bold text-gray-700 dark:text-gray-100"
          >Confirm New Password</label
        >
        <input
          type="password"
          id="confirmNewPassword"
          autocomplete="new-password"
          v-model="confirmNewPassword"
          required
          class="block w-full px-4 py-2 mt-2 bg-white dark:bg-zinc-700 dark:placeholder:text-zinc-300 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-gray-500 dark:focus:ring-zinc-500 focus:ring-2 text-gray-800 dark:text-gray-100"
        />
      </div>
      <!-- Error Message -->
      <div v-if="errorMessage" class="text-red-500 text-sm mb-4">
        {{ errorMessage }}
      </div>
      <!-- Buttons -->
      <div class="flex gap-4">
        <button
          type="button"
          id="change-password-cancel-btn"
          @click="closeModal"
          class="w-full py-2 px-4 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Change Password
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { getUser } from "@/apis/userAPI";
import logger from "@/utils/logger";

const emit = defineEmits(["close"]);

const auth = getAuth();
const currentPassword = ref("");
const newPassword = ref("");
const confirmNewPassword = ref("");
const errorMessage = ref("");
const username = ref<string | null>(null);

const fetchUser = async (uid: string) => {
  try {
    const user = await getUser(uid);
    if (user) {
      username.value = user.username;
    } else {
      username.value = "Unknown User";
    }
  } catch (error: any) {
    logger.error("Error fetching user:", error.message);
    username.value = "Unknown User";
  }
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUser(user.uid);
    }
  });
});

const closeModal = () => {
  emit("close");
};

const changePassword = async () => {
  errorMessage.value = "";

  if (newPassword.value !== confirmNewPassword.value) {
    errorMessage.value = "New passwords do not match.";
    return;
  }

  const user = auth.currentUser;
  if (!user || !user.email) {
    errorMessage.value = "User not authenticated.";
    return;
  }

  try {
    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword.value,
    );
    await reauthenticateWithCredential(user, credential);

    // Update the password
    await updatePassword(user, newPassword.value);
    alert("Password updated successfully!");
    closeModal();
  } catch (error: any) {
    logger.error("Error changing password:", error.message);
    errorMessage.value =
      "Failed to change password. Please check your current password and try again.";
  }
};
</script>
