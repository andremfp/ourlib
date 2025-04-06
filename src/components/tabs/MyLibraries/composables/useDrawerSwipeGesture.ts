import { ref, type ComputedRef } from "vue";
import { useGesture } from "@vueuse/gesture";
import { ANIMATION, UI_STATE } from "@/constants/constants";
import logger from "@/utils/logger";

type DrawerSwipeEmitter = {
  (e: "close"): void;
  (e: "progress", progress: number): void;
};

/**
 * Manages the swipe-to-close gesture for the library drawer.
 *
 * @param domTargetRef ComputedRef<HTMLElement | null | undefined> - Ref pointing to the drawer element.
 * @param emit DrawerSwipeEmitter - The component's emit function.
 * @returns Reactive refs for drawer position and swipe state.
 */
export function useDrawerSwipeGesture(
  domTargetRef: ComputedRef<HTMLElement | null | undefined>,
  emit: DrawerSwipeEmitter,
) {
  const libraryDrawerPosition = ref<number>(
    ANIMATION.LIBRARY_DRAWER.CLOSED_POSITION,
  ); // Start closed visually
  const isEdgeSwipeActive = ref(false);

  useGesture(
    {
      onDragStart: ({ event }) => {
        const target = event.target as HTMLElement;
        if (!target?.getBoundingClientRect) {
          logger.warn(
            "[useDrawerSwipeGesture] DragStart aborted: Target missing getBoundingClientRect",
          );
          return;
        }
        const rect = target.getBoundingClientRect();
        const touchX =
          event instanceof TouchEvent
            ? event.touches[0].clientX - rect.left
            : (event as PointerEvent).clientX - rect.left;

        // Only activate edge swipe if touch starts near the left edge
        isEdgeSwipeActive.value =
          touchX < rect.width * ANIMATION.LIBRARY_DRAWER.EDGE_SWIPE_THRESHOLD;

        if (isEdgeSwipeActive.value) {
          logger.debug("[useDrawerSwipeGesture] Edge swipe started.");
        }
      },
      onDrag: ({ movement: [mx], active, pinching }) => {
        // Ignore if not an active edge swipe or if pinching (zoom gesture)
        if (!isEdgeSwipeActive.value || !active || pinching) return;

        // Calculate drawer position percentage based on horizontal swipe distance
        const percentage = (mx / window.innerWidth) * 100;
        // Update drawer position, clamping between fully closed (0%) and fully open (100% visually)
        libraryDrawerPosition.value = Math.min(
          ANIMATION.LIBRARY_DRAWER.OPEN_POSITION,
          Math.max(ANIMATION.LIBRARY_DRAWER.CLOSED_POSITION, percentage),
        );

        // Convert position percentage (0-100) to progress (1-0) and emit
        // Progress 1 = fully open (position 0), Progress 0 = fully closed (position 100)
        const progress =
          1 -
          libraryDrawerPosition.value / ANIMATION.LIBRARY_DRAWER.OPEN_POSITION;
        emit("progress", progress);
      },
      onDragEnd: ({ movement: [mx] }) => {
        if (!isEdgeSwipeActive.value) return;

        logger.debug("[useDrawerSwipeGesture] Edge swipe ended.");
        isEdgeSwipeActive.value = false; // Deactivate edge swipe flag
        const swipeProgress = mx / window.innerWidth;

        // Determine if the swipe was sufficient to trigger a close action
        if (swipeProgress > ANIMATION.LIBRARY_DRAWER.CLOSE_THRESHOLD) {
          logger.debug("[useDrawerSwipeGesture] Swipe threshold met, closing.");
          // Animate to fully closed position
          libraryDrawerPosition.value = ANIMATION.LIBRARY_DRAWER.OPEN_POSITION;
          emit("progress", UI_STATE.LIBRARY_DRAWER.CLOSED);
          // Emit close event after a short delay for animation
          setTimeout(() => emit("close"), 50);
        } else {
          logger.debug(
            "[useDrawerSwipeGesture] Swipe threshold not met, snapping open.",
          );
          // Animate back to fully open position
          libraryDrawerPosition.value =
            ANIMATION.LIBRARY_DRAWER.CLOSED_POSITION;
          emit("progress", UI_STATE.LIBRARY_DRAWER.OPEN);
        }
      },
    },
    {
      domTarget: domTargetRef,
      drag: {
        filterTaps: true, // Prevent click events during drag
        axis: "x", // Only track horizontal movement
        bounds: { left: 0 }, // Allow dragging only to the right (positive mx)
      },
    },
  );

  return {
    libraryDrawerPosition, // The visual translateX percentage (0 = open, 100 = closed)
    isEdgeSwipeActive, // Boolean indicating if an edge swipe is in progress (for disabling CSS transition)
  };
}
