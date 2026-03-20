import { discord } from "../lib/discord.ts";
import { json, err } from "../lib/response.ts";
import { isSnowflake } from "../lib/validate.ts";
import { BOOST_LIMITS, BOOST_LABELS } from "./channels.ts";

export async function handleSend(req: Request): Promise<Response> {
  const ct = req.headers.get("content-type") ?? "";

  let token: string | null    = null;
  let channelId: string | null = null;
  let content: string | null  = null;
  let guildId: string | null  = null;
  let replyTo: string | null  = null;
  let embeds: string | null   = null;
  const files: File[] = [];

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    token     = fd.get("token") as string | null;
    channelId = fd.get("channelId") as string | null;
    content   = fd.get("content") as string | null;
    guildId   = fd.get("guildId") as string | null;
    replyTo   = fd.get("replyTo") as string | null;
    embeds    = fd.get("embeds") as string | null;
    for (const [, v] of fd.entries()) {
      const entry = v as unknown; if (entry instanceof File && entry.size > 0) files.push(entry);
    }
  } else {
    const b = await req.json() as Record<string, unknown>;
    token     = b.token     as string | null;
    channelId = b.channelId as string | null;
    content   = b.content   as string | null;
    guildId   = b.guildId   as string | null;
    replyTo   = b.replyTo   as string | null;
    embeds    = b.embeds    ? JSON.stringify(b.embeds) : null;
  }

  if (!token || !channelId) return err("Paramètres manquants");
  if (!isSnowflake(channelId)) return err("channelId invalide");
  if (!content && !files.length && !embeds) return err("Rien à envoyer");

  // File size check
  if (files.length > 0 && guildId && isSnowflake(guildId)) {
    const guildR = await discord.get(`/guilds/${guildId}`, token);
    if (guildR.status !== 200) return json(guildR.data, guildR.status);
    const tier  = ((guildR.data as Record<string, unknown>).premium_tier as number) ?? 0;
    const limit = BOOST_LIMITS[tier];
    const tooBig = files.filter(f => f.size > limit);
    if (tooBig.length > 0) {
      return json({
        error: "Fichier(s) trop volumineux",
        detail: tooBig.map(f => `"${f.name}" (${(f.size / 1048576).toFixed(1)} MB)`).join(", "),
        limitLabel: BOOST_LABELS[tier],
        tier,
        files: tooBig.map(f => ({ name: f.name, sizeMB: (f.size / 1048576).toFixed(1) })),
      }, 413);
    }
  }

  // Build message payload
  const buildPayload = () => {
    const p: Record<string, unknown> = {};
    if (content) p.content = content;
    if (replyTo) p.message_reference = { message_id: replyTo, fail_if_not_exists: false };
    if (embeds)  p.embeds = JSON.parse(embeds);
    return p;
  };

  if (files.length === 0) {
    const r = await discord.post(`/channels/${channelId}/messages`, token, buildPayload());
    return json(r.data, r.status);
  }

  // Multipart with files
  const form = new FormData();
  form.append("payload_json", JSON.stringify(buildPayload()));
  files.forEach((f, i) => form.append(`files[${i}]`, f, f.name));

  const r = await discord.upload(`/channels/${channelId}/messages`, token, form);
  return json(r.data, r.status);
}

export async function handleSendComponents(req: Request): Promise<Response> {
  const { token, channelId, components } = await req.json() as {
    token: string; channelId: string; components: unknown[];
  };
  if (!channelId) return err("channelId manquant");
  if (!components?.length) return err("Aucun composant fourni");
  const r = await discord.post(`/channels/${channelId}/messages`, token, { flags: 1 << 15, components });
  return json(r.data, r.status);
}
