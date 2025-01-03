<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from "vue";
import Quagga from "quagga";

// Video container reference
const videoRef = ref<HTMLDivElement | null>(null);
const errorMessage = ref<string | null>(null); // To hold error message if camera is unavailable

// Emit detected ISBN
const emit = defineEmits(["onISBN"]);

// Initialize Quagga
const initializeScanner = () => {
  nextTick(() => {
    // Ensure DOM is updated before Quagga tries to access the video container
    if (!videoRef.value) {
      console.error("Video container not found.");
      return;
    }

    console.log("Initializing Quagga scanner...");

    // Attempt to access the camera
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (videoRef.value) {
          videoRef.value.srcObject = stream;
          videoRef.value.play();
        }

        // Initialize Quagga after stream is set up
        Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: videoRef.value, // Target is the container element
              constraints: {
                facingMode: "environment", // Try this for rear camera, front for desktop fallback
              },
            },
            decoder: {
              readers: ["ean_reader"], // Supports ISBN barcodes
            },
          },
          (err) => {
            if (err) {
              console.error("Quagga initialization error:", err);
              errorMessage.value =
                "Failed to initialize barcode scanner. Please try again.";
              return;
            }
            console.log("Quagga initialized successfully.");
            Quagga.start();
          }
        );

        // Barcode detection handler
        Quagga.onDetected((result) => {
          const code = result?.codeResult?.code;
          if (code) {
            console.log("Detected ISBN:", code);
            Quagga.stop(); // Stop scanning after detection
            emit("onISBN", code); // Emit the detected ISBN
          }
        });
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        errorMessage.value =
          "Could not access the camera. Please ensure permissions are granted.";
      });
  });
};

// Cleanup Quagga when component unmounts
const cleanupScanner = () => {
  Quagga.stop();
  Quagga.offDetected();
};

onMounted(() => {
  console.log("Component mounted. Attempting to initialize scanner...");
  initializeScanner();
});

onUnmounted(() => {
  cleanupScanner();
});
</script>

<template>
  <div>
    <!-- Video container for camera stream -->
    <div
      ref="video"
      class="w-full max-w-sm h-auto rounded border border-gray-300 shadow"
    ></div>

    <!-- Display error message if camera is unavailable -->
    <p v-if="errorMessage" class="text-red-500 text-center mt-4">
      {{ errorMessage }}
    </p>
  </div>
</template>
