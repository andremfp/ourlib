<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
} from "@ionic/vue";
// NOTE: You will need to import your Firebase auth logic here to make handleLogin work.

const router = useRouter();
const email = ref("");
const password = ref("");

const handleLogin = () => {
  // Add your Firebase login logic here
  console.log("Login attempt with:", email.value, password.value);
  // On success, the router guard will automatically redirect to '/tabs'
};

const goToRegister = () => {
  router.push("/register");
};
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-input
            label="Email"
            label-placement="floating"
            type="email"
            v-model="email"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            label="Password"
            label-placement="floating"
            type="password"
            v-model="password"
          ></ion-input>
        </ion-item>
      </ion-list>
      <ion-button expand="block" @click="handleLogin" class="ion-margin-top"
        >Login</ion-button
      >
      <ion-button expand="block" fill="clear" @click="goToRegister"
        >Create an account</ion-button
      >
    </ion-content>
  </ion-page>
</template>
