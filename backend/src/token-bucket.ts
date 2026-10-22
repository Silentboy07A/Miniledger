
import type { Request, RequestHandler } from "express";

interface Bucket {
  tokens: number;
  lastRefill: number;
  lastSeen: number;
}

interface TokenBucketOptions {
  capacity: number;
  refillRatePerSecond: number;
  message: string;
}

export function createTokenBucket({
  capacity,
  refillRatePerSecond,
  message,
}: TokenBucketOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();

  return (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req);

    let bucket = buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: capacity,
        lastRefill: now,
        lastSeen: now,
      };
      buckets.set(key, bucket);
    }

    // Refill tokens gradually according to elapsed time.
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(
      capacity,
      bucket.tokens + elapsedSeconds * refillRatePerSecond
    );

    bucket.lastRefill = now;
    bucket.lastSeen = now;

    // Periodically remove inactive buckets to limit memory growth.
    if (buckets.size > 10_000) {
      for (const [clientKey, clientBucket] of buckets) {
        if (now - clientBucket.lastSeen > 30 * 60 * 1000) {
          buckets.delete(clientKey);
        }
      }
    }

    res.setHeader("X-RateLimit-Limit", capacity);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, Math.floor(bucket.tokens))
    );

    if (bucket.tokens < 1) {
      const retryAfterSeconds = Math.ceil(
        (1 - bucket.tokens) / refillRatePerSecond
      );

      res.setHeader("Retry-After", retryAfterSeconds);
      res.status(429).json({
        error: message,
        retryAfterSeconds,
      });
      return;
    }

    // One request consumes one token.
    bucket.tokens -= 1;

    res.setHeader(
      "X-RateLimit-Remaining",
      Math.floor(bucket.tokens)
    );

    next();
  };
}

function getClientKey(req: Request): string {
  // Avoid trusting X-Forwarded-For unless proxy configuration is trusted.
  return req.ip || req.socket.remoteAddress || "unknown";
}
