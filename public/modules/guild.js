// ── Guild management ──────────────────────────────────
import { S } from "./state.js";
import { apiGet, apiPost } from "./api.js";
import { $, esc, guildIconUrl, toast } from "./utils.js";
import { renderChannels } from "./channel.js";

window._onBotSelect = () => {
  const val = $("bot-select").value;
  if (val) {
    $("bot-token-input").value = val;
    $("bot-token-input").style.display = "none";
  } else {
    $("bot-token-input").value = "";
    $("bot-token-input").style.display = "block";
  }
};

export function loadSavedBots() {
  const saved = JSON.parse(localStorage.getItem("bot_tokens") || "[]");
  const sel = $("bot-select");
  if (!sel) return;
  if (saved.length === 0) {
    sel.style.display = "none";
    $("bot-token-input").style.display = "block";
    return;
  }
  sel.style.display = "block";
  sel.innerHTML = `<option value="">+ Ajouter un nouveau bot...</option>` + saved.map(b => `<option value="${b.token}">${b.username}</option>`).join("");
  sel.value = "";
  $("bot-token-input").value = "";
  $("bot-token-input").style.display = "block";
}

export async function connect(silent = false) {
  const token = $("bot-token-input").value.trim();
  if (!token) { toast("Entrez un token", "err"); return false; }
  S.token = token;
  $("connect-btn").disabled = true;
  $("connect-btn").textContent = "…";

  const r = await apiGet(`/api/me?token=${encodeURIComponent(token)}`);
  $("connect-btn").disabled = false;
  $("connect-btn").textContent = "Connecter";

  if (!r.id) { if (!silent) toast(r.message ?? "Token invalide", "err"); return false; }

  S.bot = r; S.connected = true;

  const avU = r.avatar
    ? `https://cdn.discordapp.com/avatars/${r.id}/${r.avatar}.png?size=64`
    : "";
  $("bot-av").innerHTML = avU
    ? `<img src="${avU}" alt=""/><div class="bot-status-ring"><div class="bot-status-dot online"></div></div>`
    : `🤖<div class="bot-status-ring"><div class="bot-status-dot online"></div></div>`;
  $("bot-name").textContent = r.global_name ?? r.username;
  $("bot-tag").textContent  = `@${r.username}`;
  $("bot-info-wrap").style.cssText = "display:flex;flex-direction:column";
  $("connect-wrap").style.display  = "none";
  $("disconnect-btn").style.display = "block";
  $("bot-settings-btn").style.display = "flex";
  if ($("invite-sep")) $("invite-sep").style.display = "block";
  if ($("invite-icon")) $("invite-icon").style.display = "flex";

  const saved = JSON.parse(localStorage.getItem("bot_tokens") || "[]");
  const exIdx = saved.findIndex(x => x.token === token);
  const curBot = { id: r.id, username: r.username, avatar: r.avatar, token };
  if (exIdx > -1) saved[exIdx] = curBot; else saved.push(curBot);
  localStorage.setItem("bot_tokens", JSON.stringify(saved));

  await apiPost("/api/config", { token, guildId: S.guildId, channelId: S.channelId });
  if (!silent) toast(`Connecté @${r.username} ✓`);
  await loadGuilds();
  return true;
}

export async function disconnect() {
  S.connected = false; S.bot = null; S.token = "";
  S.guildId = null; S.channelId = null;
  clearInterval(S.arTimer);

  $("bot-av").innerHTML = "🤖";
  $("bot-info-wrap").style.display  = "none";
  $("connect-wrap").style.display   = "flex";
  $("disconnect-btn").style.display = "none";
  $("bot-settings-btn").style.display = "none";
  if ($("invite-sep")) $("invite-sep").style.display = "none";
  if ($("invite-icon")) $("invite-icon").style.display = "none";
  
  loadSavedBots();
  
  $("guild-list").innerHTML  = "";
  $("channel-scroll").innerHTML = "";
  $("messages-area").innerHTML = `<div class="empty-state"><div class="ico">💬</div><p>Connectez votre bot et sélectionnez un salon</p></div>`;
  $("sidebar-guild-name").textContent = "Aucun serveur";
  $("chan-bar-name").textContent = "Aucun salon";
  $("chan-bar-topic").textContent = "";
  ["pins-btn", "refresh-btn"].forEach(id => { const el = $(id); if (el) el.style.display = "none"; });
  $("autorefresh-wrap").style.display = "none";
  $("limit-badge").classList.remove("show");
  toast("Déconnecté", "info");
}

export async function loadGuilds() {
  const list = await apiGet(`/api/guilds?token=${encodeURIComponent(S.token)}`);
  if (!Array.isArray(list)) return;
  S.guilds = list;
  const el = $("guild-list"); el.innerHTML = "";
  for (const g of list) {
    const icon = document.createElement("div");
    icon.className = "guild-icon"; icon.title = g.name; icon.dataset.id = g.id;
    const ico = guildIconUrl(g);
    icon.innerHTML = ico
      ? `<div class="guild-pill"></div><img src="${ico}" alt="${esc(g.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"/>`
      : `<div class="guild-pill"></div>${esc(g.name.split(/\s+/).map(w => w[0]).join("").slice(0,2).toUpperCase())}`;
    icon.onclick = () => selectGuild(g.id);
    el.appendChild(icon);
  }
}

export async function selectGuild(guildId, silent = false) {
  S.guildId = guildId;
  document.querySelectorAll(".guild-icon").forEach(el => el.classList.toggle("active", el.dataset.id === guildId));
  const g = S.guilds.find(x => x.id === guildId) ?? { name: guildId };
  $("sidebar-guild-name").textContent = g.name;
  $("channel-scroll").innerHTML = `<div style="padding:16px;font-size:13px;color:var(--text-muted)">Chargement…</div>`;

  const r = await apiGet(`/api/channels?token=${encodeURIComponent(S.token)}&guildId=${guildId}`);
  if (!Array.isArray(r.channels)) return;
  S.channels = r.channels;
  if (r.guild?.premium_tier !== undefined) {
    const t = r.guild.premium_tier;
    const labels = ["25 MB", "50 MB", "100 MB", "500 MB"];
    const bytes  = [26214400, 52428800, 104857600, 524288000];
    S.guildLimit = { tier: t, limitBytes: bytes[t], limitLabel: labels[t] };
  }

  // Background: emojis + slash cmds
  apiGet(`/api/emojis?token=${encodeURIComponent(S.token)}&guildId=${guildId}`)
    .then(em => { if (Array.isArray(em)) S.guildEmojis = em; });
  if (S.bot?.id) {
    apiGet(`/api/slash-commands?token=${encodeURIComponent(S.token)}&appId=${S.bot.id}&guildId=${guildId}`)
      .then(d => { if (d.global || d.guild) S.slashCmds = [...(d.global ?? []), ...(d.guild ?? [])]; });
  }

  renderChannels(r.channels);
  if (!silent) await apiPost("/api/config", { token: S.token, guildId, channelId: S.channelId });
}
