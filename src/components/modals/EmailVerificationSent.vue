<script setup lang="ts">
import { IonButton, IonIcon, modalController } from "@ionic/vue";
import { mailOutline, checkmarkCircleOutline } from "ionicons/icons";

const props = defineProps<{
  email?: string;
}>();

const close = () => {
  modalController.dismiss();
};
</script>

<template>
  <div class="wrapper">
    <div class="icon-row">
      <ion-icon :icon="mailOutline" class="icon"></ion-icon>
      <ion-icon :icon="checkmarkCircleOutline" class="badge"></ion-icon>
    </div>
    <h1>Verify your email</h1>
    <p class="message">
      We sent a verification link to
      <strong>{{ props.email || "your email" }}.</strong>
      Please check your inbox and click the link to activate your account. You
      can log in after verifying your email.
    </p>

    <div class="actions">
      <ion-button expand="block" @click="close">OK</ion-button>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  padding: 16px;
  color: var(--ion-text-color);
}

.icon-row {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.icon {
  width: 64px;
  height: 64px;
  color: var(--ion-color-primary);
}

.badge {
  position: absolute;
  right: calc(50% - 42px);
  bottom: -2px;
  width: 24px;
  height: 24px;
  color: var(--ion-color-primary);
  background: var(--ion-background-color);
  border-radius: 9999px;
}

h1 {
  margin: 8px 0 8px;
  font-size: theme("fontSize.modal-title");
  font-weight: theme("fontWeight.bold");
  text-align: center;
}

.message {
  margin: 0;
  font-size: theme("fontSize.modal-text");
  color: var(--ion-text-color);
  text-align: center;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--ptr-text);
  text-align: center;
}

.actions {
  margin-top: 16px;
}

.actions ion-button {
  height: 44px;
  --border-radius: 8px;
  text-transform: none;
}
</style>
