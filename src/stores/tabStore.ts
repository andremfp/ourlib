import { defineStore } from "pinia";
import { EVENTS } from "@/constants/constants";
export const useTabStore = defineStore("tab", {
  state: () => ({
    activeTab: "Home",
  }),
  actions: {
    setActiveTab(tab: string) {
      // If we're in My Libraries and trying to switch TO My Libraries, do nothing
      if (tab === "My Libraries" && this.activeTab === "My Libraries") {
        return;
      }

      // Clear library name when switching away from My Libraries
      if (this.activeTab === "My Libraries" && tab !== "My Libraries") {
        window.dispatchEvent(
          new CustomEvent(EVENTS.LIBRARY_DRAWER.BACK_TO_LIBRARIES),
        );
      }

      this.activeTab = tab;
    },
    resetActiveTab() {
      this.activeTab = "Home";
      window.dispatchEvent(
        new CustomEvent(EVENTS.LIBRARY.NAVBAR_NAME_UPDATE, {
          detail: "",
        }),
      );
    },
  },
});
