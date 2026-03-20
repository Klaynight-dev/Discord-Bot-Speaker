import { S } from "./state.js";
import { apiGet } from "./api.js";
import { $, esc, avUrl } from "./utils.js";

let membersVisible = false;
let currentGuildId = null;

export function toggleMembers() {
  membersVisible = !membersVisible;
  $("members-sidebar").style.display = membersVisible ? "flex" : "none";
  $("members-btn").classList.toggle("active", membersVisible);
  if (membersVisible && S.guildId && currentGuildId !== S.guildId) {
    loadMembers(S.guildId);
  }
}

export async function loadMembers(guildId) {
  if (!guildId || !S.token) return;
  currentGuildId = guildId;
  const list = $("members-list");
  list.innerHTML = '<div style="padding:10px;color:var(--text-muted);font-size:12px">Chargement…</div>';
  
  try {
    const [members, roles] = await Promise.all([
      apiGet(`/api/members/${guildId}?token=${S.token}`),
      apiGet(`/api/roles/${guildId}?token=${S.token}`)
    ]);
    
    if (!Array.isArray(members) || !Array.isArray(roles)) {
      list.innerHTML = '<div style="padding:10px;color:var(--red);font-size:12px">Erreur lors du chargement</div>';
      return;
    }
    
    // Trier rôles par position
    roles.sort((a,b) => b.position - a.position);
    S.guildRoles = roles;
    S.guildMembers = members;
    
    // Grouper par rôle
    const groups = new Map();
    groups.set('offline', { name: "Membres", members: [] });
    
    for (const r of roles) {
      if (r.hoist) groups.set(r.id, { name: r.name, color: r.color, members: [], count: 0 });
    }
    
    for (const m of members) {
      let hoistedId = 'offline';
      for (const rId of m.roles) {
        const r = roles.find(x => x.id === rId);
        if (r && r.hoist) {
          if (hoistedId === 'offline') hoistedId = r.id;
          else {
            const h1 = roles.find(x => x.id === hoistedId);
            if (r.position > h1.position) hoistedId = r.id;
          }
        }
      }
      
      const g = groups.get(hoistedId) ?? groups.get('offline');
      
      // Trouver la plus haute couleur
      const userRoles = m.roles.map(rid => roles.find(x => x.id === rid)).filter(Boolean);
      userRoles.sort((a,b) => b.position - a.position);
      m._color = userRoles.find(r => r.color !== 0)?.color ?? 0;
      
      g.members.push(m);
    }
    
    let html = "";
    for (const [id, g] of groups.entries()) {
      if (g.members.length === 0) continue;
      g.members.sort((a,b) => (a.nick || a.user.username).localeCompare(b.nick || b.user.username));
      
      html += `<div class="member-role-category">${esc(g.name)} — ${g.members.length}</div>`;
      for (const m of g.members) {
        const u = m.user;
        const colorHex = m._color ? `#${m._color.toString(16).padStart(6, '0')}` : 'var(--text-normal)';
        html += `<div class="member-item" onclick="window._openDM('${u.id}')">
          <div class="member-av"><img src="${avUrl(u, 64)}" loading="lazy" alt="avatar"/></div>
          <div class="member-name" style="color:${colorHex}">${esc(m.nick ?? u.global_name ?? u.username)}</div>
        </div>`;
      }
    }
    list.innerHTML = html;
  } catch (err) {
    list.innerHTML = '<div style="padding:10px;color:var(--red);font-size:12px">Erreur</div>';
  }
}
