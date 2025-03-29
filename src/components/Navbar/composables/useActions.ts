import { EVENTS } from "@/constants/constants";

export function useLibrariesActions() {
  // Function to open the Add Library modal
  const openAddLibraryModal = () => {
    window.dispatchEvent(new Event(EVENTS.MODAL.OPEN_ADD_LIBRARY));
  };

  // Function to toggle the options menu
  const toggleOptionsMenu = () => {
    window.dispatchEvent(new Event(EVENTS.MENU.TOGGLE_LIBRARY_OPTIONS));
  };

  return {
    openAddLibraryModal,
    toggleOptionsMenu,
  };
}
