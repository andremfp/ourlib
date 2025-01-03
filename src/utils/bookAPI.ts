export const fetchBookDetails = async (isbn: string) => {
  const apiUrl = `https://isbnsearch.org/isbn/${isbn}`;
  console.log(`[BookAPI Debug] Fetching book details for ISBN: ${isbn}`);

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    console.log("[BookAPI Debug] Successfully fetched HTML response.");

    const html = await response.text();
    console.log("[BookAPI Debug] HTML response received.");

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    console.log("[BookAPI Debug] HTML parsed successfully.");

    // Extract cover image
    const coverImageElement = doc.querySelector(".image img");
    const coverImage = coverImageElement
      ? coverImageElement.getAttribute("src")
      : null;
    console.log(`[BookAPI Debug] Cover image URL: ${coverImage}`);

    // Extract book info
    const bookInfoElement = doc.querySelector(".bookinfo");
    if (!bookInfoElement) {
      throw new Error("Book information not found.");
    }
    console.log("[BookAPI Debug] Found book info section.");

    const titleElement = bookInfoElement.querySelector("h1");
    const title = titleElement
      ? titleElement.textContent?.trim()
      : "Unknown Title";
    console.log(`[BookAPI Debug] Extracted title: ${title}`);

    const authorElement = bookInfoElement.querySelector(
      "p:has(strong:contains('Author:'))"
    );
    const author = authorElement
      ? authorElement.textContent?.replace("Author:", "").trim()
      : "Unknown Author";
    console.log(`[BookAPI Debug] Extracted author: ${author}`);

    const publishedElement = bookInfoElement.querySelector(
      "p:has(strong:contains('Published:'))"
    );
    const publishedDate = publishedElement
      ? publishedElement.textContent?.replace("Published:", "").trim()
      : "Unknown Date";
    console.log(`[BookAPI Debug] Extracted published date: ${publishedDate}`);

    console.log("[BookAPI Debug] Book details successfully extracted.");
    return {
      title,
      author,
      publishedDate,
      coverImage,
    };
  } catch (error) {
    console.error("[BookAPI Debug] Error fetching book details:", error);
    throw error;
  }
};
