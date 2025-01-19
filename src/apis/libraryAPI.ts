import { firestore } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import type { Library } from "./types";

const librariesCollection = "Libraries";

export const createLibrary = async (library: Library) => {
  const libraryDoc = doc(collection(firestore, librariesCollection));
  await setDoc(libraryDoc, library);
};

export const getLibrary = async (
  libraryId: string,
): Promise<Library | null> => {
  const docSnap = await getDoc(doc(firestore, librariesCollection, libraryId));
  return docSnap.exists() ? (docSnap.data() as Library) : null;
};

export const subscribeToLibrary = async (libraryId: string, userId: string) => {
  await updateDoc(doc(firestore, librariesCollection, libraryId), {
    subscribers: arrayUnion(userId),
  });
};
