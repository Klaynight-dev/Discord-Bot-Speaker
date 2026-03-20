// ── DOM + formatting utilities ────────────────────────
export const $ = id => document.getElementById(id);

export function toast(msg, type = "ok", ms = 2500) {
  const t = $("toast");
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), ms);
}

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function avUrl(user, size = 40) {
  if (!user) return "";
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "webp";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
  }
  const disc = user.discriminator || "0";
  const idx = disc === "0"
    ? Number(BigInt(user.id) >> 22n) % 6
    : Number(disc) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

export function guildIconUrl(g, size = 64) {
  return g.icon
    ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=${size}`
    : null;
}

export function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(iso) {
  const d = new Date(iso), now = new Date(), yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === now.toDateString())  return "Aujourd'hui";
  if (d.toDateString() === yest.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 300) + "px";
}
