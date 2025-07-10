<template>
  <ion-page>
    <ion-tabs ref="tabsRef" :key="tabsKey">
      <ion-tab-bar slot="bottom">
        <ion-tab-button
          tab="my-libraries"
          @click="() => handleTabClick('My Libraries')"
        >
          <ion-icon :icon="libraryOutline" />
          <ion-label>My Libraries</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="add-book"
          @click="() => handleTabClick('Add Book')"
        >
          <ion-icon :icon="addCircleOutline" />
          <ion-label>Add Book</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" @click="() => handleTabClick('Profile')">
          <ion-icon :icon="personCircleOutline" />
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>

      <ion-tab tab="my-libraries">
        <MyLibraries />
      </ion-tab>

      <ion-tab tab="add-book">
        <AddBook />
      </ion-tab>

      <ion-tab tab="profile">
        <Profile />
      </ion-tab>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  IonPage,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
  IonTab,
} from "@ionic/vue";
import {
  libraryOutline,
  addCircleOutline,
  personCircleOutline,
} from "ionicons/icons";
import { useTabStore } from "@/stores/tabStore";
import MyLibraries from "@/components/tabs/MyLibraries/MyLibraries.vue";
import AddBook from "@/components/tabs/AddBook/AddBook.vue";
import Profile from "@/components/tabs/Profile.vue";
import logger from "@/utils/logger";

const tabStore = useTabStore();
const tabsKey = ref(0);

// Watch for the active tab to be reset to "My Libraries".
// This indicates a logout/login cycle, so we force a re-render
// of the tabs component by changing its key.
watch(
  () => tabStore.activeTab,
  (newTab, oldTab) => {
    logger.debug(
      `[Tabs.vue] activeTab changed from "${oldTab}" to "${newTab}"`,
    );
    if (newTab === "My Libraries" && oldTab !== "My Libraries") {
      logger.debug(
        "[Tabs.vue] Forcing re-render of ion-tabs due to tab reset.",
      );
      tabsKey.value++;
    }
  },
);

const handleTabClick = (tabName: string) => {
  logger.debug(`[Tabs.vue] Clicked tab: ${tabName}`);
  tabStore.setActiveTab(tabName);
};
</script>

<style scoped>
.tab-content {
  flex: 1;
  overflow: hidden;
}
</style>
