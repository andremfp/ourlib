import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";

// Initialize Firebase Admin SDK
initializeApp();

// Initialize Firestore
const db = getFirestore();

if (process.env.FUNCTIONS_EMULATOR === "true") {
  db.settings({ host: "127.0.0.1:8080" });
}

const UPDATES_COLLECTION = "updates";
const CLEANUP_DAYS = 30;
const BATCH_SIZE = 500;

interface CleanupResult {
  deletedCount: number;
}

// Cleanup logic
const cleanupOldUpdates = async (): Promise<CleanupResult> => {
  logger.info("cleanupOldUpdates | Starting cleanup process");

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - CLEANUP_DAYS);

  const cutoffTimestamp = Timestamp.fromDate(cutoff).toDate();

  logger.info("cleanupOldUpdates | Cutoff timestamp:", cutoffTimestamp);

  try {
    const updatesRef = db.collection(UPDATES_COLLECTION);

    const oldUpdatesQuery = updatesRef.where(
      "timestamp",
      "<",
      Timestamp.fromDate(cutoff),
    );

    const snapshot = await oldUpdatesQuery.get();

    if (snapshot.empty) {
      logger.info(
        "cleanupOldUpdates | No old updates to delete. Cleanup complete.",
      );
      return { deletedCount: 0 };
    }

    logger.info(
      "cleanupOldUpdates | Documents found for deletion:",
      snapshot.size,
    );

    // Process in batches
    const docs = snapshot.docs;
    const batches = Math.ceil(docs.length / BATCH_SIZE);

    for (let i = 0; i < batches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, docs.length);
      const batch = db.batch();

      docs.slice(start, end).forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      logger.info(`Completed batch ${i + 1}/${batches}`);
    }

    logger.info(`Successfully deleted ${snapshot.size} old updates.`);
    return { deletedCount: snapshot.size };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(
      "cleanupOldUpdates | Error cleaning up old updates:",
      errorMessage,
    );
    throw new Error(`Cleanup failed: ${errorMessage}`);
  }
};

// Scheduled function (runs daily at midnight)
export const scheduledCleanup = onSchedule(
  {
    schedule: "0 0 * * *",
    region: "europe-west1",
    timeoutSeconds: 120,
  },
  async () => {
    logger.info("scheduledCleanup | Scheduled cleanup triggered.");
    await cleanupOldUpdates();
  },
);

// HTTP function to manually trigger cleanup
export const manualCleanup = onRequest(
  {
    region: "europe-west1",
    timeoutSeconds: 120,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed. Please use POST.");
      return;
    }

    try {
      logger.info("manualCleanup | Manual cleanup triggered");
      const result = await cleanupOldUpdates();
      logger.info("manualCleanup | Manual cleanup finished");
      res.status(200).json({
        status: "success",
        message: "Cleanup complete",
        ...result,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(
        "manualCleanup | Error during manual cleanup:",
        errorMessage,
      );
      res.status(500).json({
        status: "error",
        message: errorMessage,
      });
    }
  },
);
