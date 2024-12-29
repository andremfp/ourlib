<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900"
  >
    <div v-if="isMobile" class="w-full max-w-sm">
      <video
        ref="video"
        autoplay
        playsinline
        class="w-full h-auto rounded-lg border border-gray-300 shadow-lg"
      ></video>
      <div class="flex justify-between mt-4">
        <button
          @click="stopCamera"
          class="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-md shadow hover:bg-red-600"
        >
          Stop Camera
        </button>
        <button
          @click="capturePhoto"
          class="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md shadow hover:bg-blue-600"
        >
          Capture Photo
        </button>
      </div>
      <div v-if="photo" class="mt-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">Captured Photo:</p>
        <img :src="photo" alt="Captured" class="w-full rounded-lg shadow-md" />
      </div>
    </div>
    <p v-else class="text-center text-gray-700 dark:text-gray-300">
      Please use a mobile device to access the camera.
    </p>
    <div class="mt-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">Log Output:</p>
      <pre class="bg-gray-800 text-white p-4 rounded-md">{{ logOutput }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isMobile: false,
      stream: null,
      photo: null,
      logOutput: "", // To store log output
    };
  },
  mounted() {
    this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (this.isMobile) {
      this.startCamera();
    }
  },
  methods: {
    async startCamera() {
      const videoElement = this.$refs.video;
      try {
        this.logMessage("Requesting camera access...");
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: "environment" } }, // Rear camera
        });
        videoElement.srcObject = this.stream;
        this.logMessage("Camera access granted.");
      } catch (error) {
        console.error("Camera access error:", error);
        this.logMessage(`Camera access error: ${error.message}`);
        alert(
          "Could not access the camera. Please ensure permissions are granted."
        );
      }
    },
    stopCamera() {
      if (this.stream) {
        const tracks = this.stream.getTracks();
        tracks.forEach((track) => track.stop());
        this.stream = null;
        this.logMessage("Camera stopped.");
      }
    },
    capturePhoto() {
      const videoElement = this.$refs.video;
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      this.photo = canvas.toDataURL("image/png"); // Store the captured photo as Base64
      this.logMessage("Photo captured.");
    },
    logMessage(message) {
      this.logOutput += `${message}\n`;
    },
  },
};
</script>
