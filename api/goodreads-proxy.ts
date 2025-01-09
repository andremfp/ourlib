import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "edge",
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
  console.log("=== API HANDLER STARTED ===");
  console.log("Request:", req);
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  // The path segments will be in req.query.path as an array
  const pathSegments = Array.isArray(req.query.path)
    ? req.query.path
    : [req.query.path];

  console.log("Path segments:", pathSegments);

  // Reconstruct the full path
  const fullPath = pathSegments.join("/");
  console.log("Full path:", fullPath);

  return res.status(200).json({
    message: "API is working",
    pathSegments: pathSegments,
    fullPath: fullPath,
    url: req.url,
    query: req.query,
  });
};

export default handler;
