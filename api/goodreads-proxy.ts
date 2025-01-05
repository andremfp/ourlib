import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path.join("/") : path || "";
  const goodreadsUrl = `https://www.goodreads.com/${targetPath}`;

  try {
    // Construct headers
    const headers = new Headers();
    headers.set("host", "www.goodreads.com");
    headers.set(
      "user-agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    headers.set(
      "accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
    );

    // Include any headers from the incoming request that are safe to forward
    if (req.headers["accept-language"]) {
      headers.set("accept-language", req.headers["accept-language"] as string);
    }

    const response = await fetch(goodreadsUrl, {
      method: req.method,
      headers,
      redirect: "manual", // Handle redirects manually
    });

    // Handle redirects from Goodreads
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get("location");
      if (location) {
        const newLocation = location.replace(
          "https://www.goodreads.com",
          "/api/goodreads-proxy"
        );
        return res.redirect(response.status, newLocation);
      }
    }

    // Proxy other responses
    const body = await response.text();
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(response.status).send(body);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Error proxying request",
        details: (error as Error).message,
      });
  }
}
