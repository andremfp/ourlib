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
  DocumentReference,
} from "firebase/firestore";
import type { Library, User } from "../schema";

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
  libraryRef: DocumentReference<Library>,
): Promise<Library | null> => {
  const docSnap = await getDoc(libraryRef);
  return docSnap.exists() ? (docSnap.data() as Library) : null;
};

export const getUserLibraries = async (
  owner: DocumentReference<User>,
): Promise<Library[]> => {
  const querySnapshot = await getDocs(
    query(
      collection(firestore, librariesCollection),
      where("owner", "==", owner),
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
