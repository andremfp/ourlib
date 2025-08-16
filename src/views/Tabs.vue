<template>
  <ion-page>
    <ion-tabs ref="tabsRef" :key="tabsKey">
      <ion-tab-bar slot="bottom">
        <ion-tab-button
          tab="my-libraries"
          @click="() => handleTabClick('My Libraries')"
          :class="{ 'active-tab': tabStore.activeTab === 'My Libraries' }"
        >
          <ion-icon :icon="libraryIcon" />
          <ion-label>My Libraries</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="add-book"
          @click="() => handleTabClick('Add Book')"
          :class="{ 'active-tab': tabStore.activeTab === 'Add Book' }"
        >
          <ion-icon :icon="addIcon" />
          <ion-label>Add Book</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="profile"
          @click="() => handleTabClick('Profile')"
          :class="{ 'active-tab': tabStore.activeTab === 'Profile' }"
        >
          <ion-icon :icon="profileIcon" />
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
import { ref, watch, computed, provide, onMounted, nextTick } from "vue";
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
  library,
  addOutline,
  add,
  personCircleOutline,
  personCircle,
} from "ionicons/icons";
import { useTabStore } from "@/stores/tabStore";
import MyLibraries from "@/components/tabs/MyLibraries/MyLibraries.vue";
import AddBook from "@/components/tabs/AddBook/AddBook.vue";
import Profile from "@/components/tabs/Profile.vue";
import logger from "@/utils/logger";

const tabStore = useTabStore();
const tabsKey = ref(0);
const tabsRef = ref<any>(null);

// Provide the tabs reference to child components
provide("tabsRef", {
  selectTab: (tabName: string) => {
    logger.debug(`[Tabs.vue] selectTab called via provide with: ${tabName}`);
    selectTab(tabName);
  },
});

// Ensure the tabs reference is set in the composable after the component mounts
onMounted(async () => {
  await nextTick();
  if (tabsRef.value) {
    logger.debug(
      `[Tabs.vue] onMounted: tabsRef.value is available:`,
      tabsRef.value,
    );
  } else {
    logger.debug(`[Tabs.vue] onMounted: tabsRef.value is still null`);
  }
});

// Computed properties for dynamic icon switching
const libraryIcon = computed(() => {
  return tabStore.activeTab === "My Libraries" ? library : libraryOutline;
});

const addIcon = computed(() => {
  return tabStore.activeTab === "Add Book" ? add : addOutline;
});

const profileIcon = computed(() => {
  return tabStore.activeTab === "Profile" ? personCircle : personCircleOutline;
});

// Watch for the active tab to be reset to "My Libraries".
// This indicates a logout/login cycle, so we force a re-render
// of the tabs component by changing its key.
watch(
  () => tabStore.activeTab,
  (newTab, oldTab) => {
    logger.debug(
      `[Tabs.vue] activeTab changed from "${oldTab}" to "${newTab}"`,
    );

    // Force a re-render when resetting to "My Libraries" (logout/login cycle)
    if (newTab === "My Libraries" && oldTab !== "My Libraries") {
      logger.debug(
        "[Tabs.vue] Forcing re-render of ion-tabs due to tab reset.",
      );
      tabsKey.value++;
    }

    // Handle programmatic tab switching
    if (oldTab !== newTab && newTab !== "My Libraries") {
      logger.debug(`[Tabs.vue] Programmatically switching to tab: ${newTab}`);
      // Use nextTick to ensure the DOM is updated before trying to switch tabs
      nextTick(() => {
        selectTab(newTab);
      });
    }
  },
);

const handleTabClick = (tabName: string) => {
  logger.debug(`[Tabs.vue] Clicked tab: ${tabName}`);
  tabStore.setActiveTab(tabName);
};

// Method to programmatically select a tab
const selectTab = (tabName: string) => {
  logger.debug(`[Tabs.vue] selectTab called with: ${tabName}`);
  logger.debug(`[Tabs.vue] tabsRef.value:`, tabsRef.value);

  // Store is already updated when this method is called, no need to update again
  logger.debug(`[Tabs.vue] Current store state: ${tabStore.activeTab}`);

  // Map tab names to tab IDs
  const tabMap: Record<string, string> = {
    "My Libraries": "my-libraries",
    "Add Book": "add-book",
    Profile: "profile",
  };

  const tabId = tabMap[tabName];
  logger.debug(`[Tabs.vue] Mapped tabId: ${tabId}`);

  if (tabId && tabsRef.value) {
    // Try to find the correct method to switch tabs
    const tabsComponent = tabsRef.value;

    // Try different approaches to switch tabs
    if (typeof tabsComponent.select === "function") {
      logger.debug(`[Tabs.vue] Using tabsComponent.select(${tabId})`);
      tabsComponent.select(tabId);
    } else if (
      tabsComponent.$el &&
      typeof tabsComponent.$el.select === "function"
    ) {
      logger.debug(`[Tabs.vue] Using tabsComponent.$el.select(${tabId})`);
      tabsComponent.$el.select(tabId);
    } else {
      logger.debug(
        `[Tabs.vue] No select method found, trying to trigger click on tab button`,
      );
      // Fallback: try to programmatically click the tab button
      const tabButton = document.querySelector(
        `ion-tab-button[tab="${tabId}"]`,
      );
      if (tabButton) {
        logger.debug(`[Tabs.vue] Clicking tab button for ${tabId}`);
        (tabButton as HTMLElement).click();
      } else {
        logger.debug(`[Tabs.vue] Tab button not found for ${tabId}`);
      }
    }
  }
};

// Provide the selectTab method globally so other components can use it
provide("selectTab", selectTab);

// Expose the selectTab method globally so other components can use it
defineExpose({
  selectTab,
});
</script>

<style scoped>
.tab-content {
  flex: 1;
  overflow: hidden;
}

.active-tab {
  border-top: 2px solid var(--ion-tab-bar-color-selected);
}
</style>
