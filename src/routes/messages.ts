import { discord } from "../lib/discord.ts";
import { json, err, ok } from "../lib/response.ts";
import { isSnowflake } from "../lib/validate.ts";

export async function handleGetMessages(url: URL): Promise<Response> {
  const token     = url.searchParams.get("token");
  const channelId = url.searchParams.get("channelId");
  const before    = url.searchParams.get("before");
  if (!token || !channelId)     return err("Paramètres manquants");
  if (!isSnowflake(channelId))  return err("channelId invalide");

  let ep = `/channels/${channelId}/messages?limit=50`;
  if (before && isSnowflake(before)) ep += `&before=${before}`;

  const r = await discord.get(ep, token);
  return json(r.data, r.status);
}

export async function handlePatchMessage(req: Request): Promise<Response> {
  const body = await req.json() as {
    token: string; channelId: string; messageId: string;
    content?: string; embeds?: unknown[];
  };
  const { token, channelId, messageId, content, embeds } = body;
  if (!token || !channelId || !messageId) return err("Paramètres manquants");
  if (!isSnowflake(channelId) || !isSnowflake(messageId)) return err("ID invalide");

  const payload: Record<string, unknown> = {};
  if (content !== undefined) payload.content = content;
  if (embeds  !== undefined) payload.embeds  = embeds;

  const r = await discord.patch(`/channels/${channelId}/messages/${messageId}`, token, payload);
  return json(r.data, r.status);
}

export async function handleDeleteMessage(url: URL): Promise<Response> {
  const token     = url.searchParams.get("token");
  const channelId = url.searchParams.get("channelId");
  const messageId = url.searchParams.get("messageId");
  if (!token || !channelId || !messageId) return err("Paramètres manquants");
  if (!isSnowflake(channelId) || !isSnowflake(messageId)) return err("ID invalide");

  const r = await discord.delete(`/channels/${channelId}/messages/${messageId}`, token);
  return r.status === 204 ? ok() : json(r.data, r.status);
}

export async function handleGetPins(url: URL, channelId: string): Promise<Response> {
  const token = url.searchParams.get("token");
  if (!token || !isSnowflake(channelId)) return err("Paramètre invalide");
  const r = await discord.get(`/channels/${channelId}/pins`, token);
  return json(r.data, r.status);
}
