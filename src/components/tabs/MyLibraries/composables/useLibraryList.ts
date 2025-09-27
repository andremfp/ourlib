import { ref, onMounted, onUnmounted } from "vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getUserLibraries,
  getUserLibrariesFromServer,
} from "@/apis/libraryAPI";
import { COLLECTION_NAMES } from "@/constants";
import type { Library, User } from "@/schema";
import { getLibraryThumbnails } from "@/apis/bookAPI";
import logger from "@/utils/logger";
import { firestore } from "@/firebase";
import { doc, DocumentReference } from "firebase/firestore";

/**
 * Composable for fetching and managing the user's libraries based on auth state.
 *
 * @returns Reactive refs for libraries, loading state, error state, and a refresh function.
 */
export function useLibraryList() {
  const auth = getAuth();
  const libraries = ref<(Library & { thumbnails?: string[] })[]>([]);
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
      const userRef = doc(
        firestore,
        COLLECTION_NAMES.USERS,
        userId,
      ) as DocumentReference<User>;
      const fetchedLibraries = await getUserLibraries(userRef);
      // Enrich with up to 3 thumbnails per library (best-effort; ignore errors)
      const enriched = await Promise.all(
        fetchedLibraries.map(async (lib) => {
          try {
            const libRef = doc(
              firestore,
              COLLECTION_NAMES.LIBRARIES,
              lib.id,
            ) as DocumentReference<Library>;
            const thumbs = await getLibraryThumbnails(libRef, 3);
            return { ...lib, thumbnails: thumbs } as Library & {
              thumbnails?: string[];
            };
          } catch {
            return { ...lib } as Library & { thumbnails?: string[] };
          }
        }),
      );
      libraries.value = enriched;
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

  const refreshLibraries = async (forceServer = false) => {
    if (isRefreshing.value) {
      // Avoid multiple concurrent refreshes
      return;
    }
    const user = auth.currentUser;
    if (user) {
      logger.info("[useUserLibraries] Refresh triggered.");
      if (forceServer) {
        isRefreshing.value = true;
        try {
          const userRef = doc(
            firestore,
            COLLECTION_NAMES.USERS,
            user.uid,
          ) as DocumentReference<User>;
          const fetchedLibraries = await getUserLibrariesFromServer(userRef);
          const enriched = await Promise.all(
            fetchedLibraries.map(async (lib) => {
              try {
                const libRef = doc(
                  firestore,
                  COLLECTION_NAMES.LIBRARIES,
                  lib.id,
                ) as DocumentReference<Library>;
                const thumbs = await getLibraryThumbnails(libRef, 3);
                return { ...lib, thumbnails: thumbs } as Library & {
                  thumbnails?: string[];
                };
              } catch {
                return { ...lib } as Library & { thumbnails?: string[] };
              }
            }),
          );
          libraries.value = enriched;
        } catch (err) {
          logger.error("[useUserLibraries] Server refresh failed:", err);
          error.value = "Failed to refresh libraries. Please try again.";
        } finally {
          isRefreshing.value = false;
        }
      } else {
        await fetchLibraries(user.uid, true);
      }
    } else {
      logger.warn("[useUserLibraries] Refresh skipped: no user authenticated.");
      // Ensure refreshing stops if user logs out during pull
      isRefreshing.value = false;
    }
  };

  // Setup auth listener
  onMounted(() => {
    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
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
