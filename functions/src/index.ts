import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const UPDATES_COLLECTION = "Updates";

/**
 * A scheduled function to clean up updates older than 30 days.
 */
export const cleanupOldUpdates = onSchedule(
  { schedule: "0 0 * * *", region: "europe-west1" },
  async () => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - 30); // 30 days ago

    try {
      const updatesRef = db.collection(UPDATES_COLLECTION);
      const oldUpdatesQuery = updatesRef.where(
        "timestamp",
        "<",
        admin.firestore.Timestamp.fromDate(cutoff),
      );

      const snapshot = await oldUpdatesQuery.get();

      if (snapshot.empty) {
        console.log("No old updates to delete.");
        return; // Remove null return
      }

      // For large collections, process in chunks to avoid memory issues
      const chunkSize = 500;
      const docs = snapshot.docs;

      for (let i = 0; i < docs.length; i += chunkSize) {
        const chunk = docs.slice(i, i + chunkSize);
        const batch = db.batch();
        chunk.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }

      console.log(`Deleted ${snapshot.size} old updates.`);
    } catch (error) {
      console.error("Error cleaning up old updates:", error);
      throw new Error("Cleanup failed");
    }
  },
);
