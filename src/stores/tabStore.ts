import { defineStore } from "pinia";
import { ref } from "vue";

export const useTabStore = defineStore("tab", () => {
  const activeTab = ref(sessionStorage.getItem("tab") || "Home");

  function setActiveTab(tab: string) {
    activeTab.value = tab;
    sessionStorage.setItem("tab", tab);
  }

  function resetActiveTab() {
    activeTab.value = "Home";
    sessionStorage.removeItem("tab");
  }

  return {
    activeTab,
    setActiveTab,
    resetActiveTab,
  };
});
