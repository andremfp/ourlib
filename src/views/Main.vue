<script lang="ts">
import { computed } from "vue";
import { useTabStore } from "@/stores/tabStore";
import AddBook from "@/components/AddBook.vue";
import User from "@/components/User.vue";

export default {
  setup() {
    const { activeTab } = useTabStore();

    const renderComponent = computed(() => {
      switch (activeTab.value) {
        // case "Home":
        //   return Home;
        // case "My Library":
        //   return MyLibrary;
        case "Add Book":
          return AddBook;
        // case "Search":
        //   return Search;
        case "User":
          return User;
        default:
          return null;
      }
    });

    return {
      renderComponent,
      activeTab,
    };
  },
};
</script>

<template>
  <div class="flex-1 flex justify-center items-center">
    <component :is="renderComponent" v-if="renderComponent" />
    <div v-else class="text-white">
      No component found for tab: {{ activeTab }}
    </div>
  </div>
</template>
