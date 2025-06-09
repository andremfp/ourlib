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
} from "firebase/firestore";
import type { Book } from "./schema";

const booksCollection = "books";

export const createBook = async (book: Book) => {
  const bookDoc = doc(collection(firestore, booksCollection));
  await setDoc(bookDoc, book);
};

export const getBook = async (bookId: string): Promise<Book | null> => {
  const docSnap = await getDoc(doc(firestore, booksCollection, bookId));
  return docSnap.exists() ? (docSnap.data() as Book) : null;
};

export const getLibraryBooks = async (libraryId: string): Promise<Book[]> => {
  const querySnapshot = await getDocs(
    query(
      collection(firestore, booksCollection),
      where("library", "==", libraryId),
    ),
  );
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Book,
  );
};

export const lendBook = async (bookId: string, userId: string) => {
  await updateDoc(doc(firestore, booksCollection, bookId), {
    lentTo: userId,
    lentAt: new Date().toISOString(),
  });
};

export const markAsReturned = async (bookId: string) => {
  await updateDoc(doc(firestore, booksCollection, bookId), {
    lentTo: null,
    lentAt: null,
  });
};

export const deleteBook = async (bookId: string) => {
  await deleteDoc(doc(firestore, booksCollection, bookId));
};
