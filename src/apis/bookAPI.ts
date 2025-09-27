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
  Timestamp,
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

export const updateBook = async (bookId: string, book: Partial<Book>) => {
  await updateDoc(doc(firestore, COLLECTION_NAMES.BOOKS, bookId), {
    ...book,
    updatedAt: Timestamp.now(),
  });
};

export const getBook = async (bookId: string): Promise<Book | null> => {
  const docSnap = await getDoc(doc(firestore, COLLECTION_NAMES.BOOKS, bookId));
  return docSnap.exists()
    ? ({ id: docSnap.id, ...docSnap.data() } as Book)
    : null;
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

export const getLibraryThumbnails = async (
  libraryRef: DocumentReference<Library>,
  max: number = 3,
): Promise<(string | null)[]> => {
  // Fetch all books for the library; client will randomly pick up to `max`
  const querySnapshot = await getDocs(
    query(
      collection(firestore, COLLECTION_NAMES.BOOKS),
      where("library", "==", libraryRef),
    ),
  );
  const all = querySnapshot.docs.map((d) => {
    const data = d.data() as Partial<Book>;
    const url = data.thumbnailUrl as string | undefined;
    return url ?? null;
  });
  // Shuffle and take up to `max`
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = all[i];
    all[i] = all[j];
    all[j] = tmp;
  }
  return all.slice(0, max);
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

export const deleteBook = async (bookId: string, libraryId: string) => {
  await deleteDoc(doc(firestore, COLLECTION_NAMES.BOOKS, bookId));

  // Update the library books count
  await updateDoc(doc(firestore, COLLECTION_NAMES.LIBRARIES, libraryId), {
    booksCount: increment(-1),
  });
};
