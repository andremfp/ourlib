<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";
import logger from "@/utils/logger";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import type { QrcodeSuccessCallback } from "html5-qrcode";

interface CameraStatus {
  loading: boolean;
  error: boolean;
  message: string;
  errorType?: string;
}

export default defineComponent({
  name: "CameraFeed",

  setup(_, { emit }) {
    const status = ref<CameraStatus>({
      loading: true,
      error: false,
      message: "Initializing camera...",
    });

    const html5QrCode = ref<Html5Qrcode | null>(null);
    const READER_ELEMENT_ID = "html5-qrcode-reader";

    let lastScannedCode: string | null = null;
    let lastScannedTime = 0;
    let isStopping = false;

    const handleError = async (context: string, error: any): Promise<void> => {
      // Stop scanning immediately to prevent further errors
      await stopCameraScan();

      status.value.error = true;
      status.value.loading = false;
      let errorMessage = "An error occurred";
      let errorType = "general";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error && error.message) {
        errorMessage = error.message;
      }

      // Check for permission denied errors
      const isPermissionError =
        errorMessage.includes("NotAllowedError") ||
        errorMessage.includes("Permission denied");

      // Provide user-friendly messages for common errors
      if (isPermissionError) {
        errorMessage = "Camera permission required";
        errorType = "permission";
      } else if (
        errorMessage.includes("NotFoundError") ||
        errorMessage.includes("No camera found")
      ) {
        errorMessage = "No camera found on this device";
        errorType = "no-camera";
      } else if (errorMessage.includes("NotSupportedError")) {
        errorMessage = "Camera scanning not supported";
        errorType = "not-supported";
      }

      status.value.message = errorMessage;
      status.value.errorType = errorType;
      logger.error(`CameraFeed Error (${context}):`, errorMessage, error);
    };

    const isValidISBN = (code: string): boolean => {
      const cleanCode = code.replace(/[-\s]/g, "");
      return /^(\d{10}|\d{13})$/.test(cleanCode);
    };

    const onScanSuccess: QrcodeSuccessCallback = (
      decodedText,
      decodedResult,
    ) => {
      logger.info(
        `[html5-qrcode] Success! Decoded text: ${decodedText}`,
        decodedResult,
      );
      const currentTime = Date.now();

      if (
        decodedText === lastScannedCode &&
        currentTime - lastScannedTime <= 3000
      ) {
        return;
      }

      if (isValidISBN(decodedText)) {
        lastScannedCode = decodedText;
        lastScannedTime = currentTime;
        emit("isbn-scanned", decodedText);
        stopCameraScan();
        status.value.message = `ISBN Scanned: ${decodedText}`;
      }
    };

    const onScanFailure = (error: string) => {
      // Filter out canvas/state errors that occur when element is not properly visible
      if (
        !error.includes("NotFoundException") &&
        !error.includes("IndexSizeError") &&
        !error.includes("InvalidStateError") &&
        !error.includes("getImageData") &&
        !error.includes("BarcodeDetector")
      ) {
        logger.warn(`[html5-qrcode] Scan Error:`, error);
      }
    };

    const startCameraScan = async () => {
      if (!html5QrCode.value) {
        await handleError("startCameraScan", "Scanner not initialized.");
        return;
      }

      status.value = {
        loading: true,
        error: false,
        message: "Opening camera...",
      };

      const config = {
        fps: 10,
        videoConstraints: {
          facingMode: "environment",
          advanced: [{ zoom: 2.0, focusMode: "continuous" }],
        } as any,
      };

      try {
        await html5QrCode.value.start({}, config, onScanSuccess, onScanFailure);
        status.value = {
          loading: false,
          error: false,
          message: "Camera active. Scanning...",
        };
      } catch (err) {
        await handleError("startCameraScan", err);
      }
    };

    const stopCameraScan = async () => {
      if (isStopping || !html5QrCode.value?.isScanning) return;
      isStopping = true;
      try {
        await html5QrCode.value.stop();
        status.value.message = "Camera stopped.";
      } catch (err) {
        // Don't call handleError here to avoid infinite recursion
        logger.error("Error stopping camera:", err);
      } finally {
        isStopping = false;
        status.value.loading = false;
      }
    };

    const stopAndCancel = () => {
      stopCameraScan();
      emit("cancel");
    };

    onMounted(() => {
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
      ];
      html5QrCode.value = new Html5Qrcode(READER_ELEMENT_ID, {
        formatsToSupport,
        verbose: false,
      });
      startCameraScan();
    });

    onBeforeUnmount(() => {
      stopCameraScan();
    });

    return {
      status,
      READER_ELEMENT_ID,
      stopAndCancel,
    };
  },
});
</script>

<template>
  <div
    class="flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg p-4 w-full h-full space-y-6"
  >
    <!-- Error State -->
    <div v-if="status.error" class="flex flex-col items-center space-y-4 py-8">
      <!-- Permission Error -->
      <div
        v-if="status.errorType === 'permission'"
        class="flex flex-col items-center space-y-4"
      >
        <div
          class="w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-12 h-12 text-orange-600 dark:text-orange-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-9V8a4 4 0 00-8 0v1m12 4v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h12a2 2 0 012 2z"
            />
          </svg>
        </div>
        <div class="text-center">
          <h3
            class="text-lg font-semibold text-light-primary-text dark:text-dark-primary-text mb-2"
          >
            Camera Permission Required
          </h3>
          <p
            class="text-light-secondary-text dark:text-dark-secondary-text text-sm max-w-sm"
          >
            To scan barcodes, please allow camera access in your browser
            settings or address bar, then try again.
          </p>
        </div>
      </div>

      <!-- No Camera Error -->
      <div
        v-else-if="status.errorType === 'no-camera'"
        class="flex flex-col items-center space-y-4"
      >
        <div
          class="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-12 h-12 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
          </svg>
        </div>
        <div class="text-center">
          <h3
            class="text-lg font-semibold text-light-primary-text dark:text-dark-primary-text mb-2"
          >
            No Camera Found
          </h3>
          <p
            class="text-light-secondary-text dark:text-dark-secondary-text text-sm max-w-sm"
          >
            This device doesn't have a camera or it's not accessible.
          </p>
        </div>
      </div>

      <!-- Not Supported Error -->
      <div
        v-else-if="status.errorType === 'not-supported'"
        class="flex flex-col items-center space-y-4"
      >
        <div
          class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-12 h-12 text-gray-600 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div class="text-center">
          <h3
            class="text-lg font-semibold text-light-primary-text dark:text-dark-primary-text mb-2"
          >
            Camera Scanning Not Supported
          </h3>
          <p
            class="text-light-secondary-text dark:text-dark-secondary-text text-sm max-w-sm"
          >
            Your browser or device doesn't support camera scanning.
          </p>
        </div>
      </div>

      <!-- General Error -->
      <div v-else class="flex flex-col items-center space-y-4">
        <div
          class="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-12 h-12 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div class="text-center">
          <h3
            class="text-lg font-semibold text-light-primary-text dark:text-dark-primary-text mb-2"
          >
            Camera Error
          </h3>
          <p
            class="text-light-secondary-text dark:text-dark-secondary-text text-sm max-w-sm"
          >
            {{ status.message }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-else-if="status.loading"
      class="flex flex-col items-center space-y-4 py-8 h-full"
    >
      <div class="flex justify-center items-center">
        <svg
          class="animate-spin h-12 w-12 text-menu-blue"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      <p
        class="text-lg font-medium text-light-secondary-text dark:text-dark-secondary-text"
      >
        {{ status.message }}
      </p>
    </div>

    <!-- Camera Scanner (always present for Html5Qrcode) -->
    <div
      :id="READER_ELEMENT_ID"
      class="w-full max-w-md mx-auto rounded-lg overflow-hidden"
      :style="{
        visibility: status.error || status.loading ? 'hidden' : 'visible',
      }"
    ></div>

    <!-- Active Camera Status -->
    <div v-if="!status.loading && !status.error" class="text-center space-y-4">
      <p class="text-light-secondary-text dark:text-dark-secondary-text">
        Point your camera at a book barcode
      </p>
      <ion-button
        @click="stopAndCancel"
        class="bg-warning-red hover:bg-red-600 text-white font-semibold rounded-lg px-6 py-2 transition-colors"
      >
        Stop Scanning
      </ion-button>
    </div>
  </div>
</template>

<style>
/* Global styles for Html5QrcodeScanner UI.
   These are not scoped because they need to target elements
   dynamically generated by the external library and apply
   the project's custom design system. */

/* Main container styling */
#html5-qrcode-reader {
  border: 1px solid #e5e7eb !important; /* gray-200 */
  border-radius: 0.5rem;
  overflow: hidden;
  padding: 1rem;
}

.dark #html5-qrcode-reader {
  border-color: #3f3f46 !important; /* zinc-700 */
}

/* Remove top borders from internal divs created by the library */
#html5-qrcode-reader > div {
  border-top: none !important;
}

/* General button styling */
#html5-qrcode-reader button {
  background-color: #007aff; /* menu-blue */
  color: white;
  font-weight: 600;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  transition: opacity 150ms;
  border: none;
  margin-top: 0.5rem;
}

#html5-qrcode-reader button:hover {
  opacity: 0.8;
}

#html5-qrcode-reader button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* "Stop" button specific color */
#html5-qrcode-reader #html5-qrcode-button-camera-stop {
  background-color: #ff3b30; /* warning-red */
}

/* Camera select dropdown */
#html5-qrcode-reader select {
  width: 100%;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #f2f4f8; /* light-bg */
  border: 1px solid #d1d5db; /* gray-300 */
  color: #1f2937; /* light-primary-text */
}

.dark #html5-qrcode-reader select {
  background-color: #27272a; /* dark-nav */
  border-color: #6b7280; /* dark-border */
  color: #e5e7eb; /* dark-primary-text */
}

/* Status text and link styling */
#html5-qrcode-reader span,
#html5-qrcode-reader a {
  color: #6b7280; /* light-secondary-text */
}

.dark #html5-qrcode-reader span,
.dark #html5-qrcode-reader a {
  color: #9ca3af; /* dark-secondary-text */
}

#html5-qrcode-reader a {
  text-decoration: none;
}
#html5-qrcode-reader a:hover {
  text-decoration: underline;
}
</style>
