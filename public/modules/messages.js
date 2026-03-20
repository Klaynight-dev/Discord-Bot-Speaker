// ── Message rendering + edit/delete/reply ─────────────
import { S } from "./state.js";
import { apiGet } from "./api.js";
import { $, esc, avUrl, fmtDate, fmtTime, toast, autoResize } from "./utils.js";
import { renderEmbed, renderAttachments } from "./embed.js";
import { renderMarkdown } from "./markdown.js";

export async function loadMessages(silent = false) {
  if (!S.channelId || !S.token) return;
  const r = await apiGet(`/api/messages?token=${encodeURIComponent(S.token)}&channelId=${S.channelId}`);
  if (!Array.isArray(r)) return;
  S.messages = r;
  renderMessages(r, S.msgFilter);
  if (silent && r.length) {
    const m = r[0];
    if (m.id !== S._lastMsgId) {
      S._lastMsgId = m.id;
      toast(`💬 ${m.author?.username ?? "?"}: ${(m.content ?? "[fichier]").slice(0, 50)}`, "info", 3000);
    }
    return;
  }
  S._lastMsgId = r[0]?.id ?? "";
}

export function renderMessages(msgs, filter = "") {
  const area = $("messages-area");
  const list = filter ? msgs.filter(m => (m.content ?? "").toLowerCase().includes(filter.toLowerCase())) : msgs;
  if (!list.length) { area.innerHTML = `<div class="empty-state"><div class="ico">💬</div><p>Aucun message</p></div>`; return; }

  const botId = S.bot?.id;
  let html = `<div class="msg-spacer"></div>`;
  let lastDate = "", lastAId = "", lastTs = 0;

  [...list].reverse().forEach(m => {
    const a = m.author ?? {};
    const d = fmtDate(m.timestamp), t = new Date(m.timestamp).getTime();
    if (d !== lastDate) { html += `<div class="msg-date-sep">${d}</div>`; lastDate = d; }
    const same = a.id === lastAId && t - lastTs < 300000 && !m.referenced_message;
    const isMine = a.id === botId;

    let refHtml = "";
    if (m.referenced_message) {
      const rf = m.referenced_message, rfa = rf.author ?? {};
      refHtml = `<div class="msg-reply-ref"><img class="msg-reply-av" src="${avUrl(rfa, 32)}" onerror="this.style.display='none'"/><span class="msg-reply-name">${esc(rfa.global_name ?? rfa.username ?? "?")}</span><span class="msg-reply-text"> ${esc((rf.content ?? "[pièce jointe]").slice(0,60))}</span></div>`;
    }

    const cont  = m.content ? `<div class="msg-content${m.edited_timestamp ? " edited" : ""}">${renderMarkdown(m.content)}</div>` : "";
    const embs  = (m.embeds ?? []).map(renderEmbed).join("");
    const atts  = renderAttachments(m.attachments ?? []);
    const poll  = m.poll ? renderPollCard(m) : "";
    const editZ = `<div class="msg-edit-zone" id="ez-${m.id}"><textarea class="msg-edit-ta" id="eta-${m.id}" onkeydown="window._onEditKey(event,'${m.id}')"></textarea><div class="msg-edit-hint">Entrée = sauvegarder · Échap = annuler</div></div>`;
    const acts  = `<div class="msg-actions">
      <button class="msg-act reply" onclick="window._setReply('${m.id}','${esc(a.global_name ?? a.username ?? "?").replace(/'/g,"\\'")}','${esc((m.content ?? "").slice(0,60)).replace(/'/g,"\\'")}')">↩</button>
      ${isMine ? `<button class="msg-act edit" onclick="window._startEdit('${m.id}','${(m.content ?? "").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g,"\\n")}')">✏️</button><button class="msg-act del" onclick="window._delMsg('${m.id}')">🗑</button>` : ""}
    </div>`;

    if (!same) {
      html += `<div class="msg-group" id="msg-${m.id}">${refHtml}<img class="msg-av" src="${avUrl(a, 80)}" onerror="this.src=''" loading="lazy" alt=""/><div class="msg-header"><span class="msg-author ${a.bot ? "is-bot" : ""}">${esc(a.global_name ?? a.username ?? "?")}${a.bot ? "<span class=\"bot-badge\">BOT</span>" : ""}</span><span class="msg-ts">${fmtTime(m.timestamp)}</span></div>${cont}${embs}${atts}${poll}${editZ}${acts}</div>`;
    } else {
      html += `<div class="msg-continue" id="msg-${m.id}"><span class="msg-ts-small">${fmtTime(m.timestamp)}</span>${cont}${embs}${atts}${poll}${editZ}${acts}</div>`;
    }
    lastAId = a.id; lastTs = t;
  });

  area.innerHTML = html;
  area.scrollTop = area.scrollHeight;
  area.querySelectorAll(".msg-img,.embed-image").forEach(img => {
    img.onclick = () => { $("lb-img").src = img.src; $("lightbox").classList.add("show"); };
  });
}

function renderPollCard(m) {
  const p = m.poll;
  const tot = p.results?.answer_counts?.reduce((s, a) => s + a.count, 0) ?? 0;
  let h = `<div class="poll-card"><div class="poll-q">📊 ${esc(p.question.text)}</div>`;
  (p.answers ?? []).forEach(ans => {
    const cnt = p.results?.answer_counts?.find(a => a.id === ans.answer_id)?.count ?? 0;
    const pct = tot ? Math.round(cnt / tot * 100) : 0;
    h += `<div class="poll-opt"><span class="poll-opt-emoji">${esc(ans.poll_media?.emoji?.name ?? "")}</span><div class="poll-bar-wrap"><div class="poll-bar" style="width:${pct}%"></div><span class="poll-bar-label">${esc(ans.poll_media?.text ?? "")}</span></div><span class="poll-pct">${pct}%</span></div>`;
  });
  h += `<div class="poll-footer"><span>${tot} vote(s)</span>${!p.results?.is_finalized ? `<button class="poll-end-btn" onclick="window._endPoll('${m.id}')">Terminer</button>` : "<span>Terminé ✓</span>"}</div></div>`;
  return h;
}

// Exposed to global for inline event handlers
export function startEdit(mid, content) {
  document.querySelectorAll(".msg-edit-zone.show").forEach(el => el.classList.remove("show"));
  const zone = $(`ez-${mid}`), ta = $(`eta-${mid}`);
  if (!zone || !ta) return;
  ta.value = content.replace(/\\n/g, "\n");
  zone.classList.add("show"); ta.focus(); autoResize(ta);
}

export function onEditKey(e, mid) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(mid); }
  if (e.key === "Escape") $(`ez-${mid}`).classList.remove("show");
  autoResize(e.target);
}

async function saveEdit(mid) {
  const ta = $(`eta-${mid}`); const content = ta.value.trim(); if (!content) return;
  const r = await fetch("/api/message", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: S.token, channelId: S.channelId, messageId: mid, content }) }).then(r => r.json()).catch(() => ({}));
  if (r.id || r.ok) { toast("Modifié ✓"); $(`ez-${mid}`).classList.remove("show"); await loadMessages(); }
  else toast(r.message ?? "Erreur", "err");
}

export async function delMsg(mid) {
  if (!confirm("Supprimer ce message ?")) return;
  const r = await fetch(`/api/message?token=${encodeURIComponent(S.token)}&channelId=${S.channelId}&messageId=${mid}`, { method: "DELETE" }).then(r => r.json()).catch(() => ({}));
  if (r.ok) { toast("Supprimé ✓"); await loadMessages(); }
  else toast(r.message ?? "Erreur", "err");
}

export function setReply(mid, author, preview) {
  S.replyTo = mid;
  $("rb-author").textContent  = author;
  $("rb-preview").textContent = preview;
  $("reply-bar").classList.add("show");
  $("msg-input").focus();
}

export function clearReply() {
  S.replyTo = null;
  $("reply-bar").classList.remove("show");
}

export function filterMessages(q) {
  S.msgFilter = q;
  $("search-clear").style.display = q ? "" : "none";
  renderMessages(S.messages, q);
}

export function setAutoRefresh(v) {
  clearInterval(S.arTimer); S.arTimer = null;
  $("ar-dot").classList.toggle("active", v > 0);
  if (v > 0) S.arTimer = setInterval(() => loadMessages(true), v * 1000);
}

export async function endPoll(mid) {
  if (!confirm("Terminer ce sondage ?")) return;
  const r = await fetch("/api/poll/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: S.token, channelId: S.channelId, messageId: mid }) }).then(r => r.json()).catch(() => ({}));
  if (r.id || r.ok) { toast("Sondage terminé ✓"); await loadMessages(); }
  else toast(r.message ?? "Erreur", "err");
}
