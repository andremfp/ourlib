// api/goodreads-proxy/[...path].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract the full path from the request
  const fullPath = (req.query.path as string[]).join("/");
  const targetUrl = `https://www.goodreads.com/${fullPath}`;

  try {
    // Make the initial request with custom headers
    const response = await fetch(targetUrl, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "manual", // Handle redirects manually
    });

    // If there's a redirect
    if (
      response.status === 301 ||
      response.status === 302 ||
      response.status === 307 ||
      response.status === 308
    ) {
      const redirectUrl = response.headers.get("location");

      if (!redirectUrl) {
        throw new Error("Redirect location not found");
      }

      // Make the request to the redirect URL
      const finalResponse = await fetch(redirectUrl, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      // Get the response data
      const data = await finalResponse.text();

      // Set CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      // Set content type
      res.setHeader("Content-Type", "text/html");

      // Send the final response
      return res.status(200).send(data);
    }

    // If there's no redirect, just forward the original response
    const data = await response.text();

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Set content type
    res.setHeader("Content-Type", "text/html");

    return res.status(200).send(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({ error: "Failed to fetch data" });
  }
}

export default handler;
