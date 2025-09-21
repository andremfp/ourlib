<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonButton,
  modalController,
  alertController,
} from "@ionic/vue";
import {
  keyOutline,
  trashOutline,
  logOutOutline,
  personCircleOutline,
} from "ionicons/icons";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  deleteUser,
} from "firebase/auth";
import { getUser, removeUser } from "@/apis/userAPI";
import logger from "@/utils/logger";
import ChangePasswordForm from "@/components/modals/ChangePassword.vue";
import { useTabStore } from "@/stores/tabStore";

const auth = getAuth();
const router = useRouter();
const username = ref<string | null>(null);
const loading = ref(true);
const tabStore = useTabStore();

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

const openChangePasswordModal = async () => {
  const modal = await modalController.create({
    component: ChangePasswordForm,
    cssClass: "generic-modal",
  });
  modal.present();
};

const openDeleteAccountModal = async () => {
  const alert = await alertController.create({
    header: "Delete Account",
    message:
      "Are you sure you want to delete your account? This action cannot be undone.",
    cssClass: "generic-modal",
    buttons: [
      {
        text: "Cancel",
        role: "cancel",
      },
      {
        text: "Delete",
        role: "destructive",
        handler: () => {
          deleteAccount();
        },
      },
    ],
  });
  await alert.present();
};

const deleteAccount = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await removeUser(user.uid); // API call to delete user data from Firestore
    await deleteUser(user); // Firebase auth call to delete the user
    tabStore.resetActiveTab();
    router.push("/login"); // Redirect to login after deletion
  } catch (error: any) {
    logger.error("Account deletion error:", error.message);
    // Optionally, show an error alert here
  }
};

const handleLogout = async () => {
  const auth = getAuth();
  const tabStore = useTabStore();
  try {
    await signOut(auth);
    logger.debug("[Profile.vue] Calling tabStore.resetActiveTab()");
    tabStore.resetActiveTab();
    logger.info("User logged out successfully");
    router.push("/login");
  } catch (error: any) {
    logger.error("Logout error:", error.message);
  }
};
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ tabStore.activeTab }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="ion-padding flex flex-col items-center pb-4">
        <ion-icon
          :icon="personCircleOutline"
          class="w-24 h-24 text-gray-500 dark:text-gray-400"
        ></ion-icon>
        <h1 class="mt-4 text-xl font-semibold text-gray-800 dark:text-white">
          <span v-if="!loading">{{ username }}</span>
          <ion-spinner v-else name="crescent"></ion-spinner>
        </h1>
      </div>

      <ion-list :inset="true">
        <ion-item button @click="openChangePasswordModal">
          <ion-icon :icon="keyOutline" slot="start"></ion-icon>
          <ion-label>Change Password</ion-label>
        </ion-item>
        <ion-item button @click="openDeleteAccountModal">
          <ion-icon :icon="trashOutline" slot="start" color="danger"></ion-icon>
          <ion-label color="danger">Delete Account</ion-label>
        </ion-item>
      </ion-list>

      <div class="ion-padding">
        <ion-button @click="handleLogout" expand="block">
          <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
          Sign Out
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>
