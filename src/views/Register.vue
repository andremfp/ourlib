<script setup lang="ts">
import { ref } from "vue";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

const username = ref("");
const password = ref("");

const register = async () => {
  try {
    const dummyEmail = username.value + "@dummy.com";
    await createUserWithEmailAndPassword(auth, dummyEmail, password.value);
    console.log("User registered successfully");
  } catch (error: any) {
    console.error("Registration error:", error.message);
  }
};
</script>

<template>
  <div>
    <h1>Register</h1>
    <input v-model="username" type="text" placeholder="Username" />
    <input v-model="password" type="password" placeholder="Password" />
    <button @click="register">Register</button>
  </div>
</template>
