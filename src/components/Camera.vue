<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";
import logger from "@/utils/logger";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import type { QrcodeSuccessCallback } from "html5-qrcode";

interface CameraStatus {
  loading: boolean;
  error: boolean;
  message: string;
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

    const handleError = (context: string, error: any): void => {
      status.value.error = true;
      status.value.loading = false;
      let errorMessage = "An error occurred";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error && error.message) {
        errorMessage = error.message;
      }

      status.value.message = errorMessage;
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
      if (!error.includes("NotFoundException")) {
        logger.warn(`[html5-qrcode] Scan Error:`, error);
      }
    };

    const startCameraScan = async () => {
      if (!html5QrCode.value) {
        handleError("startCameraScan", "Scanner not initialized.");
        return;
      }

      status.value = {
        loading: true,
        error: false,
        message: "Requesting camera...",
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
        handleError("startCameraScan", err);
      }
    };

    const stopCameraScan = async () => {
      if (isStopping || !html5QrCode.value?.isScanning) return;
      isStopping = true;
      try {
        await html5QrCode.value.stop();
        status.value.message = "Camera stopped.";
      } catch (err) {
        handleError("stopCameraScan", err);
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
    class="flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg p-4 w-full space-y-4"
  >
    <div class="w-full text-center">
      <p
        :class="`text-lg font-medium ${status.error ? 'text-red-500' : 'text-dark-secondary-text'}`"
      >
        {{ status.message }}
      </p>
    </div>

    <div
      :id="READER_ELEMENT_ID"
      class="w-full rounded-lg overflow-hidden"
      style="min-height: 300px"
    ></div>

    <div v-if="status.loading" class="flex justify-center items-center">
      <svg
        class="animate-spin h-8 w-8 text-dark-secondary-text"
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

    <button
      v-else-if="!status.error"
      @click="stopAndCancel"
      class="bg-warning-red text-white font-semibold rounded-lg px-6 py-2"
    >
      Stop Scanning
    </button>
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
