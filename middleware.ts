// middleware.ts
export interface RequestContext {
  request: Request;
  url: URL;
}

export default async function middleware(context: RequestContext) {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  console.log("Request URL:", url.href);

  // Only handle Goodreads proxy requests
  if (pathname.startsWith("/goodreads-proxy/")) {
    const targetPath = pathname.replace("/goodreads-proxy", "");
    const goodreadsUrl = `https://www.goodreads.com${targetPath}`;

    console.log("Goodreads URL:", goodreadsUrl);

    try {
      // Make the initial request to Goodreads
      console.log("Making initial request to Goodreads...");
      const response = await fetch(goodreadsUrl, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "manual", // Handle redirects manually
      });

      // If it's a redirect, follow it while maintaining our proxy prefix
      if (response.status === 301 || response.status === 302) {
        console.log(
          `Redirecting to ${response.headers.get("location")} (status: ${
            response.status
          })`
        );

        const location = response.headers.get("location");
        if (location) {
          console.log(`Redirecting to ${location}`);
          if (location.includes("goodreads.com")) {
            // Replace the Goodreads domain with our proxy path
            const newLocation = location.replace(
              "https://www.goodreads.com",
              "/goodreads-proxy"
            );
            console.log(`Redirecting to new location ${newLocation}`);
            return Response.redirect(new URL(newLocation, request.url));
          }
          return Response.redirect(new URL(location, request.url));
        }
      }

      // For non-redirect responses, proxy the content
      const body = await response.text();
      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", "*");

      return new Response(body, {
        status: response.status,
        headers,
      });
    } catch (error) {
      return new Response("Error proxying request", { status: 500 });
    }
  }

  // Let other requests pass through
  return new Response(null, {
    status: 404,
  });
}

export const config = {
  matcher: "/goodreads-proxy/:path*",
};
