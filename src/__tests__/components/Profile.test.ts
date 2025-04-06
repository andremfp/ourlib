import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import { createRouter, createMemoryHistory, type Router } from "vue-router";
import {
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";
import { getUser } from "@/apis/userAPI";
import { useTabStore } from "@/stores/tabStore";
import Profile from "@/components/tabs/Profile.vue";
import logger from "@/utils/logger";

const resetActiveTabMock = vi.fn();

// Mock Firebase Auth
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({
    currentUser: { uid: "test-uid", email: "test@example.com" },
  })),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn(),
}));

// Mock APIs and stores
vi.mock("@/apis/userAPI", () => ({
  getUser: vi.fn(() => Promise.resolve({ username: "TestUser" })),
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
        stubs: {
          DeleteAccount: {
            template:
              '<div id="delete-account-modal" v-if="isOpen">Stubbed Delete Modal</div>',
            props: ["isOpen"],
          },
          ChangePasswordForm: {
            template:
              '<div id="change-password-modal" v-if="isOpen">Stubbed Change Password Modal</div>',
            props: ["isOpen"],
          },
        },
      },
      attachTo: document.body,
    });
  });

  afterEach(() => {
    // Clean up the component from the DOM
    if (wrapper) {
      wrapper.unmount();
    }
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
    it("shows stubbed delete modal when button is clicked", async () => {
      const deleteButton = wrapper.find("#delete-account-btn");
      await deleteButton.trigger("click");
      await wrapper.vm.$nextTick();

      const modalElement = wrapper.find("#delete-account-modal");
      expect(modalElement.exists()).toBe(true);
      expect(modalElement.text()).toContain("Stubbed Delete Modal");
    });
  });

  describe("Password Change Modal", () => {
    it("shows stubbed change password modal when button is clicked", async () => {
      const changePasswordButton = wrapper.find("#change-password-btn");
      await changePasswordButton.trigger("click");
      await wrapper.vm.$nextTick();

      const modalElement = wrapper.find("#change-password-modal");
      expect(modalElement.exists()).toBe(true);
      expect(modalElement.text()).toContain("Stubbed Change Password Modal");
    });
  });
});
