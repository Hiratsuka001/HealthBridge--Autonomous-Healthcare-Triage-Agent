// shortcut: in-memory limit is per serverless instance, use Vercel KV/Upstash when traffic grows
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;

export function getAllowedOrigins() {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }

  const origins = ["http://localhost:5173", "http://localhost:3000"];

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL.trim();
    origins.push(prod.startsWith("http://") || prod.startsWith("https://") ? prod : `https://${prod}`);
  }

  if (process.env.VERCEL_URL) {
    const vUrl = process.env.VERCEL_URL.trim();
    origins.push(vUrl.startsWith("http://") || vUrl.startsWith("https://") ? vUrl : `https://${vUrl}`);
  }

  return origins;
}

export function isOriginAllowed(origin) {
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
}

export function handleCors(
  req,
  res,
  methods = "GET, POST, OPTIONS",
  headers = "Content-Type, Authorization"
) {
  const origin = req.headers?.origin || req.headers?.Origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", headers);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

export function checkRateLimit(req, res) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null) ||
    req.socket?.remoteAddress ||
    "127.0.0.1";

  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= RATE_LIMIT_MAX) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

export function validateImagePayload(imageBase64, req) {
  const contentLength = parseInt(req.headers?.["content-length"] || "0", 10);
  const MAX_SIZE = 6 * 1024 * 1024; // ~6 MB

  if (contentLength > MAX_SIZE || (typeof imageBase64 === "string" && imageBase64.length > MAX_SIZE)) {
    return { valid: false, status: 413, error: "Payload too large. Maximum size is 6 MB." };
  }

  if (!imageBase64 || typeof imageBase64 !== "string" || !imageBase64.trim()) {
    return { valid: false, status: 400, error: "Invalid request: missing or non-string image_base64 field." };
  }

  return { valid: true };
}
