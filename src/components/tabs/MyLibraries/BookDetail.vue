<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="" defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ truncatedTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openOptions">
            <ion-icon :icon="ellipsisHorizontal"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center h-full">
        <ion-spinner name="crescent"></ion-spinner>
        <span class="ml-2">Loading book details...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-4 text-center">
        <p class="text-red-500 mb-4">{{ error }}</p>
        <ion-button @click="fetchBookData">Try Again</ion-button>
      </div>

      <!-- Book Details -->
      <div v-else-if="book" class="p-4">
        <!-- Thumbnail -->
        <div class="flex justify-center mb-6">
          <div
            class="w-40 h-60 bg-light-border dark:bg-dark-border rounded-lg flex items-center justify-center overflow-hidden shadow-lg"
          >
            <img
              v-if="book.thumbnailUrl"
              :src="book.thumbnailUrl"
              alt="Book cover"
              class="w-full h-full object-cover"
            />
            <ion-icon
              v-else
              :icon="bookOutline"
              class="w-24 h-24 text-light-secondary-text dark:text-dark-secondary-text"
            ></ion-icon>
          </div>
        </div>

        <!-- Title and Authors -->
        <div class="text-center mb-6">
          <h1
            class="text-2xl font-bold text-light-primary-text dark:text-dark-primary-text"
          >
            {{ book.title }}
          </h1>
          <p
            class="text-md text-light-secondary-text dark:text-dark-secondary-text mt-1"
          >
            {{ book.authors?.join(", ") || "Unknown Author" }}
          </p>
        </div>

        <!-- Book Info Grid -->
        <div class="grid grid-cols-2 gap-4 text-center">
          <div>
            <p
              class="text-sm text-light-secondary-text dark:text-dark-secondary-text"
            >
              Language
            </p>
            <p
              class="font-medium text-light-primary-text dark:text-dark-primary-text"
            >
              {{ book.language || "N/A" }}
            </p>
          </div>
          <div>
            <p
              class="text-sm text-light-secondary-text dark:text-dark-secondary-text"
            >
              Pages
            </p>
            <p
              class="font-medium text-light-primary-text dark:text-dark-primary-text"
            >
              {{ book.pages || "N/A" }}
            </p>
          </div>
          <div>
            <p
              class="text-sm text-light-secondary-text dark:text-dark-secondary-text"
            >
              Publisher
            </p>
            <p
              class="font-medium text-light-primary-text dark:text-dark-primary-text"
            >
              {{ book.publisher || "N/A" }}
            </p>
          </div>
          <div>
            <p
              class="text-sm text-light-secondary-text dark:text-dark-secondary-text"
            >
              Published
            </p>
            <p
              class="font-medium text-light-primary-text dark:text-dark-primary-text"
            >
              {{ book.publishDate || "N/A" }}
            </p>
          </div>
        </div>

        <!-- Date Added -->
        <div class="text-center mt-6">
          <p
            class="text-sm text-light-secondary-text dark:text-dark-secondary-text"
          >
            Date Added to Library
          </p>
          <p
            class="font-medium text-light-primary-text dark:text-dark-primary-text"
          >
            {{ formattedDateAdded }}
          </p>
        </div>
      </div>
    </ion-content>
    <!-- Options Menu -->
    <BookOptions
      v-if="book"
      :isOpen="isOptionsOpen"
      :book="book"
      @close="closeOptions"
      @closed="onOptionsClosed"
      @edit="handleEdit"
      @delete="handleDeleteBook"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import {
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonButton,
  IonIcon,
} from "@ionic/vue";
import { bookOutline, ellipsisHorizontal } from "ionicons/icons";
import { getBook, deleteBook, updateBook } from "@/apis/bookAPI";
import type { Book } from "@/schema";
import BookOptions from "@/components/menus/BookOptions.vue";

// ============= Props =============
const props = defineProps<{
  bookId: string;
  libraryId: string;
}>();

// ============= State =============
const book = ref<Book | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isOptionsOpen = ref(false);

// ============= Computed Properties =============
const truncatedTitle = computed(() => {
  if (!book.value) return "Book Details";
  return book.value.title;
});

const formattedDateAdded = computed(() => {
  if (book.value?.createdAt) {
    return book.value.createdAt.toDate().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return "N/A";
});

// ============= Data Fetching =============
const fetchBookData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const fetchedBook = await getBook(props.bookId);
    if (fetchedBook) {
      book.value = fetchedBook;
    } else {
      throw new Error("Book not found.");
    }
  } catch (e: any) {
    error.value = e.message || "Failed to load book details.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchBookData();
});

// ============= Options Menu Management =============
const openOptions = () => {
  isOptionsOpen.value = true;
};
const closeOptions = () => {
  // Parent requests close; child will emit `closed` after transition
};

const onOptionsClosed = () => {
  isOptionsOpen.value = false;
};

const handleEdit = async (updatedBook: Book) => {
  if (!book.value) return;
  try {
    await updateBook(book.value.id, updatedBook);
    book.value = { ...book.value, ...updatedBook };
    // Inform list view to update item immediately
    window.dispatchEvent(
      new CustomEvent("ourlib:bookUpdated", {
        detail: { bookId: book.value.id, updatedBook },
      }),
    );
    closeOptions();
  } catch (e) {
    console.error("Failed to update book:", e);
  }
};

const handleDeleteBook = async () => {
  if (!book.value) return;
  try {
    await deleteBook(book.value.id, props.libraryId);
    closeOptions();

    // Inform list view to update counts immediately
    window.dispatchEvent(new CustomEvent("ourlib:refreshLibraries"));
    // Inform the detail view to remove the book from its local state
    window.dispatchEvent(
      new CustomEvent("ourlib:bookDeleted", {
        detail: { bookId: book.value.id },
      }),
    );

    // Navigate back
    const nav = document.querySelector("ion-nav");
    if (nav) {
      nav.pop();
    }
  } catch (e) {
    console.error("Failed to delete book:", e);
  }
};
</script>

// TODO - delete book does not refresh library, book still appears in list and
book count is not updated. // TODO - check same for edit book. modal not correct
