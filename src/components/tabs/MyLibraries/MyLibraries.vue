<script setup lang="ts">
import { markRaw } from "vue";
import { IonNav } from "@ionic/vue";
import LibraryList from "./LibraryList.vue";

const component = markRaw(LibraryList);
</script>

<template>
  <ion-nav :root="component"></ion-nav>
</template>
