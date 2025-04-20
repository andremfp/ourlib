<template>
  <div class="h-full">
    <component :is="currentViewComponent" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useViewStore } from "@/stores/viewStore";

// Import the possible view components
import LoginView from "@/views/Login.vue";
import RegisterView from "@/views/Register.vue";
import MainView from "@/views/Main.vue";

const viewStore = useViewStore();

// Map view names to actual component references directly
const viewComponents = {
  Login: LoginView,
  Register: RegisterView,
  Main: MainView,
};

// Compute the component to render based on the store's activeView
const currentViewComponent = computed(() => {
  return viewComponents[viewStore.activeView] || null;
});
</script>
