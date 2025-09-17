import { firestore } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  DocumentReference,
  increment,
} from "firebase/firestore";
import type { Book, Library } from "../schema";
import { COLLECTION_NAMES } from "../constants";

export const createBook = async (book: Book) => {
  const bookDoc = doc(collection(firestore, COLLECTION_NAMES.BOOKS));
  await setDoc(bookDoc, book);

  // Update the library books count
  await updateDoc(doc(firestore, COLLECTION_NAMES.LIBRARIES, book.library.id), {
    booksCount: increment(1),
  });
};

export const getBook = async (bookId: string): Promise<Book | null> => {
  const docSnap = await getDoc(doc(firestore, COLLECTION_NAMES.BOOKS, bookId));
  return docSnap.exists() ? (docSnap.data() as Book) : null;
};

export const getLibraryBooks = async (
  libraryRef: DocumentReference<Library>,
): Promise<Book[]> => {
  const querySnapshot = await getDocs(
    query(
      collection(firestore, COLLECTION_NAMES.BOOKS),
      where("library", "==", libraryRef),
    ),
  );
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Book,
  );
};

export const lendBook = async (bookId: string, userId: string) => {
  await updateDoc(doc(firestore, COLLECTION_NAMES.BOOKS, bookId), {
    lentTo: userId,
    lentAt: new Date().toISOString(),
  });
};

export const markAsReturned = async (bookId: string) => {
  await updateDoc(doc(firestore, COLLECTION_NAMES.BOOKS, bookId), {
    lentTo: null,
    lentAt: null,
  });
};

export const deleteBook = async (bookId: string) => {
  await deleteDoc(doc(firestore, COLLECTION_NAMES.BOOKS, bookId));
};
