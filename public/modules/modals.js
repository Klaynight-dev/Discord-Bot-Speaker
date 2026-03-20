// ── Templates + Modals (channel edit, pins) ───────────
import { S } from "./state.js";
import { apiGet, apiPost } from "./api.js";
import { $, avUrl, esc, toast, fmtDate, fmtTime } from "./utils.js";
import { buildEmbedData } from "./input.js";
import { selectGuild } from "./guild.js";
import { renderMarkdown } from "./markdown.js";

// ═══ Templates ═══
export async function loadTemplates() {
  const tpls = await apiGet("/api/templates");
  if (!Array.isArray(tpls)) return;
  const list = $("tpl-list");
  $("tpl-count").textContent = String(tpls.length);
  if (!tpls.length) { list.innerHTML = `<div class="tpl-empty">Aucun template</div>`; return; }
  list.innerHTML = tpls.map(t => `<div class="tpl-item" onclick="window._applyTemplate('${esc(t.id)}')">
    <span class="tpl-item-name">${esc(t.name)}</span>
    <span class="tpl-item-type">${esc(t.type ?? "msg")}</span>
    <button class="tpl-item-rm" onclick="event.stopPropagation();window._delTemplate('${esc(t.id)}')">✕</button>
  </div>`).join("");
}

export function toggleTplDropdown() { $("tpl-dropdown").classList.toggle("show"); }

export async function saveTemplate() {
  const name = $("tpl-name-input")?.value?.trim();
  if (!name) return;
  const emb = buildEmbedData();
  await apiPost("/api/templates", { name, type: S.mode, content: $("msg-input").value, embeds: emb ? [emb] : [] });
  $("tpl-name-input").value = "";
  await loadTemplates();
  toast("Template sauvegardé ✓");
}

export async function delTemplate(id) {
  await fetch(`/api/templates/${id}`, { method: "DELETE" });
  await loadTemplates();
  toast("Supprimé ✓");
}

export async function applyTemplate(id) {
  const tpls = await apiGet("/api/templates");
  const t = tpls.find(x => x.id === id);
  if (!t) return;
  window._setMode?.(t.type ?? "msg");
  if (t.content) $("msg-input").value = t.content;
  window._onType?.();
  $("tpl-dropdown").classList.remove("show");
}

// ═══ Channel Edit Modal ═══
export function openChanEdit(evt, chanId, name, topic, slowmode, nsfw) {
  evt?.stopPropagation();
  S.editingChanId = chanId;
  $("chan-edit-name").value    = name;
  $("chan-edit-topic").value   = topic;
  $("chan-edit-slowmode").value = slowmode ?? 0;
  $("chan-edit-nsfw").checked  = !!nsfw;
  $("chan-edit-modal").classList.add("show");
}

export function closeChanEdit() { $("chan-edit-modal").classList.remove("show"); S.editingChanId = null; }

export async function saveChanEdit() {
  if (!S.editingChanId) return;
  $("chan-edit-save-btn").disabled = true;
  const r = await fetch(`/api/channel/${S.editingChanId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: S.token, name: $("chan-edit-name").value, topic: $("chan-edit-topic").value, slowmode: $("chan-edit-slowmode").value, nsfw: $("chan-edit-nsfw").checked }),
  }).then(r => r.json()).catch(() => ({}));
  $("chan-edit-save-btn").disabled = false;
  if (r.id) { toast("Salon modifié ✓"); closeChanEdit(); if (S.guildId) await selectGuild(S.guildId, true); }
  else toast(r.message ?? "Erreur", "err");
}

// ═══ Guild Edit Modal ═══
export function openGuildEdit() {
  const g = S.guilds?.find(x => x.id === S.guildId);
  if (!g) return;
  $("guild-edit-name").value = g.name ?? "";
  $("guild-edit-desc").value = g.description ?? "";
  $("guild-edit-modal").classList.add("show");
}

export function closeGuildEdit() { $("guild-edit-modal").classList.remove("show"); }

export async function saveGuildEdit() {
  if (!S.guildId) return;
  $("guild-edit-save-btn").disabled = true;
  const name = $("guild-edit-name").value.trim();
  const desc = $("guild-edit-desc").value.trim();
  const r = await fetch(`/api/guild/${S.guildId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: S.token, name, description: desc }),
  }).then(r => r.json()).catch(() => ({}));
  
  $("guild-edit-save-btn").disabled = false;
  if (r.id) {
    toast("Serveur modifié ✓");
    closeGuildEdit();
    if (window._loadGuilds) await window._loadGuilds();
    if (S.guildId) window._selectGuild(S.guildId, true);
  } else toast(r.message ?? "Erreur", "err");
}

// ═══ Bot Edit Modal ═══
export function openBotEdit() {
  const b = S.bot;
  if (!b) return;
  $("bot-edit-name").value = b.username ?? "";
  $("bot-edit-bio").value = b.bio ?? b.about_me ?? "";
  $("bot-edit-status").value = "online";
  $("bot-edit-activity").value = "";
  $("bot-edit-avatar").value = "";
  $("bot-edit-modal").classList.add("show");
}

export function closeBotEdit() { $("bot-edit-modal").classList.remove("show"); }

export async function saveBotEdit() {
  if (!S.token) return;
  $("bot-edit-save-btn").disabled = true;
  
  const name = $("bot-edit-name").value.trim();
  const bio = $("bot-edit-bio").value.trim();
  const status = $("bot-edit-status").value;
  const activity = $("bot-edit-activity").value.trim();
  const fileInput = $("bot-edit-avatar");
  
  let avatarDataURI = undefined;
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    avatarDataURI = await new Promise(r => {
      const reader = new FileReader();
      reader.onload = e => r(e.target.result);
      reader.readAsDataURL(file);
    });
  }
  
  const pReq = fetch("/api/bot/profile", {
    method: "PATCH", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ token: S.token, username: name||undefined, about_me: bio||undefined, avatar: avatarDataURI })
  }).then(r=>r.json()).catch(()=>{});
  
  const presReq = fetch("/api/bot/presence", {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ token: S.token, status, activity_name: activity||undefined, activity_type: 0 })
  }).then(r=>r.json()).catch(()=>{});
  
  await Promise.all([pReq, presReq]);
  
  toast("Profil bot mis à jour ✓");
  closeBotEdit();
  $("bot-edit-save-btn").disabled = false;
  
  if (name) {
    $("bot-name").textContent = name;
    S.bot.username = name;
  }
  // Remove dot classes and add new one
  const dot = $("bot-status-dot");
  if (dot) {
    dot.className = "bot-status-dot " + status;
  }
}

// ═══ Pins Modal ═══
export async function openPins() {
  $("pins-modal").classList.add("show");
  $("pins-list").innerHTML = `<div style="font-size:13px;color:var(--text-muted);text-align:center;padding:20px">Chargement…</div>`;
  const pins = await apiGet(`/api/pins/${S.channelId}?token=${encodeURIComponent(S.token)}`);
  if (!Array.isArray(pins) || !pins.length) {
    $("pins-list").innerHTML = `<div style="font-size:13px;color:var(--text-muted);text-align:center;padding:20px">Aucun message épinglé</div>`;
    return;
  }
  $("pins-list").innerHTML = pins.map(m => {
    const a = m.author ?? {};
    const contentHtml = m.content ? renderMarkdown(m.content) : "<span style=\"color:var(--text-muted);font-style:italic\">[Pièce jointe / Embed]</span>";
    return `<div class="pin-item"><img class="pin-av" src="${avUrl(a, 64)}" onerror="this.style.display='none'" loading="lazy"/><div class="pin-body"><div><span class="pin-author">${esc(a.global_name ?? a.username ?? "?")}</span><span class="pin-ts">${fmtDate(m.timestamp)} ${fmtTime(m.timestamp)}</span></div><div class="pin-text">${contentHtml}</div></div></div>`;
  }).join("");
}
