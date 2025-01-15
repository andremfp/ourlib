import { ref, readonly } from "vue";

type TabName = "Home" | "My Library" | "Add Book" | "Search" | "User";

const state = ref<TabName>(
  (sessionStorage.getItem("tab") as TabName) || "Home"
);

export const useTabStore = () => {
  const setActiveTab = (tab: TabName) => {
    state.value = tab;
    sessionStorage.setItem("tab", tab);
  };

  return {
    activeTab: readonly(state),
    setActiveTab,
  };
};
