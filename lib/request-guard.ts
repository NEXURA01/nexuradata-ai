type RateLimitOptions = {
  namespace: string;
  maxRequests: number;
  windowMs?: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

const windows = new Map<string, number[]>();
const defaultWindowMs = 60_000;
const pruneIntervalMs = 300_000;
const staleEntryMs = 600_000;
let lastPrune = Date.now();

const blockedUserAgentFragments = [
  "sqlmap",
  "nikto",
  "masscan",
  "zgrab",
  "scrapy",
  "semrushbot",
  "ahrefsbot",
  "mj12bot",
  "dotbot",
  "petalbot",
  "bytespider",
  "gptbot",
  "ccbot",
];

const guardedResponseHeaders = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-robots-tag": "noindex, nofollow",
};

function pruneStaleWindows() {
  const now = Date.now();

  if (now - lastPrune < pruneIntervalMs) {
    return;
  }

  lastPrune = now;
  const cutoff = now - staleEntryMs;

  for (const [key, timestamps] of windows) {
    const activeTimestamps = timestamps.filter((timestamp) => timestamp > cutoff);

    if (activeTimestamps.length === 0) {
      windows.delete(key);
    } else {
      windows.set(key, activeTimestamps);
    }
  }
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-vercel-forwarded-for") ||
    forwardedFor ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(req: Request, options: RateLimitOptions): RateLimitResult {
  pruneStaleWindows();

  const windowMs = options.windowMs || defaultWindowMs;
  const key = `${options.namespace}:${getClientIp(req)}`;
  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (windows.get(key) || []).filter((timestamp) => timestamp > cutoff);

  if (timestamps.length >= options.maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((timestamps[0] + windowMs - now) / 1000));
    return { allowed: false, remaining: 0, retryAfter };
  }

  timestamps.push(now);
  windows.set(key, timestamps);

  return {
    allowed: true,
    remaining: Math.max(0, options.maxRequests - timestamps.length),
    retryAfter: 0,
  };
}

export function isBlockedUserAgent(req: Request) {
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
  return blockedUserAgentFragments.some((fragment) => userAgent.includes(fragment));
}

export function jsonWithSecurity(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);

  for (const [key, value] of Object.entries(guardedResponseHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return Response.json(payload, { ...init, headers });
}

export function guardPublicPost(req: Request, options: RateLimitOptions) {
  if (isBlockedUserAgent(req)) {
    return jsonWithSecurity({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const limit = checkRateLimit(req, options);

  if (!limit.allowed) {
    return jsonWithSecurity(
      { ok: false, error: "rate-limited", retryAfter: limit.retryAfter },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  return null;
}

export function hasFilledHoneypot(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return ["website", "url", "homepage"].some((key) => {
    const value = (payload as Record<string, unknown>)[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function resetRequestGuardForTests() {
  windows.clear();
  lastPrune = Date.now();
}