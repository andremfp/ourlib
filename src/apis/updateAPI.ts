import { firestore } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import type { Update } from "./schema";

// Collection name
const updatesCollection = "updates";

// Add a new update
export const addUpdate = async (
  update: Omit<Update, "id">,
): Promise<string> => {
  const docRef = await addDoc(collection(firestore, updatesCollection), {
    ...update,
    timestamp: Timestamp.now().toDate().toISOString(),
  });
  return docRef.id;
};

// Fetch updates visible to a user
export const fetchUpdatesForUser = async (
  userId: string,
): Promise<Update[]> => {
  const updatesRef = collection(firestore, updatesCollection);

  const updatesQuery = query(
    updatesRef,
    where("visibleTo", "array-contains", userId),
    orderBy("timestamp", "desc"),
  );

  const snapshot = await getDocs(updatesQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Update);
};
