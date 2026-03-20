const express    = require('express');
const multer     = require('multer');
const fetch      = require('node-fetch');
const FormData   = require('form-data');
const path       = require('path');
const fs         = require('fs');

const app = express();
app.use(express.json());

// ── Compression gzip ──
try {
  const compression = require('compression');
  app.use(compression());
} catch {}

app.use(express.static(path.join(__dirname, 'public')));

// ── Protection : accès local uniquement ──
app.use('/api', (req, res, next) => {
  const host = (req.headers.host || '').split(':')[0];
  if (!['localhost', '127.0.0.1', '::1'].includes(host))
    return res.status(403).json({ error: 'Accès local uniquement' });
  next();
});

// ── Limite par niveau de boost Discord ──
const BOOST_LIMITS  = { 0:25*1024*1024, 1:50*1024*1024, 2:100*1024*1024, 3:500*1024*1024 };
const BOOST_LABELS  = { 0:'25 MB', 1:'50 MB', 2:'100 MB', 3:'500 MB' };

// ── Cache en mémoire avec TTL ──
const _cache = new Map();
function cacheGet(key) {
  const e = _cache.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) { _cache.delete(key); return null; }
  return e.data;
}
function cacheSet(key, data, ttlMs) {
  _cache.set(key, { data, exp: Date.now() + ttlMs });
}
function cacheInvalidate(pattern) {
  for (const k of _cache.keys()) if (k.includes(pattern)) _cache.delete(k);
}

// ── Multer ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 10, fileSize: 500 * 1024 * 1024 }
});

// ── Config persistante ──
const CFG_PATH = path.join(__dirname, 'config.json');
function loadCfg() { try { return JSON.parse(fs.readFileSync(CFG_PATH)); } catch { return {}; } }
function saveCfg(d) { fs.writeFileSync(CFG_PATH, JSON.stringify(d, null, 2)); }

// ── Templates persistants ──
const TPL_PATH = path.join(__dirname, 'templates.json');
function loadTpl() { try { return JSON.parse(fs.readFileSync(TPL_PATH)); } catch { return []; } }
function saveTpl(d) { fs.writeFileSync(TPL_PATH, JSON.stringify(d, null, 2)); }

// ── Helper Discord API — timeout 10s + retry sur 429 ──
async function discord(method, endpoint, token, body = null, extraHeaders = {}, _retry = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
      method,
      signal: controller.signal,
      headers: {
        Authorization: `Bot ${token}`,
        'User-Agent': 'DiscordBotSpeaker/1.4.0',
        ...extraHeaders,
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined
    });
    // Rate-limit : attendre et réessayer une fois
    if (res.status === 429 && _retry < 2) {
      const j = await res.json().catch(() => ({}));
      const wait = (j.retry_after || 1) * 1000;
      await new Promise(r => setTimeout(r, wait));
      return discord(method, endpoint, token, body, extraHeaders, _retry + 1);
    }
    if (res.status === 204) return { status: 204, data: { ok: true } };
    const json = await res.json();
    return { status: res.status, data: json };
  } catch (err) {
    if (err.name === 'AbortError')
      return { status: 504, data: { error: "Timeout — Discord API n'a pas répondu (10s)" } };
    return { status: 503, data: { error: 'Discord API inaccessible', detail: err.message } };
  } finally {
    clearTimeout(timer);
  }
}

// ── Routes config ──
app.get('/api/config',  (req, res) => res.json(loadCfg()));
app.post('/api/config', (req, res) => { saveCfg(req.body); res.json({ ok: true }); });

// ── Templates ──
app.get('/api/templates',          (req, res) => res.json(loadTpl()));
app.post('/api/templates',         (req, res) => {
  const tpls = loadTpl();
  const tpl  = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  tpls.unshift(tpl);
  saveTpl(tpls);
  res.json(tpl);
});
app.delete('/api/templates/:id',   (req, res) => {
  const tpls = loadTpl().filter(t => t.id !== req.params.id);
  saveTpl(tpls);
  res.json({ ok: true });
});

// ── Discord passthrough (avec cache) ──
app.get('/api/me', async (req, res) => {
  const { token } = req.query;
  const key = `me:${token}`;
  const cached = cacheGet(key);
  if (cached) return res.json(cached);
  const r = await discord('GET', '/users/@me', token);
  if (r.status === 200) cacheSet(key, r.data, 5 * 60 * 1000);
  res.status(r.status).json(r.data);
});

app.get('/api/guilds', async (req, res) => {
  const { token } = req.query;
  const key = `guilds:${token}`;
  const cached = cacheGet(key);
  if (cached) return res.json(cached);
  const r = await discord('GET', '/users/@me/guilds', token);
  if (r.status === 200) cacheSet(key, r.data, 2 * 60 * 1000);
  res.status(r.status).json(r.data);
});

app.get('/api/emojis', async (req, res) => {
  const { token, guildId } = req.query;
  const key = `emojis:${guildId}`;
  const cached = cacheGet(key);
  if (cached) return res.json(cached);
  const r = await discord('GET', `/guilds/${guildId}/emojis`, token);
  if (r.status === 200) cacheSet(key, r.data, 5 * 60 * 1000);
  res.status(r.status).json(r.data);
});

app.get('/api/messages', async (req, res) => {
  const { token, channelId } = req.query;
  const r = await discord('GET', `/channels/${channelId}/messages?limit=50`, token);
  res.status(r.status).json(r.data);
});

app.get('/api/channels', async (req, res) => {
  const { token, guildId } = req.query;
  const key = `channels:${guildId}`;
  const cached = cacheGet(key);
  if (cached) return res.json(cached);
  const [chanR, guildR] = await Promise.all([
    discord('GET', `/guilds/${guildId}/channels`, token),
    discord('GET', `/guilds/${guildId}`, token),
  ]);
  const result = {
    channels: chanR.data,
    guild: { premium_tier: guildR.data.premium_tier ?? 0, name: guildR.data.name }
  };
  if (chanR.status === 200) cacheSet(key, result, 2 * 60 * 1000);
  res.status(chanR.status).json(result);
});

app.get('/api/guild-limit', async (req, res) => {
  const { token, guildId } = req.query;
  const key = `limit:${guildId}`;
  const cached = cacheGet(key);
  if (cached) return res.json(cached);
  const r = await discord('GET', `/guilds/${guildId}`, token);
  if (r.status !== 200) return res.status(r.status).json(r.data);
  const tier = r.data.premium_tier ?? 0;
  const result = { tier, limitBytes: BOOST_LIMITS[tier], limitLabel: BOOST_LABELS[tier], boosts: r.data.premium_subscription_count ?? 0 };
  cacheSet(key, result, 5 * 60 * 1000);
  res.json(result);
});

// ── Envoi message + fichiers (+ reply + embed) ──
app.post('/api/send', upload.array('files', 10), async (req, res) => {
  const { token, channelId, content, guildId, replyTo, embeds } = req.body;
  const files = req.files || [];

  if (!content && files.length === 0 && !embeds)
    return res.status(400).json({ error: 'Rien à envoyer' });

  if (files.length > 0 && guildId) {
    const guildR = await discord('GET', `/guilds/${guildId}`, token);
    if (guildR.status !== 200) return res.status(guildR.status).json(guildR.data);
    const tier  = guildR.data?.premium_tier ?? 0;
    const limit = BOOST_LIMITS[tier];
    const tooBig = files.filter(f => f.size > limit);
    if (tooBig.length > 0) {
      return res.status(413).json({
        error: 'Fichier(s) trop volumineux',
        detail: tooBig.map(f => `"${f.originalname}" (${(f.size/1024/1024).toFixed(1)} MB)`).join(', '),
        limitLabel: BOOST_LABELS[tier], tier,
        files: tooBig.map(f => ({ name: f.originalname, sizeMB: (f.size/1024/1024).toFixed(1) }))
      });
    }
  }

  if (files.length === 0) {
    const payload = {};
    if (content)  payload.content = content;
    if (replyTo)  payload.message_reference = { message_id: replyTo, fail_if_not_exists: false };
    if (embeds)   payload.embeds = JSON.parse(embeds);
    const r = await discord('POST', `/channels/${channelId}/messages`, token, payload);
    return res.status(r.status).json(r.data);
  }

  const form = new FormData();
  const payload = {};
  if (content)  payload.content = content;
  if (replyTo)  payload.message_reference = { message_id: replyTo, fail_if_not_exists: false };
  if (embeds)   payload.embeds = JSON.parse(embeds);
  form.append('payload_json', JSON.stringify(payload));
  files.forEach((f, i) => form.append(`files[${i}]`, f.buffer, { filename: f.originalname, contentType: f.mimetype }));
  const r = await discord('POST', `/channels/${channelId}/messages`, token, form, form.getHeaders());
  res.status(r.status).json(r.data);
});

// ── Éditer un message ──
app.patch('/api/message', async (req, res) => {
  const { token, channelId, messageId, content, embeds } = req.body;
  if (!token || !channelId || !messageId)
    return res.status(400).json({ error: 'Paramètres manquants' });
  const payload = {};
  if (content !== undefined) payload.content = content;
  if (embeds  !== undefined) payload.embeds  = embeds;
  const r = await discord('PATCH', `/channels/${channelId}/messages/${messageId}`, token, payload);
  res.status(r.status).json(r.data);
});

// ── Supprimer un message ──
app.delete('/api/message', async (req, res) => {
  const { token, channelId, messageId } = req.query;
  if (!token || !channelId || !messageId)
    return res.status(400).json({ error: 'Paramètres manquants' });
  const r = await discord('DELETE', `/channels/${channelId}/messages/${messageId}`, token);
  res.status(r.status).json(r.data);
});

// ── Sondage natif Discord ──
app.post('/api/poll', async (req, res) => {
  const { token, channelId, question, answers, duration, allow_multiselect } = req.body;
  if (!question || !answers || answers.length < 2)
    return res.status(400).json({ error: 'Question + 2 réponses minimum' });
  const body = {
    poll: {
      question: { text: question.slice(0, 300) },
      answers: answers.filter(a => a.text?.trim()).map(a => {
        const media = { text: a.text.trim().slice(0, 55) };
        if (a.emoji) {
          if (a.emojiId) media.emoji = { id: a.emojiId, name: a.emoji };
          else           media.emoji = { name: a.emoji };
        }
        return { poll_media: media };
      }),
      duration: [1,4,8,24,72,168].includes(parseInt(duration)) ? parseInt(duration) : 24,
      allow_multiselect: !!allow_multiselect
    }
  };
  const r = await discord('POST', `/channels/${channelId}/messages`, token, body);
  res.status(r.status).json(r.data);
});

// ── Terminer un sondage ──
app.post('/api/poll/end', async (req, res) => {
  const { token, channelId, messageId } = req.body;
  const r = await discord('POST', `/channels/${channelId}/polls/${messageId}/expire`, token);
  res.status(r.status).json(r.data);
});

// ── Envoi Components V2 ──
app.post('/api/send-components', async (req, res) => {
  const { token, channelId, components } = req.body;
  if (!channelId) return res.status(400).json({ error: 'channelId manquant' });
  if (!components || !Array.isArray(components) || components.length === 0)
    return res.status(400).json({ error: 'Aucun composant fourni' });
  const r = await discord('POST', `/channels/${channelId}/messages`, token, {
    flags: 1 << 15,
    components
  });
  res.status(r.status).json(r.data);
});

// ── Proxy vidéo — contourne CORS/MIME de Waterfox sur les URLs Discord CDN ──
app.get('/api/video-proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url manquante' });
  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).json({ error: 'URL invalide' }); }
  const allowed = ['cdn.discordapp.com', 'media.discordapp.net', 'cdn.discord.com'];
  if (!allowed.includes(parsed.hostname)) return res.status(403).json({ error: 'Domaine non autorisé' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'DiscordBotSpeaker/1.4.0' }
    });
    if (!upstream.ok) return res.status(upstream.status).end();
    const ct = upstream.headers.get('content-type') || 'video/mp4';
    const cl = upstream.headers.get('content-length');
    res.setHeader('Content-Type', ct);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'private, max-age=300');
    if (cl) res.setHeader('Content-Length', cl);
    upstream.body.pipe(res);
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).end();
    res.status(503).end();
  } finally {
    clearTimeout(timer);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\n🐰 DiscordBotSpeaker v1.4.0 -> http://localhost:${PORT}\n`));
