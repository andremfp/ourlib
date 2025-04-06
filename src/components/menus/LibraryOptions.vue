<script setup lang="ts">
import { ref, watch, computed } from "vue";
import RenameLibraryModal from "@/components/modals/RenameLibrary.vue";
import DeleteLibraryModal from "@/components/modals/DeleteLibrary.vue";

// ============= PROPS & EMITS =============
const props = defineProps<{
  isOpen: boolean;
  libraryName: string;
}>();

const emit = defineEmits<{
  close: [];
  rename: [newName: string];
  delete: [];
}>();

// ============= STATE =============
// Core visibility state
const localIsOpen = ref(props.isOpen);
const isMenuClosing = ref(false);

// Modal visibility state
const showRenameModal = ref(false);
const showDeleteModal = ref(false);
const isRenameModalLeaving = ref(false);
const isDeleteModalLeaving = ref(false);

// Display menu content only when no modals are visible or leaving
const showMenuContent = computed(() => {
  return (
    !showRenameModal.value &&
    !showDeleteModal.value &&
    !isMenuClosing.value &&
    !isRenameModalLeaving.value &&
    !isDeleteModalLeaving.value
  );
});

// ============= WATCHERS =============
// Sync with parent's isOpen prop
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      // Open the menu
      localIsOpen.value = true;
      isMenuClosing.value = false;
    } else {
      // Close the menu
      startClosingProcess();
    }
  },
);

// ============= MENU MANAGEMENT =============
// Start the closing process for the entire menu
function startClosingProcess() {
  // Hide any open modals
  showRenameModal.value = false;
  showDeleteModal.value = false;

  // Mark menu as closing to trigger animations
  isMenuClosing.value = true;
}

// Complete closing after animations finish
function onMenuLeave() {
  // Clean up all state
  localIsOpen.value = false;
  isMenuClosing.value = false;
  isRenameModalLeaving.value = false;
  isDeleteModalLeaving.value = false;
}

// ============= MODAL MANAGEMENT =============
// Open modals
function openRenameModal() {
  showRenameModal.value = true;
}

function openDeleteModal() {
  showDeleteModal.value = true;
}

// Close modals with animation
function closeRenameModal() {
  isRenameModalLeaving.value = true;
  showRenameModal.value = false;
  emit("close");
}

function closeDeleteModal() {
  isDeleteModalLeaving.value = true;
  showDeleteModal.value = false;
  emit("close");
}

// Modal transition complete handlers
function onRenameModalLeave() {
  isRenameModalLeaving.value = false;
}

function onDeleteModalLeave() {
  isDeleteModalLeaving.value = false;
}

// ============= EVENT HANDLERS =============
// Main menu actions
function handleCancel() {
  emit("close");
}

function handleRename(newName: string) {
  emit("rename", newName);
  closeRenameModal();
}

function handleDelete() {
  emit("delete");
  closeDeleteModal();
}
</script>

<template>
  <teleport to="body">
    <div v-if="localIsOpen" class="fixed inset-0 z-[100]">
      <!-- Backdrop with fade transition -->
      <Transition name="fade" appear @after-leave="onMenuLeave">
        <div
          v-if="!isMenuClosing"
          class="absolute inset-0 bg-black/20"
          @click="handleCancel"
        ></div>
      </Transition>

      <!-- Menu with slide-up transition -->
      <div
        class="absolute bottom-0 left-0 right-0 px-4 pb-footer-padding flex justify-center"
      >
        <Transition name="slide-up" appear>
          <div v-if="showMenuContent" class="w-full max-w-md">
            <div class="flex flex-col gap-2">
              <!-- Library options panel -->
              <div
                class="bg-light-bg/80 dark:bg-dark-nav/80 backdrop-blur-lg rounded-xl w-full overflow-hidden"
              >
                <!-- Library name header -->
                <div
                  class="p-2 text-menu-text text-center text-light-secondary-text dark:text-dark-secondary-text"
                >
                  {{ libraryName }}
                </div>

                <!-- Rename option -->
                <div
                  class="border-t border-hairline border-black/5 dark:border-white/10"
                >
                  <button
                    class="w-full py-4 text-center text-menu-title text-menu-blue"
                    @click="openRenameModal"
                  >
                    Rename
                  </button>
                </div>

                <!-- Delete option -->
                <div
                  class="border-t border-hairline border-black/5 dark:border-white/10"
                >
                  <button
                    class="w-full py-4 text-center text-warning-red text-menu-title"
                    @click="openDeleteModal"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <!-- Cancel button -->
              <div
                class="bg-light-bg dark:bg-dark-nav rounded-xl w-full overflow-hidden"
              >
                <button
                  class="w-full py-3 text-center text-menu-title text-menu-blue"
                  @click="handleCancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Rename modal with transition -->
      <div v-if="showRenameModal || isRenameModalLeaving">
        <Transition name="modalAnim" appear @after-leave="onRenameModalLeave">
          <RenameLibraryModal
            v-if="showRenameModal"
            :is-open="showRenameModal"
            :library-name="libraryName"
            @close="closeRenameModal"
            @rename="handleRename"
          />
        </Transition>
      </div>

      <!-- Delete modal with transition -->
      <div v-if="showDeleteModal || isDeleteModalLeaving">
        <Transition name="modalAnim" appear @after-leave="onDeleteModalLeave">
          <DeleteLibraryModal
            v-if="showDeleteModal"
            :is-open="showDeleteModal"
            :library-name="libraryName"
            @close="closeDeleteModal"
            @delete="handleDelete"
          />
        </Transition>
      </div>
    </div>
  </teleport>
</template>
<style>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide-up transition for menu */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* Modal transition */
.modalAnim-enter-active,
.modalAnim-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modalAnim-enter-from,
.modalAnim-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modalAnim-enter-to,
.modalAnim-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
