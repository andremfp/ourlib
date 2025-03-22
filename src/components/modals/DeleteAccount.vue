<template>
  <teleport to="body">
    <div
      v-if="localIsOpen"
      class="fixed inset-0 z-[50] flex items-center justify-center min-h-screen px-4"
    >
      <!-- Backdrop with fade transition -->
      <Transition name="fade" appear @after-leave="onModalLeave">
        <div v-if="!isModalLeaving" class="absolute inset-0 bg-black/20"></div>
      </Transition>

      <!-- Modal with animation -->
      <Transition name="modalAnim" appear>
        <div
          v-if="!isModalLeaving && props.isOpen"
          class="relative z-[51] w-full max-w-md bg-light-bg dark:bg-dark-nav rounded-xl p-4"
        >
          <!-- Modal header -->
          <div class="flex justify-between items-center">
            <h3
              class="text-modal-title font-semibold text-light-primary-text dark:text-dark-primary-text mb-4"
            >
              Delete Account
            </h3>
          </div>

          <!-- Confirmation message -->
          <p
            class="text-modal-text text-light-secondary-text dark:text-dark-secondary-text mb-4"
          >
            Are you sure you want to delete your account? This action cannot be
            undone.
          </p>

          <!-- Action buttons -->
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="closeModal"
              id="delete-account-cancel-btn"
              class="px-4 py-2 text-modal-button text-menu-blue bg-transparent rounded-lg"
            >
              Cancel
            </button>
            <button
              @click="deleteAccount"
              id="delete-account-confirm-btn"
              class="px-4 py-2 text-white bg-warning-red rounded-lg text-modal-button"
            >
              Delete
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { getAuth, deleteUser } from "firebase/auth";
import { useTabStore } from "@/stores/tabStore";
import { removeUser } from "@/apis/userAPI";
import logger from "@/utils/logger";

// ============= PROPS & EMITS =============
const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["close"]);

const auth = getAuth();
const router = useRouter();

// ============= ANIMATION STATE =============
const localIsOpen = ref(props.isOpen);
const isModalLeaving = ref(false);

// ============= WATCHERS =============
// Sync with parent's isOpen prop
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      // Open the modal
      localIsOpen.value = true;
      isModalLeaving.value = false;
    } else {
      // Start closing process
      startClosingProcess();
    }
  },
  { immediate: true },
);

// ============= ANIMATION HANDLING =============
/**
 * Start the closing process
 */
function startClosingProcess() {
  isModalLeaving.value = true;
}

/**
 * Complete the closing process after animations
 */
function onModalLeave() {
  localIsOpen.value = false;
  isModalLeaving.value = false;
  emit("close"); // Emit close only after animation completes
}

const closeModal = () => {
  startClosingProcess();
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
