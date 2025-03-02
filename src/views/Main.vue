<script lang="ts">
import { computed } from "vue";
import { useTabStore } from "@/stores/tabStore";
import AddBook from "@/components/AddBook.vue";
import Profile from "@/components/Profile.vue";
import MyLibraries from "@/components/MyLibraries.vue";

export default {
  setup() {
    const { activeTab } = useTabStore();

    const renderComponent = computed(() => {
      switch (activeTab.value) {
        // case "Home":
        //   return Home;
        case "My Libraries":
          return MyLibraries;
        case "Add Book":
          return AddBook;
        // case "Search":
        //   return Search;
        case "Profile":
          return Profile;
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
