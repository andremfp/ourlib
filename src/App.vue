<template>
  <div id="app">
    <main>
      <!-- The router-view renders the matched route's component -->
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  } else {
    console.log("Service Worker not supported in this browser.");
  }
});
</script>
