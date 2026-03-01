import arcjet, {
  detectBot,
  shield,
  tokenBucket,
  slidingWindow,
} from "@arcjet/node";

let httpArchjetInstance = null;
let wsArcjetInstance = null;

function initializeArchjet() {
  const arcjetKey = process.env.ARCJET_KEY;
  const arcjetEnv = process.env.ARCJET_ENV || "development";
  const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

  if (!arcjetKey) {
    console.error("ARCJET_KEY is not set in environment variables");
    throw new Error("ARCJET_KEY is required");
  }

  httpArchjetInstance = arcjet({
    key: arcjetKey,
    rules: [
      shield({ mode: arcjetMode }),
      tokenBucket({
        mode: arcjetMode,
        refillRate: 5,
        interval: 10,
        capacity: 10,
      }),
    ],
  });

  wsArcjetInstance = arcjet({
    key: arcjetKey,
    rules: [
      shield({ mode: arcjetMode, env: arcjetEnv }),
      detectBot({
        mode: arcjetMode,
        allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
      }),
      slidingWindow({ mode: arcjetMode, interval: "2s", max: 5 }),
    ],
  });
}

export function getHttpArchjet() {
  if (!httpArchjetInstance) {
    initializeArchjet();
  }
  return httpArchjetInstance;
}

export function getWsArcjet() {
  if (!wsArcjetInstance) {
    initializeArchjet();
  }
  return wsArcjetInstance;
}

export function securityMiddleware() {
  return async (req, res, next) => {
    const httpArchjet = getHttpArchjet();
    if (!httpArchjet) return next();

    try {
      const decision = await httpArchjet.protect(req, {
        requested: 1,
      });

      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({ error: "too many requests" });
        }

        return res.status(403).json({ error: "forbidden" });
      }
    } catch (err) {
      console.error("Error in Arcjet middleware", err);
      return res.status(503).json({ error: "service unavailable" });
    }

    next();
  };
}
