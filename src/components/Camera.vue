<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";
import { BrowserMultiFormatReader } from "@zxing/library";

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

  setup(_, { emit }) {
    const videoElement = ref<HTMLVideoElement | null>(null);
    const stream = ref<MediaStream | null>(null);
    const status = ref<CameraStatus>({
      loading: true,
      error: false,
      message: "Initializing camera...",
    });

    const barcodeReader = ref<BrowserMultiFormatReader | null>(null);
    let scanning = false;
    let lastScannedCode: string | null = null;
    let lastScannedTime = 0;

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
      console.error(`[Camera Debug] Error: ${error.name} - ${error.message}`);
    };

    const isValidISBN = (code: string): boolean => {
      const cleanCode = code.replace(/[-\s]/g, "");
      return /^(\d{10}|\d{13})$/.test(cleanCode);
    };

    const startScanning = async () => {
      console.log("[ZXing Debug] Scanning for barcodes...");
      if (!videoElement.value || !barcodeReader.value || !scanning) return;

      try {
        const result = await barcodeReader.value.decodeFromVideoElement(
          videoElement.value
        );

        if (result) {
          const text = result.getText();
          const currentTime = Date.now();

          if (
            isValidISBN(text) &&
            (text !== lastScannedCode || currentTime - lastScannedTime > 3000)
          ) {
            console.log("[ZXing Debug] Valid ISBN detected:", text);
            lastScannedCode = text;
            lastScannedTime = currentTime;
            emit("isbn-scanned", text);
          }
        }
      } catch (error) {
        // Only log non-standard errors
        if (
          error instanceof Error &&
          !error.message.includes("No MultiFormat Readers were able to detect")
        ) {
          console.warn("[ZXing Debug] Scanning error:", error);
        }
      }

      // Continue scanning if still active
      if (scanning) {
        requestAnimationFrame(startScanning);
      }
    };

    const initializeBarcodeScanner = () => {
      if (!videoElement.value) return;

      try {
        // Initialize reader
        barcodeReader.value = new BrowserMultiFormatReader();
        scanning = true;

        // Start the scanning loop
        startScanning();
        console.log("[ZXing Debug] Barcode scanner initialized");
      } catch (error) {
        console.error("[ZXing Debug] Failed to initialize scanner:", error);
        handleError(error as Error);
      }
    };

    const initializeCamera = async (): Promise<void> => {
      try {
        console.log("[Camera Debug] Requesting camera permissions...");

        const constraints: MediaConstraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        stream.value = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("[Camera Debug] Camera stream obtained successfully");

        if (videoElement.value) {
          videoElement.value.srcObject = stream.value;

          // Wait for video to be ready before initializing scanner
          videoElement.value.onloadedmetadata = () => {
            status.value.loading = false;
            status.value.message = "Camera active - Ready to scan";
            console.log(
              "[Camera Debug] Video element ready, initializing scanner"
            );
            initializeBarcodeScanner();
          };
        } else {
          throw new Error("Video element not found");
        }
      } catch (error) {
        handleError(error as Error);
      }
    };

    onMounted(() => {
      console.log("[Camera Debug] Component mounted");
      initializeCamera();
    });

    onBeforeUnmount(() => {
      scanning = false;

      if (stream.value) {
        console.log("[Camera Debug] Stopping all camera tracks");
        stream.value.getTracks().forEach((track: MediaStreamTrack) => {
          track.stop();
        });
      }

      if (barcodeReader.value) {
        console.log("[ZXing Debug] Resetting barcode reader");
        barcodeReader.value.reset();
        barcodeReader.value = null;
      }
    });

    return {
      videoElement,
      stream,
      status,
    };
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
    <div class="relative w-full max-w-md rounded-lg overflow-hidden shadow-lg">
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
