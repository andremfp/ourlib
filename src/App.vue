<script lang="ts">
import TabsComponent from "@/components/Tabs.vue";
import { useTabStore } from "@/stores/tabStore";

export default {
  components: {
    TabsComponent,
  },
  setup() {
    let activeTab;
    try {
      const tabStore = useTabStore();
      activeTab = tabStore.activeTab;
    } catch {
      activeTab = "Home";
    }

    return {
      activeTab,
    };
  },
};
</script>

<template>
  <div
    id="app"
    class="grid grid-rows-[auto_1fr_auto] min-h-screen bg-light-bg dark:bg-dark-bg"
  >
    <!-- Fixed Navbar -->
    <nav
      class="sticky top-0 z-50 bg-light-nav dark:bg-dark-nav"
      :class="{
        'h-0 opacity-0 overflow-hidden':
          $route.name === 'login' ||
          $route.name === 'register' ||
          $route.name === 'not-found',
        'h-auto opacity-100':
          $route.name != 'login' &&
          $route.name != 'register' &&
          $route.name != 'not-found',
      }"
    >
      <div class="w-full pb-nav-padding"></div>
      <div class="w-full px-4 pb-2 pt-8 sm:pb-4 sm:pt-4">
        <div
          v-if="activeTab !== 'Add Book' && activeTab !== 'Profile'"
          class="relative"
        >
          <span class="absolute inset-y-0 left-0 flex items-center pl-2">
            <svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
          </span>
          <input
            type="text"
            class="w-full py-1 pl-8 bg-white dark:bg-zinc-700 dark:placeholder:text-zinc-400 rounded-xl text-gray-800 dark:text-gray-100 outline-none"
            placeholder="Search book"
          />
        </div>
        <div v-else class="relative">
          <p
            class="text-light-nav-text dark:text-dark-nav-text font-semibold text-center"
          >
            {{ activeTab }}
          </p>
        </div>
      </div>
    </nav>

    <!-- Main Content (Scrollable) -->
    <main class="overflow-auto">
      <router-view />
    </main>

    <!-- Fixed Footer -->
    <footer
      class="sticky bottom-0 z-50 bg-light-bg"
      :class="[
        $route.name === 'not-found' ? 'dark:bg-dark-bg' : 'dark:bg-dark-nav',
      ]"
    >
      <TabsComponent
        v-if="
          $route.name !== 'login' &&
          $route.name !== 'register' &&
          $route.name !== 'not-found'
        "
        class="w-full"
      />
      <div v-else class="mx-auto p-6 flex justify-center">
        <a
          href="https://github.com/andremfp/ourlib"
          class="text-black dark:text-gray-200"
          aria-label="Github"
        >
          <svg
            class="w-5 h-5 fill-current"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.026 2C7.13295 1.99937 2.96183 5.54799 2.17842 10.3779C1.395 15.2079 4.23061 19.893 8.87302 21.439C9.37302 21.529 9.55202 21.222 9.55202 20.958C9.55202 20.721 9.54402 20.093 9.54102 19.258C6.76602 19.858 6.18002 17.92 6.18002 17.92C5.99733 17.317 5.60459 16.7993 5.07302 16.461C4.17302 15.842 5.14202 15.856 5.14202 15.856C5.78269 15.9438 6.34657 16.3235 6.66902 16.884C6.94195 17.3803 7.40177 17.747 7.94632 17.9026C8.49087 18.0583 9.07503 17.99 9.56902 17.713C9.61544 17.207 9.84055 16.7341 10.204 16.379C7.99002 16.128 5.66202 15.272 5.66202 11.449C5.64973 10.4602 6.01691 9.5043 6.68802 8.778C6.38437 7.91731 6.42013 6.97325 6.78802 6.138C6.78802 6.138 7.62502 5.869 9.53002 7.159C11.1639 6.71101 12.8882 6.71101 14.522 7.159C16.428 5.868 17.264 6.138 17.264 6.138C17.6336 6.97286 17.6694 7.91757 17.364 8.778C18.0376 9.50423 18.4045 10.4626 18.388 11.453C18.388 15.286 16.058 16.128 13.836 16.375C14.3153 16.8651 14.5612 17.5373 14.511 18.221C14.511 19.555 14.499 20.631 14.499 20.958C14.499 21.225 14.677 21.535 15.186 21.437C19.8265 19.8884 22.6591 15.203 21.874 10.3743C21.089 5.54565 16.9181 1.99888 12.026 2Z"
            ></path>
          </svg>
        </a>
      </div>
      <div
        :class="[
          'w-full pb-footer-padding',
          $route.name != 'login' &&
          $route.name != 'register' &&
          $route.name != 'not-found'
            ? 'bg-white dark:bg-dark-bg'
            : '',
        ]"
      ></div>
    </footer>
  </div>
</template>
