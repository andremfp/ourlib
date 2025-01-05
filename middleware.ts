import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  console.log("Request URL:", url.href);

  // Only handle Goodreads proxy requests
  if (pathname.startsWith("/goodreads-proxy/")) {
    const targetPath = pathname.replace("/goodreads-proxy", "");
    const goodreadsUrl = `https://www.goodreads.com${targetPath}`;

    console.log("Goodreads URL:", goodreadsUrl);

    try {
      // Make the initial request to Goodreads
      const response = await fetch(goodreadsUrl, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "manual", // Handle redirects manually
      });

      // Handle redirects
      if (response.status === 301 || response.status === 302) {
        const location = response.headers.get("location");
        if (location) {
          console.log(`Redirecting to ${location}`);
          const newLocation = location.replace(
            "https://www.goodreads.com",
            "/goodreads-proxy"
          );
          console.log(`Redirecting to new location: ${newLocation}`);
          return NextResponse.redirect(new URL(newLocation, req.url));
        }
      }

      // Proxy non-redirect responses
      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      const body = await response.text();

      return new Response(body, {
        status: response.status,
        headers,
      });
    } catch (error) {
      console.error("Error proxying Goodreads request:", error);
      return new Response("Error proxying request", {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
  }

  // Let other requests pass through
  return NextResponse.next();
}

export const config = {
  matcher: "/goodreads-proxy/:path*",
};
