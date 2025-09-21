<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { IonApp, IonRouterOutlet } from "@ionic/vue";

// This function toggles the 'dark' class on the body element
const toggleDarkTheme = (shouldAdd: boolean) => {
  document.body.classList.toggle("dark", shouldAdd);
};

// Use the browser's matchMedia API to check for the user's theme preference
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

// Define the handler function once to ensure it can be added and removed correctly
const handleThemeChange = (e: MediaQueryListEvent) =>
  toggleDarkTheme(e.matches);

onMounted(() => {
  // Set the initial theme based on the user's preference
  toggleDarkTheme(prefersDark.matches);

  // Add a listener to watch for changes in the user's theme preference
  prefersDark.addEventListener("change", handleThemeChange);
});

onUnmounted(() => {
  // Clean up the listener when the component is unmounted
  prefersDark.removeEventListener("change", handleThemeChange);
});
</script>

<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>
