// ── Input validation helpers ──────────────────────────
export const isSnowflake = (v: unknown): v is string =>
  typeof v === "string" && /^\d{17,21}$/.test(v);

export const isLocalhost = (req: Request): boolean => {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  return ["localhost", "127.0.0.1", "::1"].includes(host);
};

export const requireSnowflake = (
  v: string | null,
  name: string
): string | Response => {
  if (!v) return badParam(`${name} manquant`);
  if (!isSnowflake(v)) return badParam(`${name} invalide`);
  return v;
};

function badParam(msg: string): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
