import { defineStore } from "pinia";
import logger from "@/utils/logger";

export const useTabStore = defineStore("tab", {
  state: () => ({
    activeTab: "My Libraries",
  }),
  actions: {
    setActiveTab(tab: string) {
      logger.debug(
        `[tabStore] setActiveTab called. New tab: "${tab}", Old tab: "${this.activeTab}"`,
      );
      this.activeTab = tab;
    },
    resetActiveTab() {
      logger.debug(
        `[tabStore] resetActiveTab called. Old tab: "${this.activeTab}"`,
      );
      this.activeTab = "My Libraries";
      logger.debug(
        `[tabStore] new activeTab state after reset: "${this.activeTab}"`,
      );
    },
  },
});
