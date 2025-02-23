<template>
  <div>
    <h2 class="text-lg font-semibold text-gray-800 dark:text-white">
      Confirm Account Deletion
    </h2>
    <p class="mt-2 text-gray-600 dark:text-gray-300">
      Are you sure you want to delete your account? This action is irreversible.
    </p>
    <div class="mt-4 flex justify-end gap-3">
      <button
        type="button"
        @click="closeModal"
        id="delete-account-cancel-btn"
        class="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg"
      >
        Cancel
      </button>
      <button
        @click="deleteAccount"
        id="delete-account-confirm-btn"
        class="px-4 py-2 bg-red-600 text-white rounded-lg"
      >
        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { getAuth, deleteUser } from "firebase/auth";
import { useTabStore } from "@/stores/tabStore";
import { removeUser } from "@/apis/userAPI";
import logger from "@/utils/logger";

const emit = defineEmits(["close"]);

const auth = getAuth();
const router = useRouter();

const closeModal = () => {
  emit("close");
};

const deleteAccount = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await removeUser(user.uid);
    await deleteUser(user);
    closeModal();
    useTabStore().resetActiveTab();
    router.push("/");
  } catch (error: any) {
    logger.error("Account deletion error:", error.message);
  }
};
</script>
