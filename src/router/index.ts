import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import HomeView from "@/views/HomeView.vue";
import NotFound from "@/views/NotFound.vue";
import logger from "@/utils/logger";
import { useViewStore } from "@/stores/viewStore";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/:catchAll(.*)",
    name: "not-found",
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const getCurrentUser = (): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      getAuth(),
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject,
    );
  });
};

router.beforeEach(async (to, _, next) => {
  const viewStore = useViewStore();
  const user = await getCurrentUser();

  if (to.name === "not-found") {
    next();
    return;
  }

  if (user) {
    logger.info("User is authenticated, setting view to Main");
    viewStore.setView("Main");
  } else {
    logger.info("User is not authenticated, setting view to Login");
    viewStore.setView("Login");
  }

  next();
});

export default router;
