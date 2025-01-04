import logger from "@/utils/logger";

export interface BookDetails {
  title: string;
  authors: string;
  publisher: string;
  publishedDate: string;
  language: string;
  pageCount: number;
  thumbnail?: Blob;
}

export const fetchBookDetails = async (isbn: string): Promise<BookDetails> => {
  const proxyUrl = `/proxy/books/v1/volumes?q=isbn:${isbn}&key=${
    import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
  }`;

  try {
    const initialResponse = await fetch(proxyUrl);
    if (!initialResponse.ok)
      throw new Error(`HTTP error! status: ${initialResponse.status}`);

    const initialData = await initialResponse.json();

    if (!initialData.items || initialData.items.length === 0) {
      throw new Error("No book details found for the given ISBN.");
    }

    const selfLink = initialData.items[0].selfLink;
    if (!selfLink)
      throw new Error("SelfLink not found in the initial response.");

    const proxiedSelfLink = selfLink.replace(
      "https://www.googleapis.com",
      "/proxy"
    );
    const detailedResponse = await fetch(proxiedSelfLink);
    if (!detailedResponse.ok)
      throw new Error(`HTTP error! status: ${detailedResponse.status}`);

    const detailedData = await detailedResponse.json();

    const volumeInfo = detailedData.volumeInfo || {};
    const thumbnailUrl = volumeInfo.imageLinks?.thumbnail || null;
    let thumbnailBlob: Blob | undefined = undefined;

    if (thumbnailUrl) {
      const proxiedThumbnailUrl = thumbnailUrl.replace(
        "http://books.google.com",
        "/cover-proxy"
      );

      const thumbnailResponse = await fetch(proxiedThumbnailUrl);
      logger.debug("Thumbnail response status:", thumbnailResponse.status);

      if (thumbnailResponse.ok) {
        thumbnailBlob = await thumbnailResponse.blob();
      } else {
        logger.warn(
          "Failed to fetch thumbnail image. Status:",
          thumbnailResponse.status
        );
      }
    }

    return {
      title: volumeInfo.title || "Unknown",
      authors: volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown",
      publisher: volumeInfo.publisher || "Unknown",
      publishedDate: volumeInfo.publishedDate
        ? volumeInfo.publishedDate.split("-")[0]
        : "Unknown",
      pageCount: volumeInfo.pageCount ?? 0,
      language: volumeInfo.language
        ? volumeInfo.language.toUpperCase()
        : "Unknown",
      thumbnail: thumbnailBlob,
    };
  } catch (error) {
    logger.error("Error fetching book details:", error);
    throw error;
  }
};
