<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
} from "@ionic/vue";
import { useRouter } from "vue-router";
import { cameraOutline, createOutline } from "ionicons/icons";

const router = useRouter();

const go_to_scan = () => {
  router.push("/tabs/add-book/scan");
};

const go_to_manual = () => {
  router.push("/tabs/add-book/manual");
};
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Add Book</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">
      <div class="flex flex-col h-full justify-center">
        <ion-card
          button
          @click="go_to_scan"
          class="flex-1 flex flex-col justify-center items-center"
        >
          <ion-card-header class="text-center">
            <ion-icon
              :icon="cameraOutline"
              class="text-6xl text-blue-500"
            ></ion-icon>
            <ion-card-title class="mt-4 text-2xl">Scan Barcode</ion-card-title>
          </ion-card-header>
          <ion-card-content class="text-center">
            Use your camera to scan the book's barcode
          </ion-card-content>
        </ion-card>

        <ion-card
          button
          @click="go_to_manual"
          class="flex-1 flex flex-col justify-center items-center mt-4"
        >
          <ion-card-header class="text-center">
            <ion-icon
              :icon="createOutline"
              class="text-6xl text-blue-500"
            ></ion-icon>
            <ion-card-title class="mt-4 text-2xl">Manual Entry</ion-card-title>
          </ion-card-header>
          <ion-card-content class="text-center">
            Enter book details manually
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>
