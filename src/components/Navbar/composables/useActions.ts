import { EVENTS } from "@/constants/constants";
import logger from "@/utils/logger"; // Import logger

/**
 * Composable providing functions to trigger global actions from the Navbar,
 * such as opening modals or toggling menus.
 *
 * @returns {object} Methods to dispatch global action events.
 */
export function useLibrariesActions() {
  /** Dispatches an event to open the Add Library modal. */
  const openAddLibraryModal = () => {
    logger.debug(
      "[Navbar/useActions] Dispatching event to open Add Library modal.",
    );
    window.dispatchEvent(new Event(EVENTS.MODAL.OPEN_ADD_LIBRARY));
  };

  /** Dispatches an event to toggle the library options menu. */
  const toggleOptionsMenu = () => {
    logger.debug(
      "[Navbar/useActions] Dispatching event to toggle Library Options menu.",
    );
    window.dispatchEvent(new Event(EVENTS.MENU.TOGGLE_LIBRARY_OPTIONS));
  };

  return {
    /** Function to trigger the Add Library modal. */
    openAddLibraryModal,
    /** Function to trigger the toggle of the library options menu. */
    toggleOptionsMenu,
  };
}
