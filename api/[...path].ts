import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Debug logging
  console.log("Request path:", req.url);
  console.log("Query path:", req.query.path);

  // Extract the full path from the request
  const fullPath = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : req.query.path || "";

  const targetUrl = `https://www.goodreads.com/${fullPath}`;
  console.log("Target URL:", targetUrl);

  try {
    // Make the initial request
    const response = await fetch(targetUrl, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "manual",
    });

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

      // Follow the redirect
      const finalResponse = await fetch(redirectUrl, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const data = await finalResponse.text();

      // Set CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");

      return res.status(200).send(data);
    }

    // If no redirect, return the original response
    const data = await response.text();

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");

    return res.status(200).send(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch data", details: error.message });
  }
}
