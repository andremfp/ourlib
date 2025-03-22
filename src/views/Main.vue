<script setup lang="ts">
import { computed } from "vue";
import { useTabStore } from "@/stores/tabStore";
import AddBook from "@/components/tabs/AddBook.vue";
import Profile from "@/components/tabs/Profile.vue";
import MyLibraries from "@/components/tabs/MyLibraries/MyLibraries.vue";

const tabStore = useTabStore();
const activeTab = computed(() => tabStore.activeTab);

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
</script>

<template>
  <div class="flex-1 h-full flex">
    <component
      :is="renderComponent"
      v-if="renderComponent"
      class="w-full h-full"
    />
    <div v-else class="text-white w-full flex items-center justify-center">
      No component found for tab: {{ activeTab }}
    </div>
  </div>
</template>
