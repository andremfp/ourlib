<script setup lang="ts">
import { useRouter } from "vue-router";
import { getAuth, signOut } from "firebase/auth";
import CameraComponent from "@/components/Camera.vue";

const auth = getAuth();
const router = useRouter();

let showCamera = ref(false); // State to toggle camera visibility

// Logout handler
const logout = async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
    // Redirect to login or home page
    router.push("/");
  } catch (error: any) {
    console.error("Logout error:", error.message);
  }
};

// Toggle camera visibility
const toggleCamera = () => {
  showCamera.value = !showCamera.value;
};
</script>

<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900"
  >
    <!-- Logout button -->
    <button
      @click="logout"
      class="flex items-center px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-blue-600 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-80"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-5 h-5 mx-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M17 16L21 12M21 12L17 8M21 12L7 12M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8"
        />
      </svg>
      <span class="mx-1">Logout</span>
    </button>

    <!-- Scan button to toggle camera -->
    <button
      @click="toggleCamera"
      class="mt-4 px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-md shadow hover:bg-green-600"
    >
      Scan
    </button>

    <!-- Show camera when `showCamera` is true -->
    <div v-if="showCamera">
      <CameraComponent />
    </div>
  </div>
</template>
