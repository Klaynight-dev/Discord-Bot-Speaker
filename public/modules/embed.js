// ── Embed renderer ────────────────────────────────────
import { esc } from "./utils.js";
import { renderMarkdown } from "./markdown.js";
import { fmtDate, fmtTime } from "./utils.js";

export function renderEmbed(e) {
  let h = `<div class="embed"><div class="embed-accent" style="background:${e.color ? `#${e.color.toString(16).padStart(6,"0")}` : "var(--bg-modifier-hover)"}"></div><div class="embed-body">`;
  if (e.thumbnail?.url) h += `<img class="embed-thumb" src="${esc(e.thumbnail.url)}" loading="lazy"/>`;
  if (e.author?.name)   h += `<div class="embed-author">${e.author.icon_url ? `<img class="embed-author-icon" src="${esc(e.author.icon_url)}" loading="lazy"/>` : ""}<span class="embed-author-name">${esc(e.author.name)}</span></div>`;
  if (e.title)          h += `<div class="embed-title${e.url ? "" : " no-url"}">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">` : ""}${esc(e.title)}${e.url ? "</a>" : ""}</div>`;
  if (e.description)    h += `<div class="embed-desc">${renderMarkdown(e.description)}</div>`;
  if (e.fields?.length) {
    h += `<div class="embed-fields">`;
    let i = 0;
    while (i < e.fields.length) {
      const f = e.fields[i];
      if (f.inline) {
        const grp = [f]; let j = i + 1;
        while (j < e.fields.length && e.fields[j].inline && grp.length < 3) { grp.push(e.fields[j]); j++; }
        h += `<div style="display:grid;grid-template-columns:repeat(${grp.length},1fr);gap:8px">`;
        grp.forEach(ff => h += `<div class="embed-field"><div class="embed-field-name">${esc(ff.name)}</div><div class="embed-field-val">${renderMarkdown(ff.value)}</div></div>`);
        h += `</div>`; i = j;
      } else {
        h += `<div class="embed-field"><div class="embed-field-name">${esc(f.name)}</div><div class="embed-field-val">${renderMarkdown(f.value)}</div></div>`;
        i++;
      }
    }
    h += `</div>`;
  }
  if (e.image?.url) h += `<img class="embed-image" src="${esc(e.image.url)}" loading="lazy"/>`;
  if (e.footer?.text || e.timestamp)
    h += `<div class="embed-footer">${e.footer?.icon_url ? `<img class="embed-footer-icon" src="${esc(e.footer.icon_url)}" loading="lazy"/>` : ""}<span>${esc(e.footer?.text ?? "")}</span>${e.timestamp ? `<span class="embed-footer-right">${fmtDate(e.timestamp)} ${fmtTime(e.timestamp)}</span>` : ""}</div>`;
  return h + "</div></div>";
}

export function renderAttachments(atts) {
  let h = "";
  const imgs = atts.filter(a => /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(a.url));
  const rest = atts.filter(a => !/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(a.url));
  if (imgs.length) { h += `<div class="msg-imgs">`; imgs.forEach(a => { h += `<img class="msg-img" src="${esc(a.url)}" loading="lazy" alt="${esc(a.filename)}"/>`; }); h += `</div>`; }
  rest.forEach(a => { h += `<div class="msg-file"><span class="msg-file-icon">📄</span><div><div class="msg-file-name"><a href="${esc(a.url)}" target="_blank">${esc(a.filename)}</a></div><div class="msg-file-size">${(a.size/1048576).toFixed(2)} MB</div></div></div>`; });
  return h;
}
