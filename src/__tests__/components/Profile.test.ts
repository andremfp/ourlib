import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import { createRouter, createMemoryHistory, type Router } from "vue-router";
import {
  signOut,
  deleteUser,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  type Auth,
  type User,
} from "firebase/auth";
import { getUser, removeUser } from "@/apis/userAPI";
import { useTabStore } from "@/stores/tabStore";
import Profile from "@/components/Profile.vue";
import logger from "@/utils/logger";

const resetActiveTabMock = vi.fn();

// Mock Firebase Auth
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({
    currentUser: { uid: "test-uid", email: "test@example.com" },
  })),
  signOut: vi.fn(() => Promise.resolve()),
  deleteUser: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn(),
  EmailAuthProvider: {
    credential: vi.fn(() => "mock-credential"),
  },
  reauthenticateWithCredential: vi.fn(() => Promise.resolve()),
  updatePassword: vi.fn(() => Promise.resolve()),
}));

// Mock APIs and stores
vi.mock("@/apis/userAPI", () => ({
  getUser: vi.fn(() => Promise.resolve({ username: "TestUser" })),
  removeUser: vi.fn(),
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: () => ({
    resetActiveTab: resetActiveTabMock,
  }),
}));

vi.mock("@/utils/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Profile.vue", () => {
  let wrapper: VueWrapper;
  let router: Router;
  let authCallback: (user: User | null) => void;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    window.alert = vi.fn();

    // Setup router
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/", component: {} }],
    });

    // Setup auth state change mock
    (onAuthStateChanged as Mock).mockImplementation(
      (_auth: Auth, callback: (user: User | null) => void) => {
        authCallback = callback;
        setTimeout(() => callback({ uid: "test-uid" } as User), 100); // Simulate user logged in on mount
        return vi.fn();
      },
    );

    // Default successful user fetch
    (getUser as Mock).mockResolvedValue({ username: "Test User" });

    // Mount component
    wrapper = mount(Profile, {
      global: {
        plugins: [router],
      },
    });
  });

  it("shows loading state while fetching user data", async () => {
    expect(wrapper.find("#username-loading-spinner").exists()).toBe(true); // Check before API call resolves
    await flushPromises();
  });

  it("fetches and displays the username on mount", async () => {
    await new Promise((r) => setTimeout(r, 100));
    await flushPromises();
    expect(wrapper.find("#username").text()).toBe("Test User");
    expect(getUser).toHaveBeenCalledWith("test-uid");
  });

  it("handles auth state changes correctly", async () => {
    // Simulate user logout
    authCallback(null);
    await flushPromises();
    expect(wrapper.find(".animate-spin").exists()).toBe(false);

    // Simulate user login
    authCallback({ uid: "new-test-uid" } as User);
    await flushPromises();
    expect(getUser).toHaveBeenCalledWith("new-test-uid");
  });

  it("displays error state for failed user fetch", async () => {
    (getUser as Mock).mockRejectedValueOnce(new Error("Fetch failed"));
    authCallback({ uid: "test-uid" } as User);
    await flushPromises();
    expect(wrapper.find("#username").text()).toBe("Unknown User");
  });

  describe("Sign Out Functionality", () => {
    it("successfully signs out the user", async () => {
      const signOutButton = wrapper.find("#sign-out-btn");
      await signOutButton.trigger("click");
      await flushPromises();

      expect(signOut).toHaveBeenCalled();
      expect(useTabStore().resetActiveTab).toHaveBeenCalled();
      expect(router.currentRoute.value.path).toBe("/");
    });

    it("handles sign out errors", async () => {
      const error = new Error("Sign out failed");
      (signOut as Mock).mockRejectedValueOnce(error);

      const signOutButton = wrapper.find("#sign-out-btn");
      await signOutButton.trigger("click");
      await flushPromises();

      // Verify error is logged
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        "Logout error:",
        error.message,
      );
    });
  });

  describe("Account Deletion", () => {
    beforeEach(async () => {
      const deleteButton = wrapper.find("#delete-account-btn");
      await deleteButton.trigger("click");
      await wrapper.vm.$nextTick();
    });

    it("shows delete confirmation modal", () => {
      expect(wrapper.find("#delete-account-modal").exists()).toBe(true);
      expect(wrapper.text()).toContain("Confirm Account Deletion");
    });

    it("successfully deletes account", async () => {
      const confirmButton = wrapper.find("#delete-account-confirm-btn");
      await confirmButton.trigger("click");
      await flushPromises();

      expect(removeUser).toHaveBeenCalledWith("test-uid");
      expect(deleteUser).toHaveBeenCalled();
      expect(useTabStore().resetActiveTab).toHaveBeenCalled();
      expect(router.currentRoute.value.path).toBe("/");
    });

    it("handles deletion errors", async () => {
      const error = new Error("Deletion failed");
      (removeUser as Mock).mockRejectedValueOnce(error);

      const confirmButton = wrapper.find("#delete-account-confirm-btn");
      await confirmButton.trigger("click");
      await flushPromises();

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        "Account deletion error:",
        error.message,
      );
    });

    it("closes modal on cancel", async () => {
      const cancelButton = wrapper.find("#delete-account-cancel-btn");
      await cancelButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(wrapper.find("#delete-account-modal").exists()).toBe(false);
    });
  });

  describe("Password Change Modal", () => {
    beforeEach(async () => {
      const changePasswordButton = wrapper.find("#change-password-btn");
      await changePasswordButton.trigger("click");
      await wrapper.vm.$nextTick();
    });

    it("shows password change modal", () => {
      expect(wrapper.find("#change-password-modal").exists()).toBe(true);
    });

    it("validates matching passwords", async () => {
      // Fill in the form with non-matching passwords
      await wrapper.find("#currentPassword").setValue("current123");
      await wrapper.find("#newPassword").setValue("new123");
      await wrapper.find("#confirmNewPassword").setValue("different123");

      // Submit the form
      await wrapper.find("form").trigger("submit");
      await wrapper.vm.$nextTick();

      // Check for error message
      expect(wrapper.text()).toContain("New passwords do not match");
    });

    it("successfully changes password when all inputs are valid", async () => {
      // Fill in the form
      await wrapper.find("#currentPassword").setValue("current123");
      await wrapper.find("#newPassword").setValue("new123");
      await wrapper.find("#confirmNewPassword").setValue("new123");

      // Submit the form
      await wrapper.find("form").trigger("submit");
      await flushPromises();

      // Verify the correct methods were called
      expect(EmailAuthProvider.credential).toHaveBeenCalledWith(
        "test@example.com",
        "current123",
      );
      expect(reauthenticateWithCredential).toHaveBeenCalled();
      expect(updatePassword).toHaveBeenCalledWith(expect.anything(), "new123");
      expect(window.alert).toHaveBeenCalledWith(
        "Password updated successfully!",
      );

      // Verify modal is closed
      expect(wrapper.find("#change-password-modal").exists()).toBe(false);
    });

    it("handles reauthentication failure", async () => {
      // Mock reauthentication failure
      (reauthenticateWithCredential as Mock).mockRejectedValueOnce(
        new Error("Invalid password"),
      );

      // Fill in the form
      await wrapper.find("#currentPassword").setValue("wrong123");
      await wrapper.find("#newPassword").setValue("new123");
      await wrapper.find("#confirmNewPassword").setValue("new123");

      // Submit the form
      await wrapper.find("form").trigger("submit");
      await flushPromises();

      // Verify error handling
      expect(wrapper.text()).toContain(
        "Failed to change password. Please check your current password and try again",
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Error changing password:",
        "Invalid password",
      );
    });

    it("handles password update failure", async () => {
      // Mock password update failure
      (updatePassword as Mock).mockRejectedValueOnce(
        new Error("Password update failed"),
      );

      // Fill in the form
      await wrapper.find("#currentPassword").setValue("current123");
      await wrapper.find("#newPassword").setValue("new123");
      await wrapper.find("#confirmNewPassword").setValue("new123");

      // Submit the form
      await wrapper.find("form").trigger("submit");
      await flushPromises();

      // Verify error handling
      expect(wrapper.text()).toContain(
        "Failed to change password. Please check your current password and try again",
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Error changing password:",
        "Password update failed",
      );
    });

    it("closes modal when cancel button is clicked", async () => {
      const cancelButton = wrapper.find("#change-password-cancel-btn");
      await cancelButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(wrapper.find("#change-password-modal").exists()).toBe(false);
    });
  });
});
