<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";
import { BrowserMultiFormatReader } from "@zxing/library";
import logger from "@/utils/logger";

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
    let animationFrameId: number | null = null; // Add this to track the animation frame

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
      logger.error(`Error: ${error.name} - ${error.message}`);
    };

    const isValidISBN = (code: string): boolean => {
      const cleanCode = code.replace(/[-\s]/g, "");
      return /^(\d{10}|\d{13})$/.test(cleanCode);
    };

    const startScanning = async () => {
      if (!scanning) {
        logger.debug("Scanning stopped, exiting scan loop");
        return;
      }

      if (
        !videoElement.value ||
        !barcodeReader.value ||
        !stream.value?.active
      ) {
        logger.debug("Required elements not available or stream inactive");
        stopScanning();
        return;
      }

      try {
        logger.info("Scanning for barcode...");
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
            logger.info("Valid ISBN detected:", text);
            lastScannedCode = text;
            lastScannedTime = currentTime;
            emit("isbn-scanned", text);
          }
        }
      } catch (error) {
        // Only log non-standard errors
        if (
          error instanceof Error &&
          !error.message.includes(
            "No MultiFormat Readers were able to detect"
          ) &&
          scanning // Only log if we're still meant to be scanning
        ) {
          logger.warn("Scanning error:", error);
        }
      }

      // Continue scanning if still active
      if (scanning) {
        animationFrameId = requestAnimationFrame(startScanning);
      }
    };

    const initializeBarcodeScanner = () => {
      if (!videoElement.value) return;

      try {
        barcodeReader.value = new BrowserMultiFormatReader();
        scanning = true;
        startScanning();
        logger.debug("Barcode scanner initialized");
      } catch (error) {
        logger.error("Failed to initialize scanner:", error);
        handleError(error as Error);
      }
    };

    const initializeCamera = async (): Promise<void> => {
      try {
        logger.debug("Requesting camera permissions...");

        const constraints: MediaConstraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        stream.value = await navigator.mediaDevices.getUserMedia(constraints);
        logger.debug("Camera stream obtained successfully");

        if (videoElement.value) {
          videoElement.value.srcObject = stream.value;
          videoElement.value.style.transform = "scale(2)";
          videoElement.value.style.transformOrigin = "center";

          videoElement.value.onloadedmetadata = () => {
            status.value.loading = false;
            status.value.message = "Camera active - Ready to scan";
            logger.debug("Video element ready, initializing scanner");
            initializeBarcodeScanner();
          };
        } else {
          throw new Error("Video element not found");
        }
      } catch (error) {
        handleError(error as Error);
      }
    };

    const stopScanning = () => {
      scanning = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      logger.debug("Scanning stopped gracefully");
    };

    const stopCamera = () => {
      // First stop scanning to prevent any new decode attempts
      stopScanning();

      if (videoElement.value) {
        videoElement.value.srcObject = null;
      }

      if (stream.value) {
        logger.debug("Stopping all camera tracks");
        stream.value.getTracks().forEach((track: MediaStreamTrack) => {
          track.stop();
        });
        stream.value = null;
      }

      // Reset the barcode reader
      if (barcodeReader.value) {
        logger.debug("Resetting barcode reader");
        barcodeReader.value.reset();
        barcodeReader.value = null;
      }
    };

    onMounted(() => {
      initializeCamera();
    });

    onBeforeUnmount(() => {
      stopCamera();
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
    <div class="mb-4">
      <p :class="`text-lg ${status.error ? 'text-red-500' : 'text-green-500'}`">
        {{ status.message }}
      </p>
    </div>

    <div class="relative w-full max-w-md rounded-lg overflow-hidden shadow-lg">
      <video
        ref="videoElement"
        class="w-full h-full object-cover"
        autoplay
        playsinline
      ></video>

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
