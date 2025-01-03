<script lang="ts">
import { defineComponent, ref } from "vue";

interface CameraStatus {
  loading: boolean;
  error: boolean;
  message: string;
}

interface VideoConstraints {
  facingMode: string;
  width: {
    ideal: number;
  };
  height: {
    ideal: number;
  };
}

interface MediaConstraints {
  video: VideoConstraints;
}

export default defineComponent({
  name: "CameraFeed",

  setup() {
    const videoElement = ref<HTMLVideoElement | null>(null);
    const stream = ref<MediaStream | null>(null);
    const status = ref<CameraStatus>({
      loading: true,
      error: false,
      message: "Initializing camera...",
    });

    const handleError = (error: Error): void => {
      status.value.error = true;
      status.value.loading = false;

      let errorMessage = "An error occurred while accessing the camera";

      switch (error.name) {
        case "NotFoundError":
          errorMessage = "No camera found on this device";
          break;
        case "NotAllowedError":
          errorMessage = "Camera access denied by user";
          break;
        case "NotReadableError":
          errorMessage = "Camera is already in use";
          break;
        case "OverconstrainedError":
          errorMessage = "Camera cannot satisfy the requested constraints";
          break;
      }

      status.value.message = errorMessage;
      console.log(`[Camera Debug] Error: ${error.name} - ${error.message}`);
    };

    const initializeCamera = async (): Promise<void> => {
      try {
        console.log("[Camera Debug] Requesting camera permissions...");

        const constraints: MediaConstraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };

        console.log(
          "[Camera Debug] Getting user media with constraints: " +
            JSON.stringify(constraints)
        );
        stream.value = await navigator.mediaDevices.getUserMedia(constraints);

        console.log("[Camera Debug] Camera stream obtained successfully");

        const trackSettings = stream.value.getVideoTracks()[0].getSettings();
        console.log(
          `[Camera Debug] Stream settings: ${JSON.stringify(trackSettings)}`
        );

        if (videoElement.value) {
          videoElement.value.srcObject = stream.value;
          status.value.loading = false;
          status.value.message = "Camera active";
          console.log("[Camera Debug] Video element configured and playing");
        } else {
          throw new Error("Video element not found");
        }
      } catch (error) {
        handleError(error as Error);
      }
    };

    return {
      videoElement,
      stream,
      status,
      initializeCamera,
    };
  },

  mounted() {
    console.log("[Camera Debug] Component mounted");
    this.initializeCamera();
  },

  beforeUnmount() {
    if (this.stream) {
      console.log("[Camera Debug] Stopping all camera tracks");
      this.stream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
        console.log(`[Camera Debug] Track ${track.id} stopped`);
      });
    }
  },
});
</script>

<template>
  <div
    class="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 space-y-6"
  >
    <!-- Status messages -->
    <div class="mb-4">
      <p :class="`text-lg ${status.error ? 'text-red-500' : 'text-green-500'}`">
        {{ status.message }}
      </p>
    </div>

    <!-- Video feed container -->
    <div class="relative w-full max-w-2xl rounded-lg overflow-hidden shadow-lg">
      <video
        ref="videoElement"
        class="w-full h-full object-cover"
        autoplay
        playsinline
      ></video>

      <!-- Loading spinner -->
      <div
        v-if="status.loading"
        class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"
        ></div>
      </div>
    </div>
  </div>
</template>
