import { discord } from "../lib/discord.ts";
import { json, err } from "../lib/response.ts";
import { isSnowflake } from "../lib/validate.ts";
import * as cache from "../lib/cache.ts";

export async function handleGetSlashCommands(url: URL): Promise<Response> {
  const token   = url.searchParams.get("token");
  const appId   = url.searchParams.get("appId");
  const guildId = url.searchParams.get("guildId");
  if (!token || !appId) return err("Paramètres manquants");
  if (!isSnowflake(appId)) return err("appId invalide");

  const key = `slash:${appId}:${guildId ?? "global"}`;
  const hit = cache.get(key);
  if (hit) return json(hit);

  const [globalR, guildR] = await Promise.all([
    discord.get(`/applications/${appId}/commands`, token),
    guildId && isSnowflake(guildId)
      ? discord.get(`/applications/${appId}/guilds/${guildId}/commands`, token)
      : Promise.resolve({ status: 200, data: [] }),
  ]);

  const result = {
    global: globalR.status === 200 ? globalR.data : [],
    guild:  guildR.status  === 200 ? guildR.data  : [],
  };
  cache.set(key, result, 60_000);
  return json(result, 200);
}

export async function handleGetIntegrations(url: URL): Promise<Response> {
  const token   = url.searchParams.get("token");
  const guildId = url.searchParams.get("guildId");
  if (!token || !guildId)    return err("Paramètres manquants");
  if (!isSnowflake(guildId)) return err("guildId invalide");

  const key = `integrations:${guildId}`;
  const hit = cache.get(key);
  if (hit) return json(hit);

  const r = await discord.get(`/guilds/${guildId}/integrations`, token);
  if (r.status === 200) cache.set(key, r.data, 5 * 60_000);
  return json(r.data, r.status);
}

export async function handleGetMembers(url: URL, guildId: string): Promise<Response> {
  const token = url.searchParams.get("token");
  if (!token || !isSnowflake(guildId)) return err("Paramètre invalide");
  const r = await discord.get(`/guilds/${guildId}/members?limit=100`, token);
  return json(r.data, r.status);
}
