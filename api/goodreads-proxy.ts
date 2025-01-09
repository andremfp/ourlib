// api/goodreads-proxy/[...path].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "edge",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add explicit console logs at the start
  console.log("=== API HANDLER STARTED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  console.log("Request headers:", req.headers);

  // Add error boundary
  try {
    // Extract the full path from the request
    console.log("Stripped query params ", req.url?.split("?")[0]);
    const stripped = req.url?.split("?")[0];

    if (!stripped) {
      throw new Error("No stripped URL found");
    }

    const match = stripped.match(/book\/isbn\/\d+/);

    let originalPath = "";
    if (match) {
      originalPath = match[0];
      console.log(originalPath); // Output: goodreads-proxy/book/isbn/9783161484100
    } else {
      console.error("No match found");
    }

    const targetUrl = `https://www.goodreads.com/${originalPath}`;
    console.log("Target URL:", targetUrl);

    // Make the initial request
    console.log("Making initial request to Goodreads...");
    const response = await fetch(targetUrl, { redirect: "manual" });

    console.log("Initial response status:", response.status);
    console.log("Initial response:", await response.text());
    console.log(
      "Initial response headers:",
      JSON.stringify(Object.fromEntries(response.headers))
    );

    // Handle redirects
    if (
      response.status === 301 ||
      response.status === 302 ||
      response.status === 307 ||
      response.status === 308
    ) {
      const redirectUrl = response.headers.get("location");
      console.log("Redirect URL:", redirectUrl);

      if (!redirectUrl) {
        throw new Error("Redirect location not found");
      }

      console.log("Following redirect...");
      const finalResponse = await fetch(redirectUrl, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      console.log("Final response status:", finalResponse.status);
      const data = await finalResponse.text();
      console.log("Received final response data length:", data.length);

      // Set CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");

      console.log("Sending final response...");
      return res.status(200).send(data);
    }

    // If no redirect, return the original response
    const data = await response.text();
    console.log("Received direct response data length:", data.length);

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");

    console.log("Sending direct response...");
    return res.status(200).send(data);
  } catch (error: any) {
    console.error("=== ERROR IN API HANDLER ===");
    console.error("Error details:", error);
    return res.status(500).json({
      error: "Failed to fetch data",
      details: error.message,
      stack: error.stack,
    });
  }
}
