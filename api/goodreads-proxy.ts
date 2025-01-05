import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path.join("/") : path || "";
  const goodreadsUrl = `https://www.goodreads.com/${targetPath}`;

  try {
    const response = await fetch(goodreadsUrl, {
      method: req.method,
      headers: {
        "user-agent": "Mozilla/5.0",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "manual",
    });

    // Handle redirects
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

    // Proxy response back to client
    const body = await response.text();
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow CORS
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
