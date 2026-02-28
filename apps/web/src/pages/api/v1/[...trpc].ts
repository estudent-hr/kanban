import type { NextApiRequest, NextApiResponse } from "next";
import cors from "nextjs-cors";
import { createOpenApiNextHandler } from "trpc-to-openapi";

import { appRouter } from "@kan/api";
import { createRESTContext } from "@kan/api/trpc";

import { env } from "~/env";
import { withRateLimit } from "@kan/api/utils/rateLimit";

function getAllowedOrigins(): string[] {
  if (env.BETTER_AUTH_TRUSTED_ORIGINS) {
    return env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((s) => s.trim());
  }
  if (env.NEXT_PUBLIC_BASE_URL) {
    return [env.NEXT_PUBLIC_BASE_URL];
  }
  return [];
}

export default withRateLimit(
  { points: 100, duration: 60 },
  async (req: NextApiRequest, res: NextApiResponse) => {
    const allowedOrigins = getAllowedOrigins();
    await cors(req, res, {
      origin: allowedOrigins.length > 0 ? allowedOrigins : false,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });

    const openApiHandler = createOpenApiNextHandler({
      router: appRouter,
      createContext: createRESTContext,
      onError:
        env.NODE_ENV === "development"
          ? ({ path, error }) => {
              console.error(
                `❌ REST failed on ${path ?? "<no-path>"}: ${error.message}`,
              );
            }
          : undefined,
    });

    return await openApiHandler(req, res);
  },
);
