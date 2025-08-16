import { inject } from "vue";
import { useTabStore } from "@/stores/tabStore";
import logger from "@/utils/logger";

// Define a proper type for the selectTab function
type SelectTabFunction = (tabName: string) => void;

export function useTabNavigation() {
  const tabStore = useTabStore();

  // Try to inject the selectTab method from the Tabs.vue component
  const injectedSelectTab = inject<SelectTabFunction | null>("selectTab", null);

  logger.debug(`[useTabNavigation] injectedSelectTab:`, injectedSelectTab);

  const navigateToTab = (tabName: string) => {
    logger.debug(`[useTabNavigation] navigateToTab called with: ${tabName}`);

    if (injectedSelectTab) {
      logger.debug(`[useTabNavigation] Calling injected selectTab(${tabName})`);
      try {
        injectedSelectTab(tabName);
        logger.debug(`[useTabNavigation] selectTab() called successfully`);
      } catch (error) {
        logger.error(`[useTabNavigation] Error calling selectTab():`, error);
      }
    } else {
      logger.debug(
        `[useTabNavigation] No injected selectTab, updating store only`,
      );
      // Fallback: just update the store
      tabStore.setActiveTab(tabName);
    }
  };

  return {
    navigateToTab,
    activeTab: tabStore.activeTab,
  };
}
