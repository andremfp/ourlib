import { ref, type ComputedRef } from "vue";
import { useGesture } from "@vueuse/gesture";
import { ANIMATION, UI_STATE } from "@/constants/constants";

type DrawerSwipeEmitter = {
  (e: "close"): void;
  (e: "progress", progress: number): void;
};

/**
 * Manages the swipe-to-close gesture for the library drawer.
 * Provides smooth animations, responsive drag handling, and programmatic
 * open/close functionality.
 *
 * @param domTargetRef ComputedRef<HTMLElement | null | undefined> - Ref pointing to the drawer element.
 * @param emit DrawerSwipeEmitter - The component's emit function.
 * @returns Reactive refs and functions for drawer position, transitions and control.
 */
export function useDrawerSwipeGesture(
  domTargetRef: ComputedRef<HTMLElement | null | undefined>,
  emit: DrawerSwipeEmitter,
) {
  // Position value directly used by CSS transform (0 = fully onscreen, 100 = fully offscreen)
  const libraryDrawerPosition = ref<number>(0);
  const isEdgeSwipeActive = ref(false);
  const drawerTransition = ref<string>("none");

  // Track last emitted progress to reduce event spam
  let lastEmittedProgress = -1;

  // Threshold for emitting progress events (emit only when change > threshold)
  const PROGRESS_EMIT_THRESHOLD = 0.02;

  // Helper function to calculate and emit progress
  const updateProgress = (position: number, forceEmit = false) => {
    // Calculate progress (1 = open, 0 = closed) from position
    // Ensure it's within bounds [0, 1]
    const progress = Math.max(
      0,
      Math.min(1, 1 - position / ANIMATION.LIBRARY_DRAWER.OPEN_POSITION),
    );

    // Only emit progress events when sufficient change has occurred or forced
    if (
      forceEmit ||
      Math.abs(progress - lastEmittedProgress) > PROGRESS_EMIT_THRESHOLD
    ) {
      lastEmittedProgress = progress;

      // For exact open/close states, use the constants to ensure precision
      if (Math.abs(progress - UI_STATE.LIBRARY_DRAWER.OPEN) < 0.01) {
        emit("progress", UI_STATE.LIBRARY_DRAWER.OPEN);
      } else if (Math.abs(progress - UI_STATE.LIBRARY_DRAWER.CLOSED) < 0.01) {
        emit("progress", UI_STATE.LIBRARY_DRAWER.CLOSED);
      } else {
        emit("progress", progress);
      }
    }
  };

  // Handles programmatic animation to close the drawer
  const animateClose = () => {
    drawerTransition.value = `transform ${ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION}ms ease-out`;
    libraryDrawerPosition.value = ANIMATION.LIBRARY_DRAWER.OPEN_POSITION;
    updateProgress(ANIMATION.LIBRARY_DRAWER.OPEN_POSITION, true);
    setTimeout(
      () => emit("close"),
      ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION,
    );
  };

  // Handles programmatic animation to open the drawer
  const animateOpen = () => {
    drawerTransition.value = `transform ${ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION}ms ease-out`;
    libraryDrawerPosition.value = 0;
    updateProgress(0, true);
  };

  useGesture(
    {
      onDragStart: ({ event }) => {
        const target = event.target as HTMLElement;
        if (!target?.getBoundingClientRect) {
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

        // Disable transition during active dragging for responsive feel
        drawerTransition.value = "none";
      },
      onDrag: ({ movement: [mx], active }) => {
        // Ignore if not an active edge swipe
        if (!isEdgeSwipeActive.value || !active) return;

        // Calculate and limit position to valid range
        const newPosition = Math.min(
          ANIMATION.LIBRARY_DRAWER.OPEN_POSITION,
          Math.max(0, (mx / window.innerWidth) * 100),
        );

        // Update position immediately for UI
        libraryDrawerPosition.value = newPosition;

        // Update and emit progress
        updateProgress(newPosition);
      },
      onDragEnd: ({ movement: [mx] }) => {
        if (!isEdgeSwipeActive.value) return;
        isEdgeSwipeActive.value = false;

        const swipeProgress = mx / window.innerWidth;
        drawerTransition.value = `transform ${ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION}ms ease-out`;

        // Snap drawer position based on threshold
        if (swipeProgress > ANIMATION.LIBRARY_DRAWER.CLOSE_THRESHOLD) {
          // Animate to closed
          libraryDrawerPosition.value = ANIMATION.LIBRARY_DRAWER.OPEN_POSITION;
          updateProgress(ANIMATION.LIBRARY_DRAWER.OPEN_POSITION, true);
          setTimeout(
            () => emit("close"),
            ANIMATION.LIBRARY_DRAWER.TRANSITION_DURATION,
          );
        } else {
          // Animate back to open
          libraryDrawerPosition.value = 0;
          updateProgress(0, true);
        }
      },
    },
    {
      domTarget: domTargetRef,
      drag: {
        filterTaps: true,
        axis: "x",
        bounds: { left: 0 },
      },
    },
  );

  return {
    libraryDrawerPosition,
    isEdgeSwipeActive,
    drawerTransition,
    animateClose,
    animateOpen,
  };
}
