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
 * pull-to-refresh should be enabled. It's designed to not interfere with normal
 * scrolling behavior.
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
  let internalRefreshInProgress = false;
  let isAtTopWhenStarted = false; // Track if we were at top when gesture started

  const resetPullState = () => {
    pullIndicatorHeight.value = 0;
    touchStartY = 0;
    pullStarted = false;
    internalRefreshInProgress = false;
    isAtTopWhenStarted = false;
  };

  const getScrollableElement = () => {
    return containerRef.value;
  };

  const isAtScrollTop = () => {
    const localContainer = getScrollableElement();
    const mainElement = document.querySelector("main") as HTMLElement;
    const localScrollTop = localContainer
      ? localContainer.scrollTop <= 0
      : false;
    const mainScrollTop = mainElement ? mainElement.scrollTop <= 0 : true;
    return localScrollTop && mainScrollTop;
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

    // Only start tracking if we're at the very top of the scroll
    isAtTopWhenStarted = isAtScrollTop();

    if (!isAtTopWhenStarted) {
      return; // Don't track touch if not at top
    }

    touchStartY = e.touches[0].clientY;
    pullStarted = false; // Don't start pull immediately, wait for actual pull gesture
    internalRefreshInProgress = false;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (
      isRefreshing.value ||
      internalRefreshInProgress ||
      e.touches.length > 1 ||
      !isAtTopWhenStarted
    ) {
      return;
    }

    const container = containerRef.value;
    if (!container) return;

    const currentY = e.touches[0].clientY;
    const pullDistance = currentY - touchStartY;

    // Check if we're still at the top of both the local container and main scroll
    const localScrollTop = container.scrollTop <= 0;
    const mainElement = document.querySelector("main") as HTMLElement;
    const mainScrollTop = mainElement ? mainElement.scrollTop <= 0 : true;
    const isAtTop = localScrollTop && mainScrollTop;

    // Only consider this a pull gesture if:
    // 1. We're pulling down (positive distance)
    // 2. We're still at the top of both scroll containers
    // 3. The pull distance is significant enough
    if (pullDistance > 10 && isAtTop) {
      // This is a pull-to-refresh gesture
      pullStarted = true;

      // Prevent default scrolling behavior only during active pull
      e.preventDefault();
      e.stopPropagation();

      // Apply resistance and cap the pull height
      const resistedPull = Math.pow(pullDistance, PULL_RESISTANCE_FACTOR);
      pullIndicatorHeight.value = Math.min(
        resistedPull,
        refreshTriggerHeight.value * MAX_PULL_HEIGHT_FACTOR,
      );
    } else if (pullDistance < 0 || !isAtTop) {
      // User is scrolling up or has scrolled down, cancel pull gesture
      if (pullStarted) {
        resetPullState();
      }
    }
    // For small positive distances (< 10px), we let normal scrolling handle it
  };

  const onTouchEnd = async () => {
    // Only proceed if we had an active pull gesture
    if (!pullStarted || isRefreshing.value || internalRefreshInProgress) {
      // Reset tracking state
      isAtTopWhenStarted = false;
      if (pullStarted) {
        pullStarted = false;
      }
      return;
    }

    const currentPullHeight = pullIndicatorHeight.value;
    const triggerHeight = refreshTriggerHeight.value;
    pullStarted = false; // Mark pull gesture as ended
    isAtTopWhenStarted = false; // Reset tracking state

    if (currentPullHeight >= triggerHeight) {
      logger.info("[PullToRefresh] Threshold met. Triggering refresh action.");
      internalRefreshInProgress = true;

      try {
        await refreshAction();
        logger.info("[PullToRefresh] Refresh action completed successfully.");
        pullIndicatorHeight.value = 0;
      } catch (error) {
        logger.error("[PullToRefresh] Refresh action failed:", error);
        pullIndicatorHeight.value = 0;
      } finally {
        internalRefreshInProgress = false;
      }
    } else {
      // Didn't pull far enough, reset indicator smoothly
      pullIndicatorHeight.value = 0;
    }
  };

  return {
    pullIndicatorHeight: readonly(pullIndicatorHeight),
    refreshTriggerHeight: readonly(refreshTriggerHeight),
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
