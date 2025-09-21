import type { TabName } from "@/types/types";
import type { ViewName } from "@/stores/viewStore";

// Animation Constants
export const ANIMATION = {
  LIBRARY_DRAWER: {
    TRANSITION_DURATION: 300, // milliseconds
    PARALLAX_OFFSET: 20, // percentage to shift libraries list
    EDGE_SWIPE_THRESHOLD: 0.1, // percentage of screen width
    CLOSE_THRESHOLD: 0.3, // percentage of screen width needed to trigger close
    OPEN_POSITION: 100, // percentage (fully open position)
    CLOSED_POSITION: 0, // percentage (fully closed position)
  },
  NAVBAR: {
    TRANSITION_DURATION: 300, // milliseconds
    TITLE_SLIDE_MULTIPLIER: 3, // Used for title fade in/out calculation
    TITLE_SLIDE_OFFSET: 0.5, // Offset for title opacity calculation
    BACK_BUTTON_OFFSET: -8, // pixels to offset back button
    TAB_NAME_SLIDE: -120, // percentage for "My Libraries" text slide
    LIBRARY_NAME_SLIDE: 350, // percentage for library name text slide
  },
  LIBRARY_MENU: {
    BACKDROP: {
      ENTER_DURATION: 200, // milliseconds
      LEAVE_DURATION: 150, // milliseconds
    },
    CONTENT: {
      ENTER_DURATION: 200, // milliseconds
      LEAVE_DURATION: 150, // milliseconds
    },
  },
  MODAL: {
    BACKDROP: {
      DURATION: 250, // milliseconds
      TIMING_FUNCTION: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
    CONTENT: {
      DURATION: 300, // milliseconds
      TIMING_FUNCTION: "cubic-bezier(0.4, 0, 0.2, 1)",
      SCALE_FROM: 0.95,
      SCALE_TO: 1,
    },
  },
  SLIDE_UP: {
    DURATION: 300, // milliseconds
    TIMING_FUNCTION: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

// UI State Constants
export const UI_STATE = {
  LIBRARY_DRAWER: {
    CLOSED: 0,
    OPEN: 1,
  },
  NAVBAR: {
    HIDDEN_VIEWS: ["Login", "Register"] as ViewName[],
    STANDARD_TITLE_TABS: ["Add Book", "Profile", "My Libraries"] as TabName[],
    INTERACTION_THRESHOLD: 0.5, // Threshold for enabling/disabling button interactions
  },
} as const;

// Event Names
export const EVENTS = {
  // Library-related events
  LIBRARY: {
    NAVBAR_NAME_UPDATE: "navbarNameUpdate",
    UPDATED: "libraryUpdated",
    DELETED: "libraryDeleted",
    SORT_CHANGED: "librarySortChanged",
  },
  // Drawer-related events
  LIBRARY_DRAWER: {
    PROGRESS: "libraryDrawerProgress",
    BACK_TO_LIBRARIES: "backToLibraries",
  },
  // Modal-related events
  MODAL: {
    OPEN_ADD_LIBRARY: "openAddLibraryModal",
  },
  // Menu-related events
  MENU: {
    TOGGLE_LIBRARY_OPTIONS: "toggleLibraryOptionsMenu",
  },
} as const;

// UI Limits and Thresholds
export const UI_LIMITS = {
  LIBRARY: {
    NAME_MAX_LENGTH: 30,
    NAME_MIN_LENGTH: 3,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 30,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
} as const;

// Search Constants
export const SEARCH = {
  PLACEHOLDERS: {
    DEFAULT: "Search book",
  },
} as const;

// Sort Constants
export const SORT = {
  BY: {
    NAME: "NAME",
    TITLE: "TITLE",
    AUTHOR: "AUTHOR",
    DATE: "DATE ADDED",
  },
  DIRECTION: {
    ASC: false,
    DESC: true,
  },
} as const;
