<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount } from "vue";
import logger from "@/utils/logger";
import {
  Html5QrcodeScanner,
  Html5QrcodeSupportedFormats,
  Html5QrcodeScannerState,
} from "html5-qrcode";
import type { QrcodeSuccessCallback } from "html5-qrcode";

export default defineComponent({
  name: "CameraFeed",

  setup(_, { emit }) {
    const READER_ELEMENT_ID = "html5-qrcode-reader";
    let html5QrcodeScanner: Html5QrcodeScanner | null = null;
    let readyInterval: any = null;

    let lastScannedCode: string | null = null;
    let lastScannedTime = 0;

    const isValidISBN = (code: string): boolean => {
      const cleanCode = code.replace(/[-\s]/g, "");
      return /^(\d{10}|\d{13})$/.test(cleanCode);
    };

    const onScanSuccess: QrcodeSuccessCallback = (
      decodedText,
      decodedResult,
    ) => {
      logger.info(
        `[Html5QrcodeScanner] Success! Decoded text: ${decodedText}`,
        decodedResult,
      );
      const currentTime = Date.now();

      if (
        decodedText === lastScannedCode &&
        currentTime - lastScannedTime <= 3000
      ) {
        logger.debug(
          `[Html5QrcodeScanner] ISBN '${decodedText}' was scanned recently. Debouncing.`,
        );
        return;
      }

      if (isValidISBN(decodedText)) {
        logger.info(
          `[Html5QrcodeScanner] Valid ISBN '${decodedText}' detected.`,
        );
        lastScannedCode = decodedText;
        lastScannedTime = currentTime;
        emit("isbn-scanned", decodedText);

        if (html5QrcodeScanner) {
          // Intentionally not awaiting this to avoid blocking
          html5QrcodeScanner.clear().catch((err) => {
            logger.error(
              "[Html5QrcodeScanner] Error clearing scanner after success:",
              err,
            );
          });
        }
      }
    };

    const onScanFailure = (error: string) => {
      // We're only logging non-NotFoundExceptions as warnings.
      if (!error.includes("NotFoundException")) {
        logger.warn(`[Html5QrcodeScanner] Scan Error:`, error);
      }
    };

    onMounted(() => {
      logger.debug("[Html5QrcodeScanner] CameraFeed component onMounted.");

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
      ];

      const config = {
        fps: 10,
        rememberLastUsedCamera: true,
        formatsToSupport: formatsToSupport,
      };

      html5QrcodeScanner = new Html5QrcodeScanner(
        READER_ELEMENT_ID,
        config,
        false, // verbose
      );

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);

      readyInterval = setInterval(() => {
        if (
          html5QrcodeScanner &&
          html5QrcodeScanner.getState() === Html5QrcodeScannerState.SCANNING
        ) {
          logger.info(
            "[Html5QrcodeScanner] Scanner is ready. Applying video constraints for focus and zoom.",
          );
          (html5QrcodeScanner as any)
            .applyVideoConstraints({
              focusMode: "continuous",
              advanced: [{ zoom: 2.0 }],
            })
            .then(() => {
              logger.info(
                "[Html5QrcodeScanner] Video constraints applied successfully.",
              );
            })
            .catch((err: any) => {
              logger.warn(
                "[Html5QrcodeScanner] Failed to apply video constraints:",
                err,
              );
            });
          clearInterval(readyInterval);
        }
      }, 1000);
    });

    onBeforeUnmount(() => {
      if (readyInterval) {
        clearInterval(readyInterval);
      }
      logger.debug(
        "[Html5QrcodeScanner] Unmounting. Clearing scanner instance.",
      );
      if (html5QrcodeScanner) {
        // As per docs, calling clear() is the proper way to stop and unmount the scanner.
        html5QrcodeScanner.clear().catch((err) => {
          logger.error("[Html5QrcodeScanner] Error during unmount clear:", err);
        });
      }
    });

    return {
      READER_ELEMENT_ID,
    };
  },
});
</script>

<template>
  <div
    class="flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg p-4 w-full"
  >
    <!-- The Html5QrcodeScanner will render its own UI, including status messages and a loading spinner, inside this div -->
    <div
      :id="READER_ELEMENT_ID"
      class="w-full rounded-lg"
      style="min-height: 300px"
    ></div>
  </div>
</template>
