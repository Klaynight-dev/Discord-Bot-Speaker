import type { ApiResult } from "../types/index.ts";

const BASE = "https://discord.com/api/v10";
const UA   = "DiscordBotSpeaker/2.0.0";
const TIMEOUT_MS = 12_000;

// ── Discord API client with retry on 429 ─────────────
export async function discordAPI(
  method: string,
  endpoint: string,
  token: string,
  body: unknown = null,
  _retry = 0
): Promise<ApiResult> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      Authorization: `Bot ${token}`,
      "User-Agent": UA,
    };

    let reqBody: BodyInit | undefined;

    if (body instanceof FormData) {
      reqBody = body;
    } else if (body !== null) {
      headers["Content-Type"] = "application/json";
      reqBody = JSON.stringify(body);
    }

    const res = await fetch(`${BASE}${endpoint}`, {
      method,
      signal: ctrl.signal,
      headers,
      body: reqBody,
    });

    // Retry on rate-limit (up to 3 times)
    if (res.status === 429 && _retry < 3) {
      const j = await res.json().catch(() => ({})) as { retry_after?: number };
      const wait = (j.retry_after ?? 1) * 1000;
      await delay(wait);
      return discordAPI(method, endpoint, token, body, _retry + 1);
    }

    if (res.status === 204) return { status: 204, data: { ok: true } };

    const data = await res.json();
    return { status: res.status, data };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return { status: 504, data: { error: "Timeout Discord API (12s)" } };
    }
    return { status: 503, data: { error: "Discord inaccessible", detail: (err as Error).message } };
  } finally {
    clearTimeout(timer);
  }
}

// ── Helpers ───────────────────────────────────────────
export const discord = {
  get:    (ep: string, token: string) => discordAPI("GET",    ep, token),
  post:   (ep: string, token: string, body: unknown) => discordAPI("POST",   ep, token, body),
  patch:  (ep: string, token: string, body: unknown) => discordAPI("PATCH",  ep, token, body),
  delete: (ep: string, token: string)                => discordAPI("DELETE", ep, token),
  upload: (ep: string, token: string, form: FormData) => discordAPI("POST",  ep, token, form),
};

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
