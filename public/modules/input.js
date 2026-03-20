// ── Input zone: mode switch, type, file attach, send ──
import { S } from "./state.js";
import { apiPost } from "./api.js";
import { $, toast, autoResize } from "./utils.js";
import { clearReply, loadMessages } from "./messages.js";
import { handleMentions, mentionKeydown } from "./mentions.js";

export function setMode(m) {
  S.mode = m;
  document.querySelectorAll(".mode-tab").forEach((t, i) =>
    t.classList.toggle("active", (i===0&&m==="msg")||(i===1&&m==="poll")||(i===2&&m==="comp"))
  );
  $("msg-panel").style.display  = m === "msg"  ? "" : "none";
  $("poll-panel").style.display = m === "poll" ? "" : "none";
  $("comp-panel").style.display = m === "comp" ? "" : "none";
}

export function onType() {
  const ta = $("msg-input"); autoResize(ta);
  const len = ta.value.length;
  const ctr = $("char-ctr"); ctr.textContent = `${len} / 2000`;
  ctr.className = len > 2000 ? "over" : len > 1800 ? "warn" : "";
  $("send-btn").disabled = len === 0 && S.files.length === 0 && !hasEmbed();
  if (ta.value.startsWith("/")) {
    const q = ta.value.slice(1).toLowerCase();
    const matches = S.slashCmds.filter(c => c.name.startsWith(q)).slice(0, 10);
    renderSlashPopup(matches);
  } else {
    $("slash-popup").classList.remove("show");
    handleMentions(ta.value, ta.selectionEnd);
  }
}

export function onKey(e) {
  if (mentionKeydown(e)) return;
  if (e.key === "Enter" && !e.shiftKey && S.mode === "msg") { e.preventDefault(); sendMsg(); }
  autoResize(e.target);
}

function renderSlashPopup(cmds) {
  const popup = $("slash-popup");
  if (!cmds.length) { popup.classList.remove("show"); return; }
  popup.classList.add("show");
  popup.innerHTML = cmds.map(c => `<div class="slash-cmd" onclick="window._applySlash('${c.name}')">
    <div class="slash-cmd-icon">${c.name[0].toUpperCase()}</div>
    <div><div class="slash-cmd-name">/${c.name}</div><div class="slash-cmd-desc">${c.description ?? ""}</div></div>
  </div>`).join("");
}

export function applySlash(name) {
  $("msg-input").value = "/" + name + " ";
  $("slash-popup").classList.remove("show");
  $("msg-input").focus(); onType();
}

export function onFiles(evt) {
  S.files = [...S.files, ...Array.from(evt.target.files ?? [])].slice(0, 10);
  evt.target.value = "";
  renderPreviews();
  $("send-btn").disabled = false;
}

function renderPreviews() {
  const pr = $("previews"); pr.innerHTML = "";
  S.files.forEach((f, i) => {
    const item = document.createElement("div"); item.className = "preview-item";
    if (f.type.startsWith("image/")) item.innerHTML = `<img src="${URL.createObjectURL(f)}" alt=""/><button class="rm" onclick="window._rmFile(${i})">✕</button>`;
    else item.innerHTML = `<div class="preview-file-item">📄<br>${f.name.slice(0, 12)}</div><button class="rm" onclick="window._rmFile(${i})">✕</button>`;
    pr.appendChild(item);
  });
}

export function rmFile(i) {
  S.files.splice(i, 1);
  renderPreviews();
  $("send-btn").disabled = S.files.length === 0 && !$("msg-input").value.trim() && !hasEmbed();
}

export async function sendMsg() {
  if (!S.channelId) { toast("Sélectionnez un salon", "err"); return; }
  const content = $("msg-input").value.slice(0, 2000);
  const embedData = buildEmbedData();
  $("send-btn").disabled = true;
  try {
    if (S.files.length > 0) {
      const fd = new FormData();
      fd.append("token", S.token); fd.append("channelId", S.channelId);
      if (content) fd.append("content", content);
      if (S.replyTo) fd.append("replyTo", S.replyTo);
      if (embedData) fd.append("embeds", JSON.stringify([embedData]));
      S.files.forEach(f => fd.append("files", f, f.name));
      const r = await fetch("/api/send", { method: "POST", body: fd }).then(r => r.json()).catch(() => ({}));
      if (r.id) { resetInput(); if (!S.arTimer) await loadMessages(); }
      else if (r.error === "Fichier(s) trop volumineux") showFileErr(r);
      else toast(r.message ?? r.error ?? "Erreur", "err");
    } else {
      const payload = { token: S.token, channelId: S.channelId };
      if (content) payload.content = content;
      if (S.replyTo) payload.message_reference = { message_id: S.replyTo, fail_if_not_exists: false };
      if (embedData) payload.embeds = [embedData];
      const r = await apiPost("/api/send", payload);
      if (r.id) { resetInput(); if (!S.arTimer) await loadMessages(); }
      else toast(r.message ?? "Erreur", "err");
    }
  } finally { $("send-btn").disabled = false; }
}

function resetInput() {
  $("msg-input").value = ""; $("msg-input").style.height = "auto";
  S.files = []; renderPreviews(); clearReply(); clearEmbed();
  $("send-btn").disabled = true; $("char-ctr").textContent = "0 / 2000";
}

function showFileErr(r) {
  $("err-files-list").textContent = r.detail ?? "";
  $("err-limit-label").textContent = r.limitLabel ?? "?";
  [0,1,2,3].forEach(i => { const el = $(`bl${i}`); if (el) el.classList.toggle("current", i === r.tier); });
  $("err-modal").classList.add("show");
}

// ── Embed builder ─────────────────────────────────────
export function toggleEmbed() {
  const eb = $("embed-builder-wrap");
  eb.classList.toggle("show");
  $("embed-toggle-btn").classList.toggle("active", eb.classList.contains("show"));
}

export function hasEmbed() {
  return ["eb-title","eb-desc","eb-url","eb-image","eb-thumb","eb-author","eb-footer"].some(id => $(id)?.value?.trim());
}

export function buildEmbedData() {
  const g = id => $(id)?.value?.trim() ?? "";
  const [title, desc, url, image, thumb, author, footer] = ["eb-title","eb-desc","eb-url","eb-image","eb-thumb","eb-author","eb-footer"].map(g);
  const hex = $("eb-color-hex")?.value ?? "#5865f2";
  const color = parseInt(hex.replace("#",""), 16) || 5793266;
  if (!title && !desc && !url && !image && !thumb && !author && !footer && !S.embedFields.length) return null;
  const emb = { color };
  if (title)  emb.title  = title;
  if (url)    emb.url    = url;
  if (desc)   emb.description = desc;
  if (author) emb.author  = { name: author };
  if (footer) emb.footer  = { text: footer };
  if (image)  emb.image   = { url: image };
  if (thumb)  emb.thumbnail = { url: thumb };
  if (S.embedFields.length) emb.fields = S.embedFields.filter(f => f.name || f.value);
  return emb;
}

export function clearEmbed() {
  ["eb-title","eb-desc","eb-url","eb-image","eb-thumb","eb-author","eb-footer"].forEach(id => { const el = $(id); if (el) el.value = ""; });
  S.embedFields = []; $("eb-fields").innerHTML = "";
  syncEmbedColor("#5865f2");
}

export function syncEmbedColor(v) { $("eb-color-hex").value = v; $("eb-color-picker").value = v; $("eb-preview-bar").style.background = v; }
export function syncEmbedColorHex(v) { if (/^#[0-9a-f]{6}$/i.test(v)) { $("eb-color-picker").value = v; $("eb-preview-bar").style.background = v; } }

export function addEmbedField() {
  if (S.embedFields.length >= 25) return;
  const idx = S.embedFields.length; S.embedFields.push({ name: "", value: "", inline: false });
  const row = document.createElement("div"); row.className = "eb-field-item";
  row.innerHTML = `<input class="eb-input" placeholder="Nom" oninput="S.embedFields[${idx}].name=this.value"/>
    <input class="eb-input" placeholder="Valeur" oninput="S.embedFields[${idx}].value=this.value"/>
    <label class="eb-inline-check"><input type="checkbox" onchange="S.embedFields[${idx}].inline=this.checked"> Inline</label>
    <button class="eb-rm-field" onclick="window._rmEmbedField(${idx})">✕</button>`;
  $("eb-fields").appendChild(row);
}

export function rmEmbedField(i) {
  S.embedFields.splice(i, 1);
  $("eb-fields").innerHTML = "";
  S.embedFields.forEach((_, i) => {
    const row = document.createElement("div"); row.className = "eb-field-item";
    row.innerHTML = `<input class="eb-input" placeholder="Nom" value="${S.embedFields[i].name ?? ""}" oninput="S.embedFields[${i}].name=this.value"/>
      <input class="eb-input" placeholder="Valeur" value="${S.embedFields[i].value ?? ""}" oninput="S.embedFields[${i}].value=this.value"/>
      <label class="eb-inline-check"><input type="checkbox" ${S.embedFields[i].inline ? "checked" : ""} onchange="S.embedFields[${i}].inline=this.checked"> Inline</label>
      <button class="eb-rm-field" onclick="window._rmEmbedField(${i})">✕</button>`;
    $("eb-fields").appendChild(row);
  });
}
