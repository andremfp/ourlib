<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { modalController, alertController } from "@ionic/vue";
import EditBookModal from "@/components/modals/EditBook.vue";
import type { Book } from "@/schema";

// ============= PROPS & EMITS =============
const props = defineProps<{
  isOpen: boolean;
  book: Book;
}>();

const emit = defineEmits<{
  close: [];
  closed: [];
  edit: [updatedBook: Book];
  delete: [];
}>();

// ============= STATE =============
const localIsOpen = ref(props.isOpen);
const isMenuClosing = ref(false);
const pendingAction = ref<"edit" | "delete" | null>(null);

const showMenuContent = computed(() => !isMenuClosing.value);

// ============= WATCHERS =============
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      localIsOpen.value = true;
      isMenuClosing.value = false;
    } else {
      startClosingProcess();
    }
  },
);

// ============= MENU MANAGEMENT =============
function startClosingProcess() {
  isMenuClosing.value = true;
}

function onMenuLeave() {
  localIsOpen.value = false;
  isMenuClosing.value = false;
  emit("closed");

  if (pendingAction.value === "edit") {
    pendingAction.value = null;
    void presentEditModal();
  } else if (pendingAction.value === "delete") {
    pendingAction.value = null;
    void presentDeleteAlert();
  }
}

// ============= MODAL MANAGEMENT =============
async function presentEditModal() {
  try {
    const modal = await modalController.create({
      component: EditBookModal,
      componentProps: {
        book: props.book,
      },
      cssClass: "generic-modal",
      backdropDismiss: true,
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === "edited" && data) {
      handleEdit(data);
    }
  } catch (error) {
    console.error("Error opening edit modal:", error);
  }
}

function openEditModal() {
  pendingAction.value = "edit";
  startClosingProcess();
  emit("close");
}

async function presentDeleteAlert() {
  try {
    const alert = await alertController.create({
      header: "Delete Book",
      message: `Are you sure you want to delete "${props.book.title}"? This cannot be undone.`,
      cssClass: "generic-modal",
      buttons: [
        { text: "Cancel", role: "cancel" },
        {
          text: "Delete",
          role: "destructive",
          handler: handleDelete,
        },
      ],
    });
    await alert.present();
  } catch (error) {
    console.error("Error opening delete alert:", error);
  }
}

function openDeleteModal() {
  pendingAction.value = "delete";
  startClosingProcess();
  emit("close");
}

// ============= EVENT HANDLERS =============
function handleCancel() {
  startClosingProcess();
  emit("close");
}

function handleEdit(updatedBook: Book) {
  emit("edit", updatedBook);
}

function handleDelete() {
  emit("delete");
}
</script>

<template>
  <teleport to="body">
    <div v-if="localIsOpen" class="fixed inset-0 z-[100]">
      <!-- Backdrop -->
      <Transition name="fade" appear @after-leave="onMenuLeave">
        <div
          v-if="!isMenuClosing"
          class="absolute inset-0 bg-black/20"
          @click="handleCancel"
        ></div>
      </Transition>

      <!-- Menu -->
      <div
        class="absolute bottom-0 left-0 right-0 px-4 pb-footer-padding flex justify-center"
      >
        <Transition name="slide-up" appear>
          <div v-if="showMenuContent" class="w-full max-w-md">
            <div class="flex flex-col gap-2">
              <!-- Options panel -->
              <div
                class="bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-lg rounded-xl w-full overflow-hidden"
              >
                <!-- Book title header -->
                <div
                  class="p-2 text-menu-text text-center text-light-secondary-text dark:text-dark-secondary-text truncate"
                >
                  {{ book.title }}
                </div>

                <!-- Edit option -->
                <div
                  class="border-t border-hairline border-black/5 dark:border-white/10"
                >
                  <button
                    class="w-full py-4 text-center text-menu-title text-menu-blue"
                    @click="openEditModal"
                  >
                    Edit Book Details
                  </button>
                </div>

                <!-- Delete option -->
                <div
                  class="border-t border-hairline border-black/5 dark:border-white/10"
                >
                  <button
                    class="w-full py-4 text-center text-danger-red text-menu-title"
                    @click="openDeleteModal"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <!-- Cancel button -->
              <div
                class="bg-light-bg dark:bg-dark-bg rounded-xl w-full overflow-hidden"
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
    </div>
  </teleport>
</template>

<style scoped>
/* Scoped styles can be added here if needed */
.pb-footer-padding {
  padding-bottom: calc(env(safe-area-inset-bottom, 1rem));
}
</style>
