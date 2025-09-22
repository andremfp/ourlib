import { DocumentReference, Timestamp } from "firebase/firestore";

export type User = {
  id: string;
  username: string;
  email: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  friends: string[];
};

export type Library = {
  id: string;
  name: string;
  owner: DocumentReference<User>; // User ID
  booksCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  subscribers: string[]; // User IDs
};

export type Book = {
  id: string;
  library: DocumentReference<Library>; // Library ID
  lentTo?: DocumentReference<User>; // User ID of the borrower
  isbn: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lentAt?: Timestamp;
  title: string;
  authors: string[];
  language?: string;
  pages?: number | null;
  publisher?: string;
  publishDate?: string;
  thumbnailUrl: string;
};

export type Update = {
  id: string;
  library: DocumentReference<Library>; // ID of the library associated with the update
  userId: DocumentReference<User>; // ID of the friend triggering the update
  action: "added_book" | "removed_book" | "lent_book" | "returned_book";
  book: DocumentReference<Book>; // ID of the book involved
  relatedUserId?: string; // ID of the related user (borrower/returner) if applicable
  visibleTo: string[]; // Array of user IDs who can view the update
  timestamp: Timestamp; // ISO timestamp of the update
};
