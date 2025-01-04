import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import RegisterView from "@/views/Register.vue";
import LoginView from "@/views/Login.vue";
import MainView from "@/views/Main.vue";
import NotFound from "@/views/NotFound.vue";
import logger from "@/utils/logger";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "login",
    component: LoginView,
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
  },
  {
    path: "/main",
    name: "main",
    component: MainView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/:catchAll(.*)", // Catch-all route for invalid paths
    name: "not-found",
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(), // Using history mode
  routes,
});

const getCurrentUser = (): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      getAuth(),
      (user) => {
        unsubscribe(); // Stop listening after first resolution
        resolve(user);
      },
      reject
    );
  });
};

// Navigation guard
router.beforeEach(async (to, _, next) => {
  const user = await getCurrentUser();

  if (to.meta.requiresAuth && !user) {
    logger.info("User is not authenticated, redirecting to login");
    next("/"); // Redirect to login if not authenticated
  } else if (to.path === "/" && user) {
    logger.info("User is authenticated, skipping login");
    next("/main"); // Redirect logged-in users from login to the main page
  } else {
    next(); // Allow navigation
  }
});

export default router;
