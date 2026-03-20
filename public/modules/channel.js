// ── Channel list rendering ────────────────────────────
import { S } from "./state.js";
import { apiPost } from "./api.js";
import { $, esc, toast } from "./utils.js";
import { loadMessages } from "./messages.js";
import { apiGet } from "./api.js";

const SVGS = {
  text: '<svg class="chan-icon-svg" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.7601L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.7601 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.4101L16.3501 15H19.755C20.0656 15 20.3011 15.2802 20.2475 15.5862L20.0725 16.5862C20.0306 16.8254 19.8229 17 19.58 17H16.0001L15.3633 20.5874C15.3209 20.8261 15.1134 21 14.871 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14.0001 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41045 9L8.35045 15H14.3504L15.4104 9H9.41045Z"></path></svg>',
  voice: '<svg class="chan-icon-svg" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M11.383 3.07904C11.009 2.92504 10.579 3.01004 10.293 3.29604L6 8.00204H3C2.45 8.00204 2 8.45304 2 9.00204V15.002C2 15.552 2.45 16.002 3 16.002H6L10.293 20.71C10.579 20.996 11.009 21.082 11.383 20.927C11.757 20.772 12 20.407 12 20.002V4.00204C12 3.59904 11.757 3.23204 11.383 3.07904ZM14 5.00195V7.00195C16.757 7.00195 19 9.24595 19 12.002C19 14.759 16.757 17.002 14 17.002V19.002C17.86 19.002 21 15.863 21 12.002C21 8.14295 17.86 5.00195 14 5.00195ZM14 9.00195C15.654 9.00195 17 10.349 17 12.002C17 13.657 15.654 15.002 14 15.002V13.002C14.551 13.002 15 12.553 15 12.002C15 11.451 14.551 11.002 14 11.002V9.00195Z"></path></svg>',
  folder: '<svg class="chan-icon-svg" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M10.59 4.59C10.21 4.21 9.7 4 9.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10.59 4.59Z"></path></svg>',
  announcement: '<svg class="chan-icon-svg" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M3.37868 2.80777C2.26194 3.06403 1.62586 4.10309 1.93335 5.21045L4.5447 14.6111C4.79503 15.5123 5.56846 16.143 6.48705 16.2731L7.22744 16.3779V20.8988C7.22744 21.5065 7.72004 22 8.32766 22H9.68965C10.2973 22 10.7899 21.5065 10.7899 20.8988V16.8824L11.5168 16.9852C12.4497 17.1173 13.3323 16.634 13.7388 15.766L15.3411 12.3458C17.7011 12.4418 21 11.7583 21 8.89883C21 5.92247 16.4897 4.11674 12.9806 3.0374C12.6963 2.94998 12.396 2.98188 12.1337 3.12579L10.8222 3.84524L4.35414 2.36154C4.0531 2.29246 3.73634 2.72565 3.37868 2.80777ZM4.01502 4.09503C3.93181 3.79549 4.11548 3.49081 4.41738 3.42152L10.817 1.95254C11.1685 1.87184 11.5361 1.96796 11.8087 2.19949C14.7356 4.3435 18 5.75344 18 8.89883C18 11.3976 15.4294 11.4589 13.52 11.3129C13.208 11.2889 12.915 11.446 12.7849 11.724L11.5654 14.3276C11.42 14.6382 11.1047 14.8108 10.7716 14.7636L5.61793 14.034C5.28956 13.9875 5.01334 13.7623 4.92393 13.4404L4.01502 4.09503Z"></path></svg>',
  thread: '<svg class="chan-icon-svg" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12.7818 1.9502C12.9823 1.62143 13.454 1.62143 13.6545 1.9502L18.4418 9.8002C18.6322 10.1126 18.4068 10.5002 18.0416 10.5002H18.0002V13.0002C18.0002 16.3139 15.314 19.0002 12.0002 19.0002H10.0002V21.0002L6.15186 18.0031C5.81157 17.7381 5.81157 17.2144 6.15186 16.9494L10.0002 13.9523V16.0002H12.0002C13.6571 16.0002 15.0002 14.6571 15.0002 13.0002V10.5002H15.0002C14.635 10.5002 14.4096 10.1126 14.6001 9.8002L12.7818 6.819L9.43196 12.3111C9.24151 12.6235 8.76983 12.6235 8.57938 12.3111L4.76618 6.06111H4.72477C4.35954 6.06111 4.13418 5.67352 4.32463 5.36111L9.11186 2.48834C9.31235 2.15957 9.78403 2.15957 9.98453 2.48834L12.7818 6.819L12.7818 1.9502Z"></path></svg>',
  stage: '<svg class="chan-icon-svg" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12 2C9.243 2 7 4.243 7 7V9C7 11.757 9.243 14 12 14C14.757 14 17 11.757 17 9V7C17 4.243 14.757 2 12 2ZM8 17.514C10.104 18.455 12.464 18.455 14.568 17.514L15.328 17.172L16.273 19.34L15.051 19.89C13.076 20.778 10.924 20.778 8.949 19.89L7.727 19.34L8.672 17.172L9.432 17.514Z"></path></svg>',
  directory: '<svg class="chan-icon-svg" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.06 14.54-5.02-2.14c-.16-.07-.28-.19-.35-.35L6.55 9.03c-.11-.26-.06-.56.12-.77.16-.19.42-.26.66-.18l5.02 2.14c.16.07.28.19.35.35l2.14 5.02c.11.26.06.56-.12.77-.16.19-.42.26-.66.18z"></path></svg>',
  forum: '<svg class="chan-icon-svg" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M15.5 2C18.5376 2 21 4.46243 21 7.5V11C21 11.5523 20.5523 12 20 12H19.5V13.5C19.5 16.5376 17.0376 19 14 19H12.9157L9.75624 21.2842C9.57865 21.4126 9.34963 21.4554 9.13525 21.399C8.92087 21.3426 8.74971 21.1945 8.67098 20.9902C8.61466 20.844 8.58319 20.6865 8.57796 20.525C8.56667 20.1764 8.44195 19.8407 8.22341 19.5636C8.01662 19.3013 7.76189 19.0838 7.4764 18.925C6.39893 18.3248 5.48512 17.4332 4.83296 16.3475C4.28828 15.441 4 14.394 4 13.3333V9C4 5.96243 6.46243 3.5 9.5 3.5H12C12 2.67157 12.6716 2 13.5 2H15.5ZM13.5 4.5H9.5C7.29086 4.5 5.5 6.29086 5.5 8.5V13H15.5C16.3284 13 17 12.3284 17 11.5V11H18.5C18.7761 11 19 10.7761 19 10.5V7.5C19 5.84315 17.6569 4.5 16 4.5H13.5Z"></path></svg>'
};
const CHAN_ICONS = { 0: SVGS.text, 2: SVGS.voice, 4: SVGS.folder, 5: SVGS.announcement, 10: SVGS.thread, 11: SVGS.thread, 12: SVGS.thread, 13: SVGS.stage, 14: SVGS.directory, 15: SVGS.forum };
const collapsed  = new Set();

export function renderChannels(channels) {
  const scroll = $("channel-scroll"); scroll.innerHTML = "";
  const cats  = channels.filter(c => c.type === 4).sort((a,b) => a.position - b.position);
  const chans = channels.filter(c => c.type !== 4);

  // Uncategorised
  chans.filter(c => !c.parent_id).sort((a,b) => a.position - b.position).forEach(c => scroll.appendChild(buildChanEl(c)));

  // Categories
  for (const cat of cats) {
    const kids = chans.filter(c => c.parent_id === cat.id).sort((a,b) => a.position - b.position);
    const isCol = collapsed.has(cat.id);
    
    const catEl = document.createElement("div"); catEl.className = "cat-header";
    catEl.innerHTML = `<span class="cat-arrow ${isCol ? "collapsed" : ""}">▾</span><span style="flex:1">${esc(cat.name).toUpperCase()}</span>`;
    catEl.dataset.id = cat.id;
    catEl.draggable = true;
    scroll.appendChild(catEl);

    const kidEls = kids.map(c => {
      const el = buildChanEl(c);
      el.dataset.parentId = cat.id;
      if (isCol) el.style.display = "none";
      return el;
    });

    catEl.onclick = () => {
      const col = collapsed.has(cat.id);
      col ? collapsed.delete(cat.id) : collapsed.add(cat.id);
      catEl.querySelector(".cat-arrow").classList.toggle("collapsed", !col);
      
      let next = catEl.nextElementSibling;
      while (next && !next.classList.contains("cat-header")) {
        next.style.display = col ? "" : "none";
        next = next.nextElementSibling;
      }
    };
    
    kidEls.forEach(el => scroll.appendChild(el));
  }
  
  initDragAndDrop(scroll);
}

function buildChanEl(c) {
  const el = document.createElement("div");
  el.className = `chan-item${c.id === S.channelId ? " active" : ""}`;
  el.dataset.id = c.id;
  el.draggable = true;
  const ico = CHAN_ICONS[c.type] ?? SVGS.text;
  const edit = c.type === 0
    ? `<div class="chan-actions"><button class="chan-act-btn" title="Modifier" onclick="window._openChanEdit(event,'${c.id}','${esc(c.name).replace(/'/g,"\\'")}','${esc(c.topic ?? "").replace(/'/g,"\\'")}',${c.rate_limit_per_user ?? 0},${!!c.nsfw})">✏️</button></div>`
    : "";
  el.innerHTML = `<span class="chan-icon">${ico}</span><div style="flex:1;min-width:0"><div class="chan-name">${esc(c.name)}</div>${c.topic ? `<div class="chan-topic">${esc(c.topic)}</div>` : ""}</div>${edit}`;
  if ([0, 2, 5, 15].includes(c.type))
    el.onclick = e => { if (!e.target.closest(".chan-actions")) selectChannel(c.id); };
  return el;
}

export async function selectChannel(channelId, silent = false) {
  S.channelId = channelId;
  document.querySelectorAll(".chan-item").forEach(el => el.classList.toggle("active", el.dataset.id === channelId));
  const chan = S.channels.find(c => c.id === channelId);
  if (chan) {
    $("chan-bar-icon").innerHTML  = CHAN_ICONS[chan.type] ?? SVGS.text;
    $("chan-bar-name").textContent  = chan.name;
    $("chan-bar-topic").textContent = chan.topic ?? "";
  }
  ["pins-btn", "refresh-btn", "members-btn"].forEach(id => { const el = $(id); if (el) el.style.display = ""; });
  $("autorefresh-wrap").style.display = "flex";
  $("limit-badge").classList.add("show");
  $("limit-text").textContent = S.guildLimit.limitLabel + " max";
  $("limit-dot").className = `limit-dot tier${S.guildLimit.tier}`;
  if (!silent) await apiPost("/api/config", { token: S.token, guildId: S.guildId, channelId });
  await loadMessages();
}

export { CHAN_ICONS };

function initDragAndDrop(container) {
  let dragging = null;
  container.ondragstart = e => {
    dragging = e.target.closest(".chan-item, .cat-header");
    if (dragging) {
      e.dataTransfer.effectAllowed = "move";
      setTimeout(() => dragging.classList.add("dragging"), 0);
    }
  };
  container.ondragend = async e => {
    if (!dragging) return;
    dragging.classList.remove("dragging");
    const els = [...container.children];
    const positions = [];
    let currentParent = null;
    let pos = 0;
    for (const el of els) {
      if (el.classList.contains("cat-header")) {
        currentParent = el.dataset.id;
        positions.push({ id: currentParent, position: pos++ });
      } else if (el.classList.contains("chan-item")) {
        positions.push({ id: el.dataset.id, position: pos++, parent_id: currentParent });
      }
    }
    dragging = null;
    if (positions.length > 0) {
      const r = await apiPost('/api/guild-channels/' + S.guildId, { token: S.token, positions });
      if (r.error) toast(r.error, "err");
      else toast("Ordre sauvegardé ✓");
    }
  };
  container.ondragover = e => {
    e.preventDefault();
    if (!dragging) return;
    const after = getDragAfterElement(container, e.clientY);
    if (after == null) container.appendChild(dragging);
    else container.insertBefore(dragging, after);
  };
}

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll(".chan-item:not(.dragging), .cat-header:not(.dragging)")];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
