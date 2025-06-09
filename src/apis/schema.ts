export type User = {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  friends: string[];
};

export type Library = {
  id: string;
  name: string;
  ownerId: string; // User ID
  booksCount: number;
  createdAt: string;
  updatedAt: string;
  subscribers: string[]; // User IDs
};

export type Book = {
  id: string;
  library: string; // Library ID
  lentTo?: string; // User ID of the borrower
  createdAt: string;
  updatedAt: string;
  lentAt?: string;
  title: string;
  authors: string[];
  language: string;
  pages: number;
  publisher: string;
  publishDate: string;
  thumbnailUrl: string;
};

export type Update = {
  id: string;
  libraryId: string; // ID of the library associated with the update
  userId: string; // ID of the friend triggering the update
  action: "added_book" | "removed_book" | "lent_book" | "returned_book";
  bookId: string; // ID of the book involved
  relatedUserId?: string; // ID of the related user (borrower/returner) if applicable
  visibleTo: string[]; // Array of user IDs who can view the update
  timestamp: string; // ISO timestamp of the update
};
