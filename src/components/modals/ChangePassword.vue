<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import {
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { getUser } from "@/apis/userAPI";
import logger from "@/utils/logger";
import { UI_LIMITS } from "@/constants/constants";

// ============= PROPS & EMITS =============
const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["close"]);

const auth = getAuth();
const currentPassword = ref("");
const newPassword = ref("");
const confirmNewPassword = ref("");
const errorMessage = ref("");
const username = ref<string | null>(null);

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
      // Reset form fields when opening
      currentPassword.value = "";
      newPassword.value = "";
      confirmNewPassword.value = "";
      errorMessage.value = "";
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
  startClosingProcess();
};

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

const changePassword = async () => {
  errorMessage.value = "";

  // Check if passwords match
  if (newPassword.value !== confirmNewPassword.value) {
    errorMessage.value = "New passwords do not match.";
    return;
  }

  // Validate new password
  const validation = validatePassword(newPassword.value);
  if (!validation.valid) {
    errorMessage.value = validation.message;
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
              Change Password
            </h3>
          </div>

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
                class="block text-modal-text text-light-secondary-text dark:text-dark-secondary-text mb-1"
              >
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                v-model="currentPassword"
                autocomplete="current-password"
                required
                class="w-full px-3 py-2 text-modal-text bg-light-card dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg text-light-primary-text dark:text-dark-primary-text focus:outline-none"
              />
            </div>

            <!-- New Password -->
            <div class="mb-4">
              <label
                for="newPassword"
                class="block text-modal-text text-light-secondary-text dark:text-dark-secondary-text mb-1"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                autocomplete="new-password"
                v-model="newPassword"
                required
                class="w-full px-3 py-2 text-modal-text bg-light-card dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg text-light-primary-text dark:text-dark-primary-text focus:outline-none"
              />
              <div
                class="mt-1 text-xs text-light-secondary-text dark:text-dark-secondary-text"
              >
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
            </div>

            <!-- Confirm New Password -->
            <div class="mb-4">
              <label
                for="confirmNewPassword"
                class="block text-modal-text text-light-secondary-text dark:text-dark-secondary-text mb-1"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                autocomplete="new-password"
                v-model="confirmNewPassword"
                required
                class="w-full px-3 py-2 text-modal-text bg-light-card dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg text-light-primary-text dark:text-dark-primary-text focus:outline-none"
              />
            </div>

            <!-- Error Message -->
            <div
              v-if="errorMessage"
              class="mt-1 text-sm text-red-600 dark:text-red-400 mb-4"
            >
              {{ errorMessage }}
            </div>

            <!-- Action buttons -->
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                id="change-password-cancel-btn"
                @click="closeModal"
                class="px-4 py-2 text-modal-button text-menu-blue bg-transparent rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-white bg-menu-blue rounded-lg text-modal-button"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </Transition>
    </div>
  </teleport>
</template>
