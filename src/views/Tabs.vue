<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="my-libraries" href="/tabs/my-libraries">
          <ion-icon :icon="libraryOutline" />
          <ion-label>My Libraries</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="add-book" href="/tabs/add-book">
          <ion-icon :icon="addCircleOutline" />
          <ion-label>Add Book</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="personCircleOutline" />
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
} from "@ionic/vue";
import {
  libraryOutline,
  addCircleOutline,
  personCircleOutline,
} from "ionicons/icons";
</script>
