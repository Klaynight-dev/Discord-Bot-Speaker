import { discord } from "../lib/discord.ts";
import { json, err, ok } from "../lib/response.ts";
import * as cache from "../lib/cache.ts";
import { isSnowflake } from "../lib/validate.ts";

const BOOST_LIMITS = [26214400, 52428800, 104857600, 524288000];
const BOOST_LABELS = ["25 MB", "50 MB", "100 MB", "500 MB"];

export async function handleGetChannels(url: URL): Promise<Response> {
  const token   = url.searchParams.get("token");
  const guildId = url.searchParams.get("guildId");
  if (!token || !guildId)     return err("Paramètres manquants");
  if (!isSnowflake(guildId))  return err("guildId invalide");

  const key = `channels:${guildId}`;
  const hit = cache.get(key);
  if (hit) return json(hit);

  const [chanR, guildR] = await Promise.all([
    discord.get(`/guilds/${guildId}/channels`, token),
    discord.get(`/guilds/${guildId}`, token),
  ]);

  const g = guildR.data as Record<string, unknown>;
  const result = {
    channels: chanR.data,
    guild: {
      premium_tier: (g.premium_tier as number) ?? 0,
      name: g.name,
      icon: g.icon,
      id:   g.id,
    },
  };
  if (chanR.status === 200) cache.set(key, result, 2 * 60_000);
  return json(result, chanR.status);
}

export async function handleGetChannel(url: URL, channelId: string): Promise<Response> {
  const token = url.searchParams.get("token");
  if (!token || !isSnowflake(channelId)) return err("Paramètre invalide");
  const r = await discord.get(`/channels/${channelId}`, token);
  return json(r.data, r.status);
}

export async function handlePatchChannel(req: Request, channelId: string): Promise<Response> {
  if (!isSnowflake(channelId)) return err("channelId invalide");
  const body = await req.json() as {
    token: string;
    name?: string;
    topic?: string;
    slowmode?: number;
    nsfw?: boolean;
  };
  if (!body.token) return err("Token manquant");

  const payload: Record<string, unknown> = {};
  if (body.name     != null) payload.name = String(body.name).slice(0, 100).toLowerCase().replace(/\s+/g, "-");
  if (body.topic    != null) payload.topic = String(body.topic).slice(0, 1024);
  if (body.slowmode != null) payload.rate_limit_per_user = Math.min(Math.max(0, Number(body.slowmode) | 0), 21_600);
  if (body.nsfw     != null) payload.nsfw = Boolean(body.nsfw);

  cache.del("channels:");
  const r = await discord.patch(`/channels/${channelId}`, body.token, payload);
  return json(r.data, r.status);
}

export async function handleGetGuildLimit(url: URL): Promise<Response> {
  const token   = url.searchParams.get("token");
  const guildId = url.searchParams.get("guildId");
  if (!token || !guildId)    return err("Paramètres manquants");
  if (!isSnowflake(guildId)) return err("guildId invalide");

  const key = `limit:${guildId}`;
  const hit = cache.get(key);
  if (hit) return json(hit);

  const r = await discord.get(`/guilds/${guildId}`, token);
  if (r.status !== 200) return json(r.data, r.status);

  const g = r.data as Record<string, unknown>;
  const tier = (g.premium_tier as number) ?? 0;
  const result = {
    tier,
    limitBytes: BOOST_LIMITS[tier],
    limitLabel: BOOST_LABELS[tier],
    boosts: (g.premium_subscription_count as number) ?? 0,
  };
  cache.set(key, result, 5 * 60_000);
  return json(result);
}

export async function handleGetEmojis(url: URL): Promise<Response> {
  const token   = url.searchParams.get("token");
  const guildId = url.searchParams.get("guildId");
  if (!token || !guildId)    return err("Paramètres manquants");
  if (!isSnowflake(guildId)) return err("guildId invalide");

  const key = `emojis:${guildId}`;
  const hit = cache.get(key);
  if (hit) return json(hit);

  const r = await discord.get(`/guilds/${guildId}/emojis`, token);
  cache.set(key, r.data, 5 * 60_000);
  return json(r.data, r.status);
}

export async function handlePatchGuildChannels(req: Request, guildId: string): Promise<Response> {
  const body = await req.json() as { token: string; positions: { id: string; position: number; parent_id?: string | null }[] };
  if (!body.token || !body.positions) return err("Paramètres manquants");
  if (!isSnowflake(guildId)) return err("guildId invalide");
  
  cache.del(`channels:${guildId}`);
  const r = await discord.patch(`/guilds/${guildId}/channels`, body.token, body.positions);
  return json(r.data, r.status);
}

// Re-export limits for use in send.ts
export { BOOST_LIMITS, BOOST_LABELS };
