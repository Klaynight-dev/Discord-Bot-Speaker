import { json, err } from "../lib/response.ts";
import { discord } from "../lib/discord.ts";
import * as gateway from "../lib/gateway.ts";
import * as cache from "../lib/cache.ts";

export async function handlePatchMe(req: Request): Promise<Response> {
  const body = await req.json() as { token: string; username?: string; avatar?: string; about_me?: string };
  if (!body.token) return err("Token manquant");
  const payload: any = {};
  if (body.username !== undefined) payload.username = body.username;
  if (body.avatar !== undefined) payload.avatar = body.avatar; // Data URI string expected
  if (body.about_me !== undefined) payload.about_me = body.about_me;
  
  const r = await discord.patch("/users/@me", body.token, payload);
  cache.del(`me:${body.token}`);
  return json(r.data, r.status);
}

export async function handleSetPresence(req: Request): Promise<Response> {
  const body = await req.json() as { token: string; status: string; activity_name?: string; activity_type?: number };
  if (!body.token || !body.status) return err("Paramètres manquants");
  
  gateway.updatePresence(body.token, {
    status: body.status,
    afk: false,
    since: body.status === "idle" ? Date.now() : null,
    activities: body.activity_name ? [{
      name: body.activity_name,
      type: body.activity_type ?? 0
    }] : []
  });
  
  return json({ ok: true });
}
