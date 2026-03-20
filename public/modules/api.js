// ── API helpers ───────────────────────────────────────
export async function apiFetch(path, opts = {}) {
  try { return await (await fetch(path, opts)).json(); }
  catch { return {}; }
}

export async function apiGet(path)       { return apiFetch(path); }
export async function apiPost(path, body) {
  return apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
export async function apiPatch(path, body) {
  return fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(r => r.json()).catch(() => ({}));
}
export async function apiDelete(path) {
  return fetch(path, { method: "DELETE" }).then(r => r.json()).catch(() => ({}));
}
