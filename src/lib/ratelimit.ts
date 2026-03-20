// ── Rate limiter (in-memory, per IP + endpoint) ───────
interface Bucket {
  count: number;
  reset: number;
}

const _buckets = new Map<string, Bucket>();

/**
 * Returns true if the request is allowed, false if rate-limited.
 */
export function allow(
  ip: string,
  endpoint: string,
  max = 30,
  windowMs = 60_000
): boolean {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  let b = _buckets.get(key);

  if (!b || now > b.reset) {
    b = { count: 0, reset: now + windowMs };
  }

  b.count++;
  _buckets.set(key, b);
  return b.count <= max;
}
