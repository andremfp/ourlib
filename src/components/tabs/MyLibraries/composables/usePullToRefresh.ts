import { ref, readonly, type Ref } from "vue";
import logger from "@/utils/logger";

// Constants for pull-to-refresh behavior
const REFRESH_TRIGGER_HEIGHT = 100; // Height in pixels to trigger refresh
const PULL_RESISTANCE_FACTOR = 0.9; // Resistance factor for pull distance
const MAX_PULL_HEIGHT_FACTOR = 1.5; // Maximum pull height relative to trigger height

/**
 * Composable for managing pull-to-refresh functionality.
 *
 * This composable listens for touch events on the provided containerRef but checks
 * the scroll position of the main scrollable element (main tag) to determine if
 * pull-to-refresh should be enabled.
 *
 * @param containerRef Ref to the element that should listen for touch events.
 * @param isDisabled Ref<boolean> indicating if pull-to-refresh should be disabled (e.g., drawer open).
 * @param isRefreshing Ref<boolean> indicating if a refresh action is already in progress.
 * @param refreshAction Async function to execute when refresh is triggered.
 * @returns Object containing pull state and touch handlers.
 */
export function usePullToRefresh(
  containerRef: Ref<HTMLElement | null>,
  isDisabled: Ref<boolean>,
  isRefreshing: Ref<boolean>,
  refreshAction: () => Promise<void>,
) {
  const pullIndicatorHeight = ref(0);
  const refreshTriggerHeight = ref(REFRESH_TRIGGER_HEIGHT);

  let touchStartY = 0;
  let pullStarted = false;
  let internalRefreshInProgress = false; // Prevent multiple triggers from one pull

  const resetPullState = () => {
    pullIndicatorHeight.value = 0;
    touchStartY = 0;
    pullStarted = false;
    internalRefreshInProgress = false;
  };

  const onTouchStart = (e: TouchEvent) => {
    if (
      isDisabled.value ||
      isRefreshing.value ||
      internalRefreshInProgress ||
      e.touches.length > 1
    ) {
      return; // Ignore if disabled, already refreshing, or multi-touch
    }

    const container = containerRef.value;
    if (!container) {
      return;
    }

    // Find the actual scrollable element (main element)
    const scrollableElement = document.querySelector("main");
    if (!scrollableElement || scrollableElement.scrollTop > 0) {
      return; // Ignore if not scrolled to the top
    }

    touchStartY = e.touches[0].clientY;
    pullStarted = true;
    internalRefreshInProgress = false; // Reset on new pull start
  };

  const onTouchMove = (e: TouchEvent) => {
    if (
      !pullStarted ||
      isRefreshing.value ||
      internalRefreshInProgress ||
      e.touches.length > 1
    ) {
      return;
    }

    const container = containerRef.value;
    if (!container) return;

    // Find the actual scrollable element (main element)
    const scrollableElement = document.querySelector("main");
    if (!scrollableElement) return;

    // If user scrolls down while pulling, cancel the pull gesture
    if (scrollableElement.scrollTop > 5) {
      resetPullState();
      return;
    }

    const currentY = e.touches[0].clientY;
    const pullDistance = currentY - touchStartY;

    if (pullDistance >= 0) {
      // Prevent default page scroll/bounce when pulling down
      e.preventDefault();

      // Apply resistance and cap the pull height
      const resistedPull = Math.pow(pullDistance, PULL_RESISTANCE_FACTOR);
      pullIndicatorHeight.value = Math.min(
        resistedPull,
        refreshTriggerHeight.value * MAX_PULL_HEIGHT_FACTOR,
      );
    } else {
      // Reset if pulling up beyond the start point
      resetPullState();
    }
  };

  const onTouchEnd = async () => {
    // Exit if pull didn't start correctly, a refresh is already active (external or internal), or internal action is running
    if (!pullStarted || isRefreshing.value || internalRefreshInProgress) {
      // Ensure flag is reset if we exit early but pull had started
      if (pullStarted) {
        pullStarted = false;
      }
      return;
    }

    const currentPullHeight = pullIndicatorHeight.value;
    const triggerHeight = refreshTriggerHeight.value;
    pullStarted = false; // Mark pull gesture as ended *before* async logic

    if (currentPullHeight >= triggerHeight) {
      logger.info("[PullToRefresh] Threshold met. Triggering refresh action.");
      internalRefreshInProgress = true; // Prevent re-triggering during this action

      try {
        await refreshAction();
        logger.info("[PullToRefresh] Refresh action completed successfully.");
        // SUCCESS: Reset height to allow smooth closing transition
        pullIndicatorHeight.value = 0;
      } catch (error) {
        logger.error("[PullToRefresh] Refresh action failed:", error);
        // FAILURE: Reset indicator immediately
        pullIndicatorHeight.value = 0;
      } finally {
        // Reset internal flag *after* action completes/fails
        internalRefreshInProgress = false;
        // Height reset is now handled within try/catch blocks
      }
    } else {
      // Didn't pull far enough, reset indicator smoothly via transition
      pullIndicatorHeight.value = 0;
    }
  };

  // Relies on component's fetch logic finally block and CSS transition for indicator reset.

  return {
    pullIndicatorHeight: readonly(pullIndicatorHeight),
    refreshTriggerHeight: readonly(refreshTriggerHeight),
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
