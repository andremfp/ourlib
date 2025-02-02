import { firestore } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import type { Book } from "./types";

const booksCollection = "Books";

export const createBook = async (book: Book) => {
  const bookDoc = doc(collection(firestore, booksCollection));
  await setDoc(bookDoc, book);
};

export const getBook = async (bookId: string): Promise<Book | null> => {
  const docSnap = await getDoc(doc(firestore, booksCollection, bookId));
  return docSnap.exists() ? (docSnap.data() as Book) : null;
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
