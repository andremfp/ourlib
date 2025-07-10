import { createRouter, createWebHistory } from "@ionic/vue-router";
import type { RouteRecordRaw } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import LoginView from "@/views/Login.vue";
import RegisterView from "@/views/Register.vue";
import TabsPage from "@/views/Tabs.vue"; // This will be the new container for tabs
import MyLibraries from "@/components/tabs/MyLibraries/MyLibraries.vue";
import AddBook from "@/components/tabs/AddBook/AddBook.vue";
import ScanMode from "@/components/tabs/AddBook/ScanMode.vue";
import ManualMode from "@/components/tabs/AddBook/ManualMode.vue";
import Profile from "@/components/tabs/Profile.vue";
import NotFound from "@/views/NotFound.vue";
import logger from "@/utils/logger";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/tabs",
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
  },
  {
    path: "/tabs/",
    component: TabsPage,
    children: [
      {
        path: "",
        redirect: "/tabs/my-libraries",
      },
      {
        path: "my-libraries",
        name: "my-libraries",
        component: MyLibraries,
      },
      {
        path: "add-book",
        name: "add-book",
        component: AddBook,
      },
      {
        path: "add-book/scan",
        name: "add-book-scan",
        component: ScanMode,
      },
      {
        path: "add-book/manual",
        name: "add-book-manual",
        component: ManualMode,
      },
      {
        path: "profile",
        name: "profile",
        component: Profile,
      },
    ],
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

router.beforeEach(async (to, from, next) => {
  const user = await getCurrentUser();

  // Define routes that do not require authentication
  const publicPages = ["/login", "/register"];
  const authRequired = !publicPages.includes(to.path);

  if (to.name === "not-found") {
    return next();
  }

  if (authRequired && !user) {
    logger.info(
      `Authentication required for ${to.path}. User not logged in. Redirecting to /login.`,
    );
    return next("/login");
  }

  if (!authRequired && user) {
    logger.info(`User is logged in. Redirecting from ${to.path} to /tabs.`);
    return next("/tabs");
  }

  // If we've made it this far, allow navigation
  next();
});

export default router;
