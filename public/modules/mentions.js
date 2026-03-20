import { S } from "./state.js";
import { $, esc, avUrl } from "./utils.js";

let mentionIndex = -1;
let mentionResults = [];
let mentionType = null;
let mentionStart = -1;
let mentionQuery = '';

export function handleMentions(val, cursorEnd) {
  const textBefore = val.slice(0, cursorEnd);
  const match = textBefore.match(/(?:^|\s)([@#])(\S*)$/);
  
  if (!match) {
    closeMentionPopup();
    return false;
  }
  
  mentionType = match[1];
  mentionQuery = match[2].toLowerCase();
  mentionStart = cursorEnd - match[2].length - 1;
  
  if (mentionType === '@') {
    const members = S.guildMembers || [];
    const roles = S.guildRoles || [];
    
    const mRes = members.filter(m => (m.nick||m.user.username||'').toLowerCase().includes(mentionQuery)).slice(0, 10).map(m => ({ type: 'user', data: m }));
    const rRes = roles.filter(r => r.name.toLowerCase().includes(mentionQuery)).slice(0, 5).map(r => ({ type: 'role', data: r }));
    
    mentionResults = [...mRes, ...rRes];
  } else if (mentionType === '#') {
    const channels = S.channels || [];
    mentionResults = channels.filter(c => c.type !== 4 && c.name.toLowerCase().includes(mentionQuery)).slice(0, 10).map(c => ({ type: 'channel', data: c }));
  }
  
  if (mentionResults.length > 0) {
    mentionIndex = 0;
    renderMentionPopup();
    return true;
  } else {
    closeMentionPopup();
    return false;
  }
}

function renderMentionPopup() {
  let popup = $("mention-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "mention-popup";
    popup.style.cssText = "display:none;position:absolute;bottom:calc(100% + 8px);left:0;right:0;background:var(--bg-floating);border:1px solid var(--border);border-radius:var(--r8);max-height:300px;overflow-y:auto;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,.5)";
    $("msg-input").parentNode.appendChild(popup);
  }
  
  popup.style.display = "block";
  popup.innerHTML = mentionResults.map((r, i) => {
    const sel = i === mentionIndex ? 'background:var(--bg-modifier-hover);' : '';
    if (r.type === 'user') {
      const u = r.data.user;
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;border-radius:var(--r4);${sel}" onmouseover="window._mentionHover(${i})" onclick="window._mentionSelect(${i})">
        <img src="${avUrl(u, 32)}" style="width:24px;height:24px;border-radius:50%;object-fit:cover" onerror="this.src=''"/>
        <span style="font-size:14px;font-weight:600;color:var(--text-normal)">${esc(r.data.nick||u.global_name||u.username)}</span>
        <span style="font-size:12px;color:var(--text-muted)">${esc(u.username)}</span>
      </div>`;
    } else if (r.type === 'role') {
      const colorHex = r.data.color ? `#${r.data.color.toString(16).padStart(6, '0')}` : 'var(--text-muted)';
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;border-radius:var(--r4);${sel}" onmouseover="window._mentionHover(${i})" onclick="window._mentionSelect(${i})">
        <div style="width:16px;height:16px;border-radius:50%;background:${colorHex}"></div>
        <span style="font-size:14px;font-weight:600;color:var(--text-normal)">${esc(r.data.name)}</span>
      </div>`;
    } else if (r.type === 'channel') {
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;border-radius:var(--r4);${sel}" onmouseover="window._mentionHover(${i})" onclick="window._mentionSelect(${i})">
        <span style="font-size:16px;color:var(--channel-icon)">#</span>
        <span style="font-size:14px;font-weight:600;color:var(--text-normal)">${esc(r.data.name)}</span>
      </div>`;
    }
  }).join('');
}

export function closeMentionPopup() {
  const popup = $("mention-popup");
  if (popup) popup.style.display = "none";
  mentionResults = [];
  mentionIndex = -1;
}

export function mentionKeydown(e) {
  if (mentionResults.length === 0) return false;
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    mentionIndex = (mentionIndex + 1) % mentionResults.length;
    renderMentionPopup();
    return true;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    mentionIndex = (mentionIndex - 1 + mentionResults.length) % mentionResults.length;
    renderMentionPopup();
    return true;
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault();
    selectMention(mentionIndex);
    return true;
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeMentionPopup();
    return true;
  }
  return false;
}

export function selectMention(index) {
  const r = mentionResults[index];
  if (!r) return;
  
  let insert = '';
  if (r.type === 'user') insert = `<@${r.data.user.id}> `;
  else if (r.type === 'role') insert = `<@&${r.data.id}> `;
  else if (r.type === 'channel') insert = `<#${r.data.id}> `;
  
  const ta = $("msg-input");
  const val = ta.value;
  
  const before = val.slice(0, mentionStart);
  const matchLen = mentionType.length + mentionQuery.length;
  const after = val.slice(mentionStart + matchLen);
  
  ta.value = before + insert + after;
  ta.focus();
  ta.selectionStart = ta.selectionEnd = before.length + insert.length;
  window._onType(); // Update char counter
  
  closeMentionPopup();
}

window._mentionHover = (i) => { mentionIndex = i; renderMentionPopup(); };
window._mentionSelect = (i) => { selectMention(i); };
