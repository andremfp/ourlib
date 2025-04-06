import { firestore } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import type { Library } from "./types";

const librariesCollection = "libraries";

export const createLibrary = async (library: Library) => {
  const libraryDoc = doc(collection(firestore, librariesCollection));
  await setDoc(libraryDoc, library);
};

export const updateLibrary = async (
  libraryId: string,
  newLibraryName: string,
) => {
  await updateDoc(doc(firestore, librariesCollection, libraryId), {
    name: newLibraryName,
  });
};

export const getLibrary = async (
  libraryId: string,
): Promise<Library | null> => {
  const docSnap = await getDoc(doc(firestore, librariesCollection, libraryId));
  return docSnap.exists() ? (docSnap.data() as Library) : null;
};

export const getUserLibraries = async (owner: string): Promise<Library[]> => {
  const querySnapshot = await getDocs(
    query(
      collection(firestore, librariesCollection),
      where("ownerId", "==", owner),
    ),
  );
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Library,
  );
};

export const subscribeToLibrary = async (libraryId: string, userId: string) => {
  await updateDoc(doc(firestore, librariesCollection, libraryId), {
    subscribers: arrayUnion(userId),
  });
};

export const deleteLibrary = async (libraryId: string) => {
  await deleteDoc(doc(firestore, librariesCollection, libraryId));
};
