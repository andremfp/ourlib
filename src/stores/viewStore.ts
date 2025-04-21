import { defineStore } from "pinia";

export type ViewName = "Login" | "Register" | "Main";

export const useViewStore = defineStore("view", {
  state: () => ({
    activeView: "Login" as ViewName, // Default to Login view
  }),
  actions: {
    /**
     * Sets the active view to be displayed.
     * @param view The name of the view to activate ('Login', 'Register', or 'Main').
     */
    setView(view: ViewName) {
      this.activeView = view;
    },
  },
});
