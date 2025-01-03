// src/utils/bookAPI.ts
export const fetchBookDetails = async (isbn: string) => {
  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.totalItems === 0) {
      throw new Error("No book found for this ISBN.");
    }

    const book = data.items[0].volumeInfo;

    return {
      title: book.title || "Unknown Title",
      author: book.authors ? book.authors.join(", ") : "Unknown Author",
      publisher: book.publisher || "Unknown Publisher",
      publishedDate: book.publishedDate || "Unknown Date",
    };
  } catch (error) {
    console.error("Error fetching book details:", error);
    throw error;
  }
};
