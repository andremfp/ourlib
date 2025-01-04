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

const HARDCOVER_API_URL = "/hardcover-proxy/v1/graphql";
const HARDCOVER_API_TOKEN = import.meta.env.VITE_HARDCOVER_API_TOKEN;
const GOOGLE_API_URL = "/google-proxy/books/v1/volumes";

// Utility function to merge missing fields from Hardcover API into Google Books details
const mergeBookDetails = (
  googleDetails: BookDetails,
  hardcoverDetails: BookDetails
): BookDetails => {
  return {
    title:
      googleDetails.title !== "Unknown"
        ? googleDetails.title
        : hardcoverDetails.title,
    authors:
      googleDetails.authors !== "Unknown"
        ? googleDetails.authors
        : hardcoverDetails.authors,
    publisher:
      googleDetails.publisher !== "Unknown"
        ? googleDetails.publisher
        : hardcoverDetails.publisher,
    publishedDate:
      googleDetails.publishedDate !== "Unknown"
        ? googleDetails.publishedDate
        : hardcoverDetails.publishedDate,
    language:
      googleDetails.language !== "Unknown"
        ? googleDetails.language
        : hardcoverDetails.language,
    pageCount:
      googleDetails.pageCount !== 0
        ? googleDetails.pageCount
        : hardcoverDetails.pageCount,
    thumbnail: googleDetails.thumbnail || hardcoverDetails.thumbnail,
  };
};

const fetchFromGoogleBooks = async (
  isbn: string
): Promise<BookDetails | null> => {
  const url = `${GOOGLE_API_URL}?q=isbn:${isbn}&key=${
    import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
  }`;
  logger.info(`Fetching book details from Google Books API for ISBN: ${isbn}`);

  try {
    const baseResponse = await fetch(url);
    if (!baseResponse.ok) {
      logger.warn(`Google Books API returned status: ${baseResponse.status}`);
      return null;
    }

    const baseData = await baseResponse.json();
    const baseBookItem = baseData.items?.[0];

    if (!baseBookItem) {
      logger.info(`No book found at url: ${url}`);
      return null;
    }

    const selfLink = baseBookItem?.selfLink;
    const detailsUrl = selfLink.replace(
      "https://www.googleapis.com",
      "/google-proxy"
    );

    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      logger.warn(
        `Failed to fetch details from URL. Status: ${detailsResponse.status}`
      );
      return null;
    }

    const detailsData = await detailsResponse.json();
    const bookDetails = detailsData.volumeInfo;

    if (!bookDetails) {
      logger.info(`No book info found at URL: ${url}`);
      return null;
    }

    const thumbnailUrl = bookDetails.imageLinks?.thumbnail
      ? bookDetails.imageLinks.thumbnail.replace(
          "http://books.google.com",
          "/google-cover-proxy"
        )
      : null;

    return {
      title: bookDetails.title || "Unknown",
      authors: bookDetails.authors ? bookDetails.authors.join(", ") : "Unknown",
      publisher: bookDetails.publisher || "Unknown",
      publishedDate: bookDetails.publishedDate?.split("-")[0] || "Unknown",
      language: bookDetails.language?.toUpperCase() || "Unknown",
      pageCount: bookDetails.pageCount ?? 0,
      thumbnail: thumbnailUrl ? await fetchThumbnail(thumbnailUrl) : undefined,
    };
  } catch (error) {
    logger.error("Error fetching data from Google Books API:", error);
    return null;
  }
};

const fetchFromHardcover = async (
  query: string,
  variables: object
): Promise<any> => {
  logger.info("Querying Hardcover API", { query, variables });

  try {
    const response = await fetch(HARDCOVER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HARDCOVER_API_TOKEN}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      logger.warn(`Hardcover API returned status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    logger.error("Error fetching data from Hardcover API:", error);
    return null;
  }
};

const fetchThumbnail = async (url: string): Promise<Blob | undefined> => {
  logger.info(`Fetching thumbnail from URL: ${url}`);
  try {
    const response = await fetch(url);
    if (response.ok) {
      return await response.blob();
    } else {
      logger.warn(`Failed to fetch thumbnail. Status: ${response.status}`);
      return undefined;
    }
  } catch (error) {
    logger.error("Error fetching thumbnail:", error);
    return undefined;
  }
};

const fetchBookFromHardcover = async (
  isbn?: string,
  title?: string
): Promise<BookDetails | null> => {
  const hardcoverQueryByISBN = `
    query GetBookInfoFromISBN($isbn: String!) {
      editions(where: {isbn_13: {_eq: $isbn}}) {
        id
        title
        edition_format
        pages
        release_date
        isbn_10
        isbn_13
        publisher {
          name
        }
        image {
          url
        }
        contributions {
          author {
            name
          }
        }
        language {
          code2
        }
      }
    }
  `;

  const hardcoverQueryByTitle = `
    query GetEditionsFromTitle($title: String!) {
      editions(where: {title: {_eq: $title}}) {
        id
        title
        edition_format
        pages
        release_date
        isbn_10
        isbn_13
        publisher {
          name
        }
        image {
          url
        }
        contributions {
          author {
            name
          }
        }
        language {
          code2
        }
      }
    }
  `;

  const query = isbn
    ? hardcoverQueryByISBN
    : title
    ? hardcoverQueryByTitle
    : null;
  const variables = isbn ? { isbn } : { title };

  if (!query || !variables) {
    logger.error("Invalid parameters for Hardcover API query");
    return null;
  }

  const data = await fetchFromHardcover(query, variables);
  if (!data?.editions?.[0]) {
    logger.info(`No results found for ${isbn || title} in Hardcover API.`);
    return null;
  }

  const edition = data.editions[0];
  const authors = edition.contributions
    ? edition.contributions
        .map((c: any) => c.author?.name)
        .filter(Boolean)
        .join(", ")
    : "Unknown";

  const thumbnailUrl = edition.image?.url
    ? edition.image.url.replace(
        "https://assets.hardcover.app",
        "/hardcover-cover-proxy"
      )
    : null;

  return {
    title: edition.title || "Unknown",
    authors: authors,
    publisher: edition.publisher?.name || "Unknown",
    publishedDate: edition.release_date?.split("-")[0] || "Unknown",
    language: edition.language?.code2.toUpperCase() || "Unknown",
    pageCount: edition.pages ?? 0,
    thumbnail: thumbnailUrl ? await fetchThumbnail(thumbnailUrl) : undefined,
  };
};

export const fetchBookDetails = async (isbn: string): Promise<BookDetails> => {
  // Step 1: Try Google Books API
  let bookDetails = await fetchFromGoogleBooks(isbn);

  // Ensure bookDetails is not null before proceeding
  if (!bookDetails) {
    throw new Error("No details found from Google Books API.");
  }

  // Step 2: If incomplete or missing, try Hardcover API by ISBN
  if (
    bookDetails.title === "Unknown" ||
    bookDetails.authors === "Unknown" ||
    bookDetails.publisher === "Unknown" ||
    bookDetails.pageCount === 0 ||
    !bookDetails.thumbnail
  ) {
    logger.info("Google Books data incomplete. Falling back to Hardcover API.");
    const hardcoverDetailsByISBN = await fetchBookFromHardcover(isbn);

    if (hardcoverDetailsByISBN) {
      // Merge missing fields from Hardcover API
      bookDetails = mergeBookDetails(bookDetails, hardcoverDetailsByISBN);
    } else if (bookDetails?.title) {
      // Step 3: If ISBN query fails, try Hardcover API by Title
      logger.info("Hardcover API (ISBN) query failed. Trying by Title.");
      const hardcoverDetailsByTitle = await fetchBookFromHardcover(
        undefined,
        bookDetails.title
      );
      if (hardcoverDetailsByTitle) {
        bookDetails = mergeBookDetails(bookDetails, hardcoverDetailsByTitle);
      } else {
        logger.info("Failed to fetch further book details from Hardcover API.");
      }
    }
  }

  return bookDetails;
};
