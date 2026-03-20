import { err } from "./lib/response.ts";
import { isLocalhost } from "./lib/validate.ts";
import * as rl from "./lib/ratelimit.ts";

// ── Route handlers ────────────────────────────────────
import { handleGetConfig, handlePostConfig }               from "./routes/config.ts";
import { handlePatchMe, handleSetPresence }                from "./routes/bot.ts";
import { handleGetMe, handleGetGuilds, handleGetRoles, handlePatchGuild } from "./routes/guilds.ts";
import {
  handleGetChannels, handleGetChannel, handlePatchChannel,
  handleGetGuildLimit, handleGetEmojis, handlePatchGuildChannels
}                                                          from "./routes/channels.ts";
import {
  handleGetMessages, handlePatchMessage,
  handleDeleteMessage, handleGetPins,
}                                                          from "./routes/messages.ts";
import { handleSend, handleSendComponents }                from "./routes/send.ts";
import { handleSendPoll, handleEndPoll }                   from "./routes/polls.ts";
import {
  handleGetTemplates, handlePostTemplate, handleDeleteTemplate,
}                                                          from "./routes/templates.ts";
import {
  handleGetSlashCommands, handleGetIntegrations, handleGetMembers,
}                                                          from "./routes/slash.ts";
import { handleVideoProxy }                                from "./routes/media.ts";
import { handleCreateDM, handleSearchUsers, handleGetDMs }               from "./routes/users.ts";

// ── Pattern matching ──────────────────────────────────
const match = (pattern: RegExp, path: string): RegExpMatchArray | null =>
  path.match(pattern);

// ── Router ────────────────────────────────────────────
export async function router(req: Request): Promise<Response> {
  const url    = new URL(req.url);
  const path   = url.pathname;
  const method = req.method;
  const ip     = req.headers.get("x-forwarded-for") ?? "local";

  // Enforce localhost-only for /api/*
  if (path.startsWith("/api/") && !isLocalhost(req)) {
    return err("Accès refusé (localhost uniquement)", 403);
  }

  // Global rate limit
  if (!rl.allow(ip, "global", 120, 60_000)) {
    return err("Trop de requêtes", 429);
  }

  // ── API routes ────────────────────────────────────
  if (path === "/api/config") {
    return method === "GET" ? handleGetConfig() : handlePostConfig(req);
  }

  let m: RegExpMatchArray | null;

  if (path === "/api/me"     && method === "GET") return handleGetMe(url, req);
  if (path === "/api/bot/profile" && method === "PATCH") return handlePatchMe(req);
  if (path === "/api/bot/presence"&& method === "POST") return handleSetPresence(req);
  if (path === "/api/guilds" && method === "GET") return handleGetGuilds(url);

  if ((m = match(/^\/api\/guild\/(\d+)$/, path)) && method === "PATCH") return handlePatchGuild(req, m[1]);

  if ((m = match(/^\/api\/roles\/(\d+)$/, path)) && method === "GET") return handleGetRoles(url, m[1]);

  if (path === "/api/channels"   && method === "GET") return handleGetChannels(url);
  if (path === "/api/guild-limit"&& method === "GET") return handleGetGuildLimit(url);
  if (path === "/api/emojis"     && method === "GET") return handleGetEmojis(url);

  if ((m = match(/^\/api\/channel\/(\d+)$/, path))) {
    return method === "GET"
      ? handleGetChannel(url, m[1])
      : handlePatchChannel(req, m[1]);
  }
  
  if ((m = match(/^\/api\/guild-channels\/(\d+)$/, path))) {
    return method === "PATCH" ? handlePatchGuildChannels(req, m[1]) : err("Bad method", 405);
  }

  if (path === "/api/messages" && method === "GET")    return handleGetMessages(url);
  if (path === "/api/message") {
    if (method === "PATCH")  return handlePatchMessage(req);
    if (method === "DELETE") return handleDeleteMessage(url);
  }

  if ((m = match(/^\/api\/pins\/(\d+)$/, path)) && method === "GET") {
    return handleGetPins(url, m[1]);
  }

  if (path === "/api/send")            return handleSend(req);
  if (path === "/api/send-components") return handleSendComponents(req);

  if (path === "/api/poll"     && method === "POST") return handleSendPoll(req);
  if (path === "/api/poll/end" && method === "POST") return handleEndPoll(req);

  if (path === "/api/templates") {
    if (method === "GET")  return handleGetTemplates();
    if (method === "POST") return handlePostTemplate(req);
  }
  if ((m = match(/^\/api\/templates\/(.+)$/, path)) && method === "DELETE") {
    return handleDeleteTemplate(m[1]);
  }

  if (path === "/api/slash-commands" && method === "GET") return handleGetSlashCommands(url);
  if (path === "/api/integrations"   && method === "GET") return handleGetIntegrations(url);
  if ((m = match(/^\/api\/members\/(\d+)$/, path))  && method === "GET") {
    return handleGetMembers(url, m[1]);
  }

  if (path === "/api/video-proxy" && method === "GET")  return handleVideoProxy(url);
  if (path === "/api/dm"          && method === "POST") return handleCreateDM(req);
  if (path === "/api/dms"         && method === "GET")  return handleGetDMs(url);
  if (path === "/api/users/search"&& method === "GET")  return handleSearchUsers(url);

  // 404 on unknown /api routes
  if (path.startsWith("/api/")) return err("Route introuvable", 404);

  // ── Static files ──────────────────────────────────
  return serveStatic(path);
}

// ── Static file server ────────────────────────────────
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".gif":  "image/gif",
  ".webp": "image/webp",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
};

async function serveStatic(path: string): Promise<Response> {
  let filePath = `./public${path === "/" ? "/index.html" : path}`;
  // fallback to index.html for SPA-style navigation
  if (!filePath.includes(".")) filePath = "./public/index.html";

  const ext  = filePath.slice(filePath.lastIndexOf("."));
  const mime = MIME[ext] ?? "text/plain";

  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    const idx = Bun.file("./public/index.html");
    return new Response(idx, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  return new Response(file, {
    headers: { "Content-Type": mime, "Cache-Control": "public, max-age=3600" },
  });
}
