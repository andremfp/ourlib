<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { getUser } from "@/apis/userAPI";
import logger from "@/utils/logger";
import { useTabStore } from "@/stores/tabStore";
import ChangePasswordForm from "./ChangePasswordForm.vue";
import DeleteAccount from "./DeleteAccount.vue";

const auth = getAuth();
const router = useRouter();
const username = ref<string | null>(null);
const loading = ref(true);
const showChangePasswordModal = ref(false);
const showDeleteModal = ref(false);

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
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUser(user.uid);
    } else {
      loading.value = false;
    }
  });
});

const logout = async () => {
  try {
    await signOut(auth);
    logger.info("User logged out");
    useTabStore().resetActiveTab();
    router.push("/");
  } catch (error: any) {
    logger.error("Logout error:", error.message);
  }
};
</script>

<template>
  <div class="mx-auto p-6 bg-light-bg dark:bg-dark-bg">
    <!-- User Info -->
    <div class="flex flex-col items-center pb-4">
      <!-- User Avatar -->
      <div
        class="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
      >
        <svg
          class="w-12 h-12 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          ></path>
        </svg>
      </div>
      <!-- Username -->
      <h1
        id="username"
        class="mt-4 text-xl font-semibold text-gray-800 dark:text-white"
      >
        <span v-if="!loading">{{ username }}</span>
        <span
          v-else
          id="username-loading-spinner"
          class="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"
        ></span>
      </h1>
    </div>

    <!-- Options -->
    <div class="mt-6">
      <button
        id="change-password-btn"
        @click="showChangePasswordModal = true"
        class="w-full flex items-center text-left text-gray-700 dark:text-gray-300 px-4 py-3 border-b border-gray-300 dark:border-gray-700"
      >
        <svg
          class="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          ></path>
        </svg>
        Change Password
      </button>
      <button
        id="delete-account-btn"
        @click="showDeleteModal = true"
        class="w-full flex items-center text-left text-red-600 font-bold px-4 py-3 border-b border-gray-300 dark:border-gray-700"
      >
        <svg
          class="w-5 h-5 mr-3 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          ></path>
        </svg>
        Delete Account
      </button>
    </div>

    <!-- Sign Out -->
    <div class="mt-8">
      <button
        id="sign-out-btn"
        @click="logout"
        class="w-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 px-4 py-3"
      >
        <svg
          class="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          ></path>
        </svg>
        Sign Out
      </button>
    </div>

    <!-- Change Password Modal -->
    <div
      v-if="showChangePasswordModal"
      id="change-password-modal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-light-bg dark:bg-dark-bg rounded-lg shadow-lg w-full max-w-md"
      >
        <ChangePasswordForm
          @close="showChangePasswordModal = false"
          id="change-password-form"
        />
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div
      v-if="showDeleteModal"
      id="delete-account-modal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-light-bg dark:bg-dark-bg rounded-lg shadow-lg w-full max-w-md p-6"
      >
        <DeleteAccount
          @close="showDeleteModal = false"
          id="delete-account-modal"
        />
      </div>
    </div>
  </div>
</template>
