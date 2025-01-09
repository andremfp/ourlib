import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("=== API HANDLER STARTED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Query:", JSON.stringify(req.query));

  // Send a test response
  return res.status(200).json({
    message: "API is working",
    path: req.query.path,
    url: req.url,
  });
}
