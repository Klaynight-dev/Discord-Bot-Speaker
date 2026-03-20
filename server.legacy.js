// ╔══════════════════════════════════════════════════════╗
// ║  Discord BotSpeaker v2.0.0 — Bun Edition            ║
// ║  Zéro dépendances • Fetch natif • FormData natif    ║
// ╚══════════════════════════════════════════════════════╝

const PORT     = process.env.PORT || 3000;
const CFG_PATH = "./config.json";
const TPL_PATH = "./templates.json";
const PUBLIC   = "./public";

// ── Boost limits Discord ──────────────────────────────
const BOOST_LIMITS = { 0:25*1024*1024, 1:50*1024*1024, 2:100*1024*1024, 3:500*1024*1024 };
const BOOST_LABELS = { 0:"25 MB",      1:"50 MB",      2:"100 MB",       3:"500 MB" };

// ── Cache TTL en mémoire ──────────────────────────────
const _cache = new Map();
function cacheGet(k) {
  const e = _cache.get(k);
  if (!e) return null;
  if (Date.now() > e.exp) { _cache.delete(k); return null; }
  return e.data;
}
function cacheSet(k, data, ttlMs) { _cache.set(k, { data, exp: Date.now() + ttlMs }); }
function cacheDel(pattern) { for (const k of _cache.keys()) if (k.includes(pattern)) _cache.delete(k); }

// ── Rate-limiting simple par IP ───────────────────────
const _rl = new Map();
function allowRequest(ip, endpoint, max = 30, winMs = 60_000) {
  const k   = `${ip}:${endpoint}`;
  const now = Date.now();
  let e = _rl.get(k) ?? { n: 0, reset: now + winMs };
  if (now > e.reset) e = { n: 0, reset: now + winMs };
  e.n++;
  _rl.set(k, e);
  return e.n <= max;
}

// ── Persistance config / templates (Bun.file) ─────────
async function loadCfg()  { try { return JSON.parse(await Bun.file(CFG_PATH).text()); } catch { return {}; } }
async function saveCfg(d) { await Bun.write(CFG_PATH, JSON.stringify(d, null, 2)); }
async function loadTpl()  { try { return JSON.parse(await Bun.file(TPL_PATH).text()); } catch { return []; } }
async function saveTpl(d) { await Bun.write(TPL_PATH, JSON.stringify(d, null, 2)); }

// ── Helpers réponse ───────────────────────────────────
const j = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" }
});

// ── Validation ────────────────────────────────────────
const isSnowflake = v => typeof v === "string" && /^\d{17,21}$/.test(v);
const isLocalhost = req => {
  const host = (req.headers.get("host") || "").split(":")[0];
  return ["localhost", "127.0.0.1", "::1"].includes(host);
};

// ── Discord API helper (fetch natif Bun, retry 429) ───
async function discord(method, endpoint, token, body = null, _retry = 0) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const headers = { Authorization: `Bot ${token}`, "User-Agent": "DiscordBotSpeaker/2.0.0" };
    if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

    const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
      method,
      signal: ctrl.signal,
      headers,
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined
    });

    if (res.status === 429 && _retry < 3) {
      const jj = await res.json().catch(() => ({}));
      await new Promise(r => setTimeout(r, (jj.retry_after || 1) * 1000));
      return discord(method, endpoint, token, body, _retry + 1);
    }
    if (res.status === 204) return { status: 204, data: { ok: true } };
    const data = await res.json();
    return { status: res.status, data };
  } catch (err) {
    if (err.name === "AbortError") return { status: 504, data: { error: "Timeout Discord API (12s)" } };
    return { status: 503, data: { error: "Discord inaccessible", detail: err.message } };
  } finally {
    clearTimeout(timer);
  }
}

// ═══════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════
async function handle(req) {
  const url    = new URL(req.url);
  const path   = url.pathname;
  const method = req.method;
  const q      = url.searchParams;
  const ip     = req.headers.get("x-forwarded-for") || "local";

  // ── Sécurité : API locale uniquement ──────────────
  if (path.startsWith("/api/") && !isLocalhost(req))
    return j({ error: "Accès local uniquement" }, 403);

  // ── Fichiers statiques ────────────────────────────
  if (!path.startsWith("/api/")) {
    const fp   = path === "/" ? "/index.html" : path;
    const file = Bun.file(`${PUBLIC}${fp}`);
    if (await file.exists()) {
      // Type MIME simple
      const ext = fp.split(".").pop();
      const mimes = { html:"text/html;charset=utf-8", css:"text/css", js:"application/javascript", json:"application/json", svg:"image/svg+xml", png:"image/png", ico:"image/x-icon" };
      return new Response(file, { headers: { "Content-Type": mimes[ext] || "application/octet-stream" } });
    }
    return new Response("Not Found", { status: 404 });
  }

  // ══════════════════════════════════════════════════
  // CONFIG
  // ══════════════════════════════════════════════════
  if (path === "/api/config") {
    if (method === "GET")  return j(await loadCfg());
    if (method === "POST") { await saveCfg(await req.json()); return j({ ok: true }); }
  }

  // ══════════════════════════════════════════════════
  // TEMPLATES
  // ══════════════════════════════════════════════════
  if (path === "/api/templates") {
    if (method === "GET")  return j(await loadTpl());
    if (method === "POST") {
      const body = await req.json();
      const tpls = await loadTpl();
      const tpl  = { id: Date.now().toString(), ...body, createdAt: new Date().toISOString() };
      tpls.unshift(tpl);
      await saveTpl(tpls);
      return j(tpl);
    }
  }
  const tplM = path.match(/^\/api\/templates\/(\d+)$/);
  if (tplM && method === "DELETE") {
    const tpls = (await loadTpl()).filter(t => t.id !== tplM[1]);
    await saveTpl(tpls);
    return j({ ok: true });
  }

  // ══════════════════════════════════════════════════
  // BOT INFO
  // ══════════════════════════════════════════════════
  if (path === "/api/me" && method === "GET") {
    const token = q.get("token");
    if (!token) return j({ error: "Token manquant" }, 400);
    if (!allowRequest(ip, "me")) return j({ error: "Trop de requêtes" }, 429);
    const key = `me:${token}`;
    const hit = cacheGet(key);
    if (hit) return j(hit);
    const r = await discord("GET", "/users/@me", token);
    if (r.status === 200) cacheSet(key, r.data, 5 * 60_000);
    return j(r.data, r.status);
  }

  // ══════════════════════════════════════════════════
  // GUILDS
  // ══════════════════════════════════════════════════
  if (path === "/api/guilds" && method === "GET") {
    const token = q.get("token");
    if (!token) return j({ error: "Token manquant" }, 400);
    const key = `guilds:${token}`;
    const hit = cacheGet(key);
    if (hit) return j(hit);
    const r = await discord("GET", "/users/@me/guilds", token);
    if (r.status === 200) cacheSet(key, r.data, 2 * 60_000);
    return j(r.data, r.status);
  }

  // ══════════════════════════════════════════════════
  // CHANNELS (avec catégories)
  // ══════════════════════════════════════════════════
  if (path === "/api/channels" && method === "GET") {
    const token   = q.get("token");
    const guildId = q.get("guildId");
    if (!token || !guildId)       return j({ error: "Paramètres manquants" }, 400);
    if (!isSnowflake(guildId))    return j({ error: "guildId invalide" }, 400);
    const key = `channels:${guildId}`;
    const hit = cacheGet(key);
    if (hit) return j(hit);
    const [chanR, guildR] = await Promise.all([
      discord("GET", `/guilds/${guildId}/channels`, token),
      discord("GET", `/guilds/${guildId}`, token)
    ]);
    const result = {
      channels: chanR.data,
      guild: { premium_tier: guildR.data.premium_tier ?? 0, name: guildR.data.name, icon: guildR.data.icon, id: guildR.data.id }
    };
    if (chanR.status === 200) cacheSet(key, result, 2 * 60_000);
    return j(result, chanR.status);
  }

  // ── Édition salon ────────────────────────────────
  const channelIdM = path.match(/^\/api\/channel\/(\d+)$/);
  if (channelIdM) {
    const channelId = channelIdM[1];
    if (method === "GET") {
      const token = q.get("token");
      if (!token || !isSnowflake(channelId)) return j({ error: "Paramètre invalide" }, 400);
      const r = await discord("GET", `/channels/${channelId}`, token);
      return j(r.data, r.status);
    }
    if (method === "PATCH") {
      const body = await req.json();
      const { token, name, topic, slowmode, nsfw } = body;
      if (!token || !isSnowflake(channelId)) return j({ error: "Paramètre invalide" }, 400);
      const payload = {};
      if (name     !== undefined) payload.name               = String(name).slice(0, 100).toLowerCase().replace(/\s+/g, "-");
      if (topic    !== undefined) payload.topic              = String(topic).slice(0, 1024);
      if (slowmode !== undefined) payload.rate_limit_per_user = Math.min(Math.max(0, parseInt(slowmode) || 0), 21_600);
      if (nsfw     !== undefined) payload.nsfw               = !!nsfw;
      cacheDel("channels:");
      const r = await discord("PATCH", `/channels/${channelId}`, token, payload);
      return j(r.data, r.status);
    }
  }

  // ══════════════════════════════════════════════════
  // GUILD LIMIT
  // ══════════════════════════════════════════════════
  if (path === "/api/guild-limit" && method === "GET") {
    const token   = q.get("token");
    const guildId = q.get("guildId");
    if (!token || !guildId) return j({ error: "Paramètres manquants" }, 400);
    if (!isSnowflake(guildId)) return j({ error: "guildId invalide" }, 400);
    const key = `limit:${guildId}`;
    const hit = cacheGet(key);
    if (hit) return j(hit);
    const r = await discord("GET", `/guilds/${guildId}`, token);
    if (r.status !== 200) return j(r.data, r.status);
    const tier = r.data.premium_tier ?? 0;
    const result = { tier, limitBytes: BOOST_LIMITS[tier], limitLabel: BOOST_LABELS[tier], boosts: r.data.premium_subscription_count ?? 0 };
    cacheSet(key, result, 5 * 60_000);
    return j(result);
  }

  // ══════════════════════════════════════════════════
  // EMOJIS
  // ══════════════════════════════════════════════════
  if (path === "/api/emojis" && method === "GET") {
    const token   = q.get("token");
    const guildId = q.get("guildId");
    if (!token || !guildId) return j({ error: "Paramètres manquants" }, 400);
    if (!isSnowflake(guildId)) return j({ error: "guildId invalide" }, 400);
    const key = `emojis:${guildId}`;
    const hit = cacheGet(key);
    if (hit) return j(hit);
    const r = await discord("GET", `/guilds/${guildId}/emojis`, token);
    if (r.status === 200) cacheSet(key, r.data, 5 * 60_000);
    return j(r.data, r.status);
  }

  // ══════════════════════════════════════════════════
  // MESSAGES (avec pagination)
  // ══════════════════════════════════════════════════
  if (path === "/api/messages" && method === "GET") {
    const token     = q.get("token");
    const channelId = q.get("channelId");
    const before    = q.get("before");
    if (!token || !channelId) return j({ error: "Paramètres manquants" }, 400);
    if (!isSnowflake(channelId)) return j({ error: "channelId invalide" }, 400);
    let ep = `/channels/${channelId}/messages?limit=50`;
    if (before && isSnowflake(before)) ep += `&before=${before}`;
    const r = await discord("GET", ep, token);
    return j(r.data, r.status);
  }

  // ══════════════════════════════════════════════════
  // PINS
  // ══════════════════════════════════════════════════
  const pinsM = path.match(/^\/api\/pins\/(\d+)$/);
  if (pinsM && method === "GET") {
    const channelId = pinsM[1];
    const token     = q.get("token");
    if (!token || !isSnowflake(channelId)) return j({ error: "Paramètre invalide" }, 400);
    const r = await discord("GET", `/channels/${channelId}/pins`, token);
    return j(r.data, r.status);
  }

  // ══════════════════════════════════════════════════
  // MEMBERS (liste des membres du serveur)
  // ══════════════════════════════════════════════════
  const membersM = path.match(/^\/api\/members\/(\d+)$/);
  if (membersM && method === "GET") {
    const guildId = membersM[1];
    const token   = q.get("token");
    if (!token || !isSnowflake(guildId)) return j({ error: "Paramètre invalide" }, 400);
    const key = `members:${guildId}`;
    const hit = cacheGet(key);
    if (hit) return j(hit);
    const r = await discord("GET", `/guilds/${guildId}/members?limit=100`, token);
    if (r.status === 200) cacheSet(key, r.data, 2 * 60_000);
    return j(r.data, r.status);
  }

  // ══════════════════════════════════════════════════
  // SLASH COMMANDS (bot courant)
  // ══════════════════════════════════════════════════
  if (path === "/api/slash-commands" && method === "GET") {
    const token   = q.get("token");
    const appId   = q.get("appId");
    const guildId = q.get("guildId");
    if (!token || !appId) return j({ error: "Paramètres manquants" }, 400);
    if (!isSnowflake(appId)) return j({ error: "appId invalide" }, 400);

    const globalKey = `slash:${appId}`;
    const globalHit = cacheGet(globalKey);

    let globalCmds = globalHit;
    if (!globalCmds) {
      const r = await discord("GET", `/applications/${appId}/commands`, token);
      if (r.status === 200) { cacheSet(globalKey, r.data, 10 * 60_000); globalCmds = r.data; }
      else globalCmds = [];
    }

    let guildCmds = [];
    if (guildId && isSnowflake(guildId)) {
      const guildKey = `slash:${appId}:${guildId}`;
      const guildHit = cacheGet(guildKey);
      if (guildHit) {
        guildCmds = guildHit;
      } else {
        const r = await discord("GET", `/applications/${appId}/guilds/${guildId}/commands`, token);
        if (r.status === 200) { cacheSet(guildKey, r.data, 10 * 60_000); guildCmds = r.data; }
      }
    }

    return j({ global: globalCmds, guild: guildCmds });
  }

  // ══════════════════════════════════════════════════
  // INTEGRATIONS (bots dans le serveur)
  // ══════════════════════════════════════════════════
  if (path === "/api/integrations" && method === "GET") {
    const token   = q.get("token");
    const guildId = q.get("guildId");
    if (!token || !guildId) return j({ error: "Paramètres manquants" }, 400);
    if (!isSnowflake(guildId)) return j({ error: "guildId invalide" }, 400);
    const key = `integrations:${guildId}`;
    const hit = cacheGet(key);
    if (hit) return j(hit);
    const r = await discord("GET", `/guilds/${guildId}/integrations`, token);
    if (r.status === 200) cacheSet(key, r.data, 5 * 60_000);
    return j(r.data, r.status);
  }

  // ══════════════════════════════════════════════════
  // ENVOI MESSAGE + FICHIERS
  // ══════════════════════════════════════════════════
  if (path === "/api/send" && method === "POST") {
    let token, channelId, content, guildId, replyTo, embeds;
    let files = [];

    const ct = req.headers.get("content-type") || "";

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      token     = fd.get("token");
      channelId = fd.get("channelId");
      content   = fd.get("content");
      guildId   = fd.get("guildId");
      replyTo   = fd.get("replyTo");
      embeds    = fd.get("embeds");
      for (const [, v] of fd.entries()) { if (v instanceof File && v.size > 0) files.push(v); }
    } else {
      const b = await req.json();
      ({ token, channelId, content, guildId, replyTo, embeds } = b);
    }

    if (!token || !channelId) return j({ error: "Paramètres manquants" }, 400);
    if (!isSnowflake(channelId)) return j({ error: "channelId invalide" }, 400);
    if (!content && files.length === 0 && !embeds) return j({ error: "Rien à envoyer" }, 400);

    // Vérification taille fichiers
    if (files.length > 0 && guildId && isSnowflake(guildId)) {
      const guildR = await discord("GET", `/guilds/${guildId}`, token);
      if (guildR.status !== 200) return j(guildR.data, guildR.status);
      const tier  = guildR.data?.premium_tier ?? 0;
      const limit = BOOST_LIMITS[tier];
      const tooBig = files.filter(f => f.size > limit);
      if (tooBig.length > 0) {
        return j({
          error: "Fichier(s) trop volumineux",
          detail: tooBig.map(f => `"${f.name}" (${(f.size/1024/1024).toFixed(1)} MB)`).join(", "),
          limitLabel: BOOST_LABELS[tier], tier,
          files: tooBig.map(f => ({ name: f.name, sizeMB: (f.size/1024/1024).toFixed(1) }))
        }, 413);
      }
    }

    if (files.length === 0) {
      const payload = {};
      if (content) payload.content = content;
      if (replyTo) payload.message_reference = { message_id: replyTo, fail_if_not_exists: false };
      if (embeds)  payload.embeds = JSON.parse(embeds);
      const r = await discord("POST", `/channels/${channelId}/messages`, token, payload);
      return j(r.data, r.status);
    }

    // Avec fichiers — FormData natif Bun
    const form = new FormData();
    const payload = {};
    if (content) payload.content = content;
    if (replyTo) payload.message_reference = { message_id: replyTo, fail_if_not_exists: false };
    if (embeds)  payload.embeds = JSON.parse(embeds);
    form.append("payload_json", JSON.stringify(payload));
    files.forEach((f, i) => form.append(`files[${i}]`, f, f.name));

    const r = await discord("POST", `/channels/${channelId}/messages`, token, form);
    return j(r.data, r.status);
  }

  // ══════════════════════════════════════════════════
  // ÉDITER UN MESSAGE
  // ══════════════════════════════════════════════════
  if (path === "/api/message" && method === "PATCH") {
    const { token, channelId, messageId, content, embeds } = await req.json();
    if (!token || !channelId || !messageId) return j({ error: "Paramètres manquants" }, 400);
    if (!isSnowflake(channelId) || !isSnowflake(messageId)) return j({ error: "ID invalide" }, 400);
    const payload = {};
    if (content !== undefined) payload.content = content;
    if (embeds  !== undefined) payload.embeds  = embeds;
    const r = await discord("PATCH", `/channels/${channelId}/messages/${messageId}`, token, payload);
    return j(r.data, r.status);
  }

  // ══════════════════════════════════════════════════
  // SUPPRIMER UN MESSAGE
  // ══════════════════════════════════════════════════
  if (path === "/api/message" && method === "DELETE") {
    const token     = q.get("token");
    const channelId = q.get("channelId");
    const messageId = q.get("messageId");
    if (!token || !channelId || !messageId) return j({ error: "Paramètres manquants" }, 400);
    if (!isSnowflake(channelId) || !isSnowflake(messageId)) return j({ error: "ID invalide" }, 400);
    const r = await discord("DELETE", `/channels/${channelId}/messages/${messageId}`, token);
    return j(r.data, r.status);
  }

  // ══════════════════════════════════════════════════
  // SONDAGE
  // ══════════════════════════════════════════════════
  if (path === "/api/poll" && method === "POST") {
    const { token, channelId, question, answers, duration, allow_multiselect } = await req.json();
    if (!token || !channelId) return j({ error: "Paramètres manquants" }, 400);
    if (!question || !answers || answers.length < 2) return j({ error: "Question + 2 réponses minimum" }, 400);
    const r = await discord("POST", `/channels/${channelId}/messages`, token, {
      poll: {
        question: { text: question.slice(0, 300) },
        answers: answers.filter(a => a.text?.trim()).map(a => {
          const media = { text: a.text.trim().slice(0, 55) };
          if (a.emoji) media.emoji = a.emojiId ? { id: a.emojiId, name: a.emoji } : { name: a.emoji };
          return { poll_media: media };
        }),
        duration: [1,4,8,24,72,168].includes(parseInt(duration)) ? parseInt(duration) : 24,
        allow_multiselect: !!allow_multiselect
      }
    });
    return j(r.data, r.status);
  }

  if (path === "/api/poll/end" && method === "POST") {
    const { token, channelId, messageId } = await req.json();
    if (!token || !channelId || !messageId) return j({ error: "Paramètres manquants" }, 400);
    const r = await discord("POST", `/channels/${channelId}/polls/${messageId}/expire`, token);
    return j(r.data, r.status);
  }

  // ══════════════════════════════════════════════════
  // COMPONENTS V2
  // ══════════════════════════════════════════════════
  if (path === "/api/send-components" && method === "POST") {
    const { token, channelId, components } = await req.json();
    if (!channelId) return j({ error: "channelId manquant" }, 400);
    if (!components || !Array.isArray(components) || components.length === 0)
      return j({ error: "Aucun composant fourni" }, 400);
    const r = await discord("POST", `/channels/${channelId}/messages`, token, { flags: 1 << 15, components });
    return j(r.data, r.status);
  }

  // ══════════════════════════════════════════════════
  // VIDEO PROXY (contourne CORS Discord CDN)
  // ══════════════════════════════════════════════════
  if (path === "/api/video-proxy" && method === "GET") {
    const videoUrl = q.get("url");
    if (!videoUrl) return j({ error: "url manquante" }, 400);
    let parsed;
    try { parsed = new URL(videoUrl); } catch { return j({ error: "URL invalide" }, 400); }
    const allowed = ["cdn.discordapp.com", "media.discordapp.net", "cdn.discord.com"];
    if (!allowed.includes(parsed.hostname)) return j({ error: "Domaine non autorisé" }, 403);

    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30_000);
    try {
      const upstream = await fetch(videoUrl, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!upstream.ok) return new Response(null, { status: upstream.status });
      const resHeaders = {
        "Content-Type"  : upstream.headers.get("content-type") || "video/mp4",
        "Accept-Ranges" : "bytes",
        "Cache-Control" : "private, max-age=300"
      };
      const cl = upstream.headers.get("content-length");
      if (cl) resHeaders["Content-Length"] = cl;
      return new Response(upstream.body, { headers: resHeaders });
    } catch (err) {
      clearTimeout(timer);
      return new Response(null, { status: err.name === "AbortError" ? 504 : 503 });
    }
  }

  return j({ error: "Route inconnue" }, 404);
}

// ═══════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════
Bun.serve({
  port: PORT,
  fetch: handle,
  error(err) {
    console.error("❌", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});

console.log(`\n🐰 DiscordBotSpeaker v2.0.0 (Bun ${Bun.version}) → http://localhost:${PORT}\n`);
