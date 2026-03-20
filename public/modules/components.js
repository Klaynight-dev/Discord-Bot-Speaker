// ── Components V2 builder ─────────────────────────────
import { S } from "./state.js";
import { apiPost } from "./api.js";
import { $, esc, toast } from "./utils.js";
import { loadMessages } from "./messages.js";

const BTN_STYLES = { 1:"Primary", 2:"Secondary", 3:"Success", 4:"Danger", 5:"Link" };

export function addCompBlock(type) {
  const id = Date.now();
  const block = { id, type, data: {} };
  if (type === "buttons") block.data.buttons = [{ label: "Bouton", style: 1, custom_id: `btn_${id}` }];
  if (type === "text")    block.data.content = "";
  if (type === "section") block.data.text = "";
  S.compBlocks.push(block); renderCompBlocks(); updateCompPreview();
}

export function rmCompBlock(id) { S.compBlocks = S.compBlocks.filter(b => b.id !== id); renderCompBlocks(); updateCompPreview(); }

export function moveComp(id, dir) {
  const i = S.compBlocks.findIndex(b => b.id === id), j = i + dir;
  if (j < 0 || j >= S.compBlocks.length) return;
  [S.compBlocks[i], S.compBlocks[j]] = [S.compBlocks[j], S.compBlocks[i]];
  renderCompBlocks(); updateCompPreview();
}

export function renderCompBlocks() {
  const el = $("comp-blocks"); el.innerHTML = "";
  S.compBlocks.forEach((b, i) => {
    const cb = document.createElement("div"); cb.className = "cb";
    const label = { text:"📝 Texte", sep:"─ Séparateur", buttons:"🔘 Boutons", section:"📑 Section" }[b.type] ?? b.type;
    cb.innerHTML = `<div class="cb-head"><div class="cb-title">${label}<span class="cb-badge">#${i+1}</span></div>
      <div class="cb-btns">
        <button class="cb-ctrl" onclick="window._moveComp(${b.id},-1)" ${i===0?"disabled":""}>↑</button>
        <button class="cb-ctrl" onclick="window._moveComp(${b.id},1)" ${i===S.compBlocks.length-1?"disabled":""}>↓</button>
        <button class="cb-ctrl del" onclick="window._rmCompBlock(${b.id})">✕</button>
      </div></div>`;
    if (b.type === "text")    cb.innerHTML += `<textarea class="cb-textarea" placeholder="Texte Markdown…" oninput="S.compBlocks.find(x=>x.id===${b.id}).data.content=this.value;window._updateCompPreview()">${esc(b.data.content ?? "")}</textarea>`;
    if (b.type === "section") cb.innerHTML += `<textarea class="cb-textarea" placeholder="Texte de section…" oninput="S.compBlocks.find(x=>x.id===${b.id}).data.text=this.value;window._updateCompPreview()">${esc(b.data.text ?? "")}</textarea>`;
    if (b.type === "buttons") {
      cb.innerHTML += (b.data.buttons ?? []).map((btn, bi) => `<div class="cb-row cb-3">
        <input class="cb-input" placeholder="Label" value="${esc(btn.label ?? "")}" oninput="S.compBlocks.find(x=>x.id===${b.id}).data.buttons[${bi}].label=this.value;window._updateCompPreview()"/>
        <select class="cb-select" onchange="S.compBlocks.find(x=>x.id===${b.id}).data.buttons[${bi}].style=+this.value;window._updateCompPreview()">${Object.entries(BTN_STYLES).map(([k,v])=>`<option value="${k}"${btn.style==k?" selected":""}>${v}</option>`).join("")}</select>
        <input class="cb-input" placeholder="custom_id ou URL" value="${esc(btn.custom_id ?? btn.url ?? "")}" oninput="const blk=S.compBlocks.find(x=>x.id===${b.id});if(blk.data.buttons[${bi}].style==5){blk.data.buttons[${bi}].url=this.value;}else{blk.data.buttons[${bi}].custom_id=this.value;}window._updateCompPreview()"/>
      </div>`).join("");
    }
    el.appendChild(cb);
  });
  const n = S.compBlocks.length;
  $("comp-hint").textContent = `${n} bloc${n !== 1 ? "s" : ""}`;
  $("send-comp-btn").disabled = n === 0;
}

export function updateCompPreview() {
  $("comp-json-pre").textContent = JSON.stringify(buildCompPayload(), null, 2);
  renderCompBlocks();
}

function buildCompPayload() {
  const comps = S.compBlocks.map(b => {
    if (b.type === "text")    return { type: 10, content: b.data.content ?? "" };
    if (b.type === "sep")     return { type: 14, divider: true, spacing: 1 };
    if (b.type === "section") return { type: 9,  components: [{ type: 10, content: b.data.text ?? "" }] };
    if (b.type === "buttons") return { type: 1,  components: (b.data.buttons ?? []).map(btn => {
      const c = { type: 2, label: btn.label ?? "", style: btn.style ?? 1 };
      if (btn.style == 5) c.url = btn.url || "https://example.com";
      else c.custom_id = btn.custom_id || `btn_${Date.now()}`;
      return c;
    })};
    return null;
  }).filter(Boolean);
  return $("comp-use-container")?.checked ? [{ type: 17, components: comps }] : comps;
}

export async function sendComponents() {
  if (!S.channelId) { toast("Sélectionnez un salon", "err"); return; }
  const r = await apiPost("/api/send-components", { token: S.token, channelId: S.channelId, components: buildCompPayload() });
  if (r.id) { toast("Composants envoyés ✓"); S.compBlocks = []; renderCompBlocks(); if (!S.arTimer) await loadMessages(); }
  else toast(r.message ?? "Erreur", "err");
}
