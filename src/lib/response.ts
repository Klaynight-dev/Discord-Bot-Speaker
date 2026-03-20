// ── JSON response helpers ─────────────────────────────
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function ok(data: unknown = { ok: true }): Response {
  return json(data, 200);
}

export function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}
