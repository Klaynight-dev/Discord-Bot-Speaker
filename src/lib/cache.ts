// ── In-memory TTL cache ───────────────────────────────
interface CacheEntry<T> {
  data: T;
  exp: number;
}

const _store = new Map<string, CacheEntry<unknown>>();

export function get<T>(key: string): T | null {
  const entry = _store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.exp) {
    _store.delete(key);
    return null;
  }
  return entry.data;
}

export function set<T>(key: string, data: T, ttlMs: number): void {
  _store.set(key, { data, exp: Date.now() + ttlMs });
}

export function del(pattern: string): void {
  for (const k of _store.keys()) {
    if (k.includes(pattern)) _store.delete(k);
  }
}
