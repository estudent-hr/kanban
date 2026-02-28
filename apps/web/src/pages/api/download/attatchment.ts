import type { NextApiRequest, NextApiResponse } from "next";

import { createNextApiContext } from "@kan/api/trpc";
import { withRateLimit } from "@kan/api/utils/rateLimit";

import { env } from "~/env";

const PRIVATE_IP_RE = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fe[89ab][0-9a-f]:/i,
  /^localhost$/i,
];

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_IP_RE.some((re) => re.test(hostname));
}

function getAllowedHostnames(): Set<string> {
  const hosts = new Set<string>();
  if (env.NEXT_PUBLIC_STORAGE_URL) {
    try {
      hosts.add(new URL(env.NEXT_PUBLIC_STORAGE_URL).hostname);
    } catch {
      // invalid URL — ignore
    }
  }
  if (env.NEXT_PUBLIC_STORAGE_DOMAIN) {
    hosts.add(env.NEXT_PUBLIC_STORAGE_DOMAIN);
  }
  return hosts;
}

export default withRateLimit(
  { points: 100, duration: 60 },
  async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "GET") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { user } = await createNextApiContext(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { url, filename } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "url parameter is required" });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ message: "Invalid URL" });
    }

    if (parsedUrl.protocol !== "https:") {
      return res.status(400).json({ message: "Only HTTPS URLs are allowed" });
    }

    if (isPrivateHost(parsedUrl.hostname)) {
      return res.status(400).json({ message: "URL not allowed" });
    }

    const allowedHostnames = getAllowedHostnames();
    if (allowedHostnames.size > 0 && !allowedHostnames.has(parsedUrl.hostname)) {
      return res.status(400).json({ message: "URL not allowed" });
    }

    try {
      const downloadFilename =
        typeof filename === "string"
          ? encodeURIComponent(filename)
          : "attachment";

      const upstream = await fetch(url);

      if (!upstream.ok) {
        return res.status(upstream.status).json({
          message: "Failed to fetch attachment",
        });
      }

      const contentType =
        upstream.headers.get("Content-Type") ?? "application/octet-stream";

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${downloadFilename}"; filename*=UTF-8''${downloadFilename}`,
      );

      const buffer = await upstream.arrayBuffer();
      return res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Error downloading attachment:", error);
      return res.status(500).json({ message: "Failed to download attachment" });
    }
  },
);
