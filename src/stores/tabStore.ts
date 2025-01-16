import { ref, readonly } from "vue";

const state = ref<string>(sessionStorage.getItem("tab") || "Home");

export const useTabStore = () => {
  const setActiveTab = (tab: string) => {
    state.value = tab;
    sessionStorage.setItem("tab", tab);
  };

  const resetActiveTab = () => {
    state.value = "Home";
    sessionStorage.removeItem("tab");
  };

  return {
    activeTab: readonly(state),
    setActiveTab,
    resetActiveTab,
  };
};
