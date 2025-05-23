import { ref, onMounted, onUnmounted } from "vue";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { getUserLibraries } from "@/apis/libraryAPI";
import type { Library } from "@/apis/types";
import logger from "@/utils/logger";

/**
 * Composable for fetching and managing the user's libraries based on auth state.
 *
 * @returns Reactive refs for libraries, loading state, error state, and a refresh function.
 */
export function useLibraryList() {
  const auth = getAuth();
  const libraries = ref<Library[]>([]);
  const isLoading = ref<boolean>(true); // Start as true until first auth check/fetch
  const isRefreshing = ref<boolean>(false);
  const error = ref<string | null>(null);
  let unsubscribeAuth: (() => void) | null = null;

  const fetchLibraries = async (userId: string, isRefresh = false) => {
    if (!isRefresh) {
      isLoading.value = true;
    } else {
      isRefreshing.value = true;
    }
    error.value = null;

    logger.info(`[useUserLibraries] Fetching libraries for user ${userId}...`);

    try {
      const fetchedLibraries = await getUserLibraries(userId);
      libraries.value = fetchedLibraries;
      logger.info(
        `[useUserLibraries] Fetched ${fetchedLibraries.length} libraries.`,
      );
    } catch (err) {
      logger.error("[useUserLibraries] Failed to fetch libraries:", err);
      error.value = "Failed to load libraries. Please try again.";
      libraries.value = [];
    } finally {
      isLoading.value = false;
      isRefreshing.value = false;
    }
  };

  const refreshLibraries = async () => {
    if (isRefreshing.value) {
      // Avoid multiple concurrent refreshes
      return;
    }
    const user = auth.currentUser;
    if (user) {
      logger.info("[useUserLibraries] Refresh triggered.");
      await fetchLibraries(user.uid, true);
    } else {
      logger.warn("[useUserLibraries] Refresh skipped: no user authenticated.");
      // Ensure refreshing stops if user logs out during pull
      isRefreshing.value = false;
    }
  };

  // Setup auth listener
  onMounted(() => {
    unsubscribeAuth = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        logger.info("[useUserLibraries] Auth state: User logged in.");
        // Fetch libraries only if they haven't been loaded yet for this user
        // Prevents re-fetching if auth state fires but user is the same
        if (
          libraries.value.length === 0 ||
          auth.currentUser?.uid !== user.uid
        ) {
          fetchLibraries(user.uid);
        }
      } else {
        logger.info("[useUserLibraries] Auth state: User logged out.");
        // Clear state when logged out
        libraries.value = [];
        isLoading.value = false;
        isRefreshing.value = false;
        error.value = null;
      }
    });
  });

  // Cleanup auth listener
  onUnmounted(() => {
    if (unsubscribeAuth) {
      logger.info("[useUserLibraries] Unsubscribing from auth state changes.");
      unsubscribeAuth();
    }
  });

  return {
    libraries,
    isLoading,
    isRefreshing,
    error,
    refreshLibraries,
  };
}
