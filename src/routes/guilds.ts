import { discord } from "../lib/discord.ts";
import { json, err } from "../lib/response.ts";
import * as cache from "../lib/cache.ts";
import * as rl from "../lib/ratelimit.ts";

export async function handleGetMe(url: URL, req: Request): Promise<Response> {
  const token = url.searchParams.get("token");
  if (!token) return err("Token manquant");
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rl.allow(ip, "me")) return err("Trop de requêtes", 429);

  const key = `me:${token}`;
  const hit = cache.get(key);
  if (hit) return json(hit);

  const r = await discord.get("/users/@me", token);
  if (r.status === 200) cache.set(key, r.data, 5 * 60_000);
  return json(r.data, r.status);
}

export async function handleGetGuilds(url: URL): Promise<Response> {
  const token = url.searchParams.get("token");
  if (!token) return err("Token manquant");

  const key = `guilds:${token}`;
  const hit = cache.get(key);
  if (hit) return json(hit);

  const r = await discord.get("/users/@me/guilds", token);
  if (r.status === 200) cache.set(key, r.data, 2 * 60_000);
  return json(r.data, r.status);
}

export async function handleGetRoles(url: URL, guildId: string): Promise<Response> {
  const token = url.searchParams.get("token");
  if (!token) return err("Token manquant");
  const key = `roles:${guildId}`;
  const hit = cache.get(key);
  if (hit) return json(hit);

  const r = await discord.get(`/guilds/${guildId}/roles`, token);
  if (r.status === 200) cache.set(key, r.data, 5 * 60_000);
  return json(r.data, r.status);
}

export async function handlePatchGuild(req: Request, guildId: string): Promise<Response> {
  const body = await req.json() as { token: string; name?: string; description?: string };
  if (!body.token) return err("Token manquant");
  const payload: Record<string, string> = {};
  if (body.name) payload.name = body.name;
  if (body.description) payload.description = body.description;
  const r = await discord.patch(`/guilds/${guildId}`, body.token, payload);
  cache.del(`guilds`);
  return json(r.data, r.status);
}
