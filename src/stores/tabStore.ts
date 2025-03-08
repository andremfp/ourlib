import { defineStore } from "pinia";

export const useTabStore = defineStore("tab", {
  state: () => ({
    activeTab: "Home",
  }),
  actions: {
    setActiveTab(tab: string) {
      this.activeTab = tab;
      // Reset library name in navbar when switching tabs
      if (tab === "My Libraries") {
        window.dispatchEvent(
          new CustomEvent("libraryNameUpdate", { detail: "" }),
        );
      }
    },
    resetActiveTab() {
      this.activeTab = "Home";
      window.dispatchEvent(
        new CustomEvent("libraryNameUpdate", { detail: "" }),
      );
    },
  },
});
