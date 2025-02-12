import logger from "@/utils/logger";

// Book and Contributor details interfaces
export interface BookDetails {
  title: string;
  authors: string;
  publisher: string;
  publishedDate: string;
  language: string;
  pageCount: number;
  thumbnail?: Blob;
}

interface HardcoverContribution {
  author?: { name: string };
}

interface HardcoverResponseData {
  editions: {
    title: string;
    edition_format: string;
    pages: number;
    release_date: string;
    isbn_10: string;
    isbn_13: string;
    publisher: {
      name: string;
    };
    image: {
      url: string;
    };
    contributions: HardcoverContribution[];
    language: {
      code2: string;
    };
  }[];
}

interface GoodreadsContributorDetails {
  id: string;
  name: string;
}

interface GoodreadsContibutorEdge {
  node: {
    __ref: string;
  };
  role: string;
}

interface GoodreadsApolloState {
  [key: string]: unknown; // Fallback for keys we don't care about
  [key: `Book:${string}`]: GoodreadsBookData;
  [key: `Contributor:${string}`]: GoodreadsContributorDetails;
}

interface GoodreadsBookData {
  title: string;
  imageUrl?: string;
  details: {
    isbn13: string;
    publisher?: string;
    publicationTime?: string;
    language?: { name: string };
    numPages?: number;
  };
  primaryContributorEdge: GoodreadsContibutorEdge;
  secondaryContributorEdges: GoodreadsContibutorEdge[];
}

// API URLs
const GOODREADS_URL = "/goodreads-proxy/book/isbn";
const GOOGLE_API_URL = "/google-proxy/books/v1/volumes";
const HARDCOVER_API_URL = "/hardcover-proxy/v1/graphql";
const HARDCOVER_API_TOKEN = import.meta.env.VITE_HARDCOVER_API_TOKEN;

// Utility function to merge missing fields from Hardcover API into Google Books details
const mergeBookDetails = (
  bookDetails: BookDetails | null,
  newBookDetails: BookDetails,
): BookDetails => {
  if (!bookDetails) {
    return newBookDetails;
  }
  return {
    title:
      bookDetails.title !== "Unknown"
        ? bookDetails.title
        : newBookDetails.title,
    authors:
      bookDetails.authors !== "Unknown"
        ? bookDetails.authors
        : newBookDetails.authors,
    publisher:
      bookDetails.publisher !== "Unknown"
        ? bookDetails.publisher
        : newBookDetails.publisher,
    publishedDate:
      bookDetails.publishedDate !== "Unknown"
        ? bookDetails.publishedDate
        : newBookDetails.publishedDate,
    language:
      bookDetails.language !== "Unknown"
        ? bookDetails.language
        : newBookDetails.language,
    pageCount:
      bookDetails.pageCount !== 0
        ? bookDetails.pageCount
        : newBookDetails.pageCount,
    thumbnail: bookDetails.thumbnail || newBookDetails.thumbnail,
  };
};

// Function to fetch book details from Goodreads
const fetchFromGoodreads = async (
  isbn13: string,
): Promise<BookDetails | null> => {
  const url = `${GOODREADS_URL}/${isbn13}`;
  logger.info(`Fetching Goodreads details for ISBN: ${isbn13}`);

  try {
    const response = await fetch(url, { redirect: "follow" });

    if (!response.ok) {
      logger.warn(`Failed to fetch Goodreads page. Status: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract the JSON data using regex
    const nextDataMatch = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s,
    );
    const scriptContent = nextDataMatch?.[1];

    if (!scriptContent) {
      logger.warn("No __NEXT_DATA__ script found in the page.");
      return null;
    }

    const jsonData = JSON.parse(scriptContent);
    const apolloState: GoodreadsApolloState =
      jsonData.props?.pageProps?.apolloState;

    if (!apolloState) {
      logger.warn("No apolloState found in __NEXT_DATA__.");
      return null;
    }

    // Rest of your existing data processing logic...
    const contributorsById: { [id: string]: string } = {};
    Object.entries(apolloState).forEach(([key, value]) => {
      if (key.startsWith("Contributor:")) {
        const contributor = value as GoodreadsContributorDetails;
        if (contributor?.name) {
          contributorsById[contributor.id] = contributor.name;
        }
      }
    });

    logger.debug("Contributors by ID:", contributorsById);

    const bookEntry = Object.entries(apolloState).find(
      ([key, value]) =>
        key.startsWith("Book:") &&
        (value as GoodreadsBookData)?.details?.isbn13 === isbn13,
    );

    if (!bookEntry) {
      logger.warn(`No matching Book entry found for ISBN: ${isbn13}`);
      return null;
    }

    const [, bookData] = bookEntry;
    const bookDetails = bookData as GoodreadsBookData;

    logger.debug("Book details:", bookDetails);

    const authors: string[] = [];
    const addAuthor = (contributorEdge: GoodreadsContibutorEdge) => {
      if (contributorEdge?.role === "Author") {
        const contributorId = contributorEdge?.node?.__ref?.replace(
          "Contributor:",
          "",
        );
        const authorName = contributorsById[contributorId];
        if (authorName) authors.push(authorName);
      }
    };

    addAuthor(bookDetails.primaryContributorEdge);
    bookDetails.secondaryContributorEdges.forEach(
      (edge: GoodreadsContibutorEdge) => addAuthor(edge),
    );

    const thumbnailUrl = bookDetails.imageUrl
      ? bookDetails.imageUrl.replace(
          "https://images-na.ssl-images-amazon.com",
          "/goodreads-cover-proxy",
        )
      : null;

    return {
      title: bookDetails.title || "Unknown",
      authors: authors.join(", ") || "Unknown",
      publisher: bookDetails.details?.publisher || "Unknown",
      publishedDate: bookDetails.details?.publicationTime
        ? new Date(bookDetails.details.publicationTime).getFullYear().toString()
        : "Unknown",
      language: bookDetails.details?.language?.name || "Unknown",
      pageCount: bookDetails.details?.numPages || 0,
      thumbnail: thumbnailUrl ? await fetchThumbnail(thumbnailUrl) : undefined,
    };
  } catch (error) {
    logger.error("Error fetching Goodreads details:", error);
    return null;
  }
};

// Fetch book details from Google Books API
const fetchFromGoogleBooks = async (
  isbn: string,
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
      "/google-proxy",
    );

    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      logger.warn(
        `Failed to fetch details from URL. Status: ${detailsResponse.status}`,
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
          "/google-cover-proxy",
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

// Fetch book details from Hardcover API
const fetchFromHardcover = async (
  query: string,
  variables: object,
): Promise<HardcoverResponseData | null> => {
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

// Utility function to fetch book thumbnail
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

// Fetch book details from Hardcover API by ISBN or title
const fetchBookFromHardcover = async (
  isbn?: string,
  title?: string,
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
        .map((c: HardcoverContribution) => c.author?.name)
        .filter(Boolean)
        .join(", ")
    : "Unknown";

  const thumbnailUrl = edition.image?.url
    ? edition.image.url.replace(
        "https://assets.hardcover.app",
        "/hardcover-cover-proxy",
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

// Final function to fetch book details, combining all sources
export const fetchBookDetails = async (isbn: string): Promise<BookDetails> => {
  // Step 1: Try fetching from Goodreads first
  let bookDetails = await fetchFromGoodreads(isbn);

  logger.info("Goodreads data fetched successfully:", bookDetails);

  // Step 2: If incomplete or missing fields, fallback to Google Books API
  if (
    !bookDetails ||
    bookDetails.title === "Unknown" ||
    bookDetails.authors === "Unknown" ||
    bookDetails.publisher === "Unknown" ||
    bookDetails.pageCount === 0 ||
    !bookDetails.thumbnail
  ) {
    logger.info(
      "Goodreads data missing or incomplete. Falling back to Google Books API.",
    );
    const googleDetails = await fetchFromGoogleBooks(isbn);

    if (googleDetails) {
      // Merge missing fields from Google Books API
      bookDetails = mergeBookDetails(bookDetails, googleDetails);
    } else {
      logger.info("No Google Books data available.");
    }
  }

  // Step 3: If still incomplete, try Hardcover API by ISBN
  if (
    !bookDetails ||
    bookDetails.title === "Unknown" ||
    bookDetails.authors === "Unknown" ||
    bookDetails.publisher === "Unknown" ||
    bookDetails.pageCount === 0 ||
    !bookDetails.thumbnail
  ) {
    logger.info(
      "Google Books data missing or incomplete. Falling back to Hardcover API.",
    );
    const hardcoverDetailsByISBN = await fetchBookFromHardcover(isbn);

    if (hardcoverDetailsByISBN) {
      // Merge missing fields from Hardcover API
      bookDetails = mergeBookDetails(bookDetails, hardcoverDetailsByISBN);
    } else {
      logger.info("Failed to fetch further book details from Hardcover API.");
    }
  }

  if (!bookDetails) {
    throw new Error("Failed to fetch book details");
  }

  // Return the final merged book details
  return bookDetails;
};
