export const fetchBookDetails = async (
  isbn: string
): Promise<{
  title: string;
  author: string;
  publishedDate: string;
  coverImage: string;
}> => {
  const apiUrl = `https://isbnsearch.org/isbn/${isbn}`;
  try {
    const response = await fetch(apiUrl);
    const html = await response.text();

    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Extract the required information
    const title =
      doc.querySelector("#book .bookinfo h1")?.textContent?.trim() ||
      "Unknown Title";
    const author =
      doc
        .querySelector("#book .bookinfo p strong:nth-of-type(2)")
        ?.parentNode?.textContent?.replace("Author:", "")
        .trim() || "Unknown Author";
    const publishedDate =
      doc
        .querySelector("#book .bookinfo p strong:nth-of-type(4)")
        ?.parentNode?.textContent?.replace("Published:", "")
        .trim() || "Unknown Date";
    const coverImage =
      doc.querySelector("#book .image img")?.getAttribute("src") || "";

    // Log for debugging
    console.log("Book Details Extracted:", {
      title,
      author,
      publishedDate,
      coverImage,
    });

    return {
      title,
      author,
      publishedDate,
      coverImage,
    };
  } catch (error) {
    console.error("Error fetching book details:", error);
    throw error;
  }
};
