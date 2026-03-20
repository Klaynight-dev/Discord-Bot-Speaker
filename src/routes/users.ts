import { json, err } from "../lib/response.ts";
import { discord } from "../lib/discord.ts";

export async function handleCreateDM(req: Request): Promise<Response> {
  const body = await req.json() as { token: string; recipient_id: string };
  if (!body.token || !body.recipient_id) return err("Paramètres manquants");
  
  const r = await discord.post("/users/@me/channels", body.token, { recipient_id: body.recipient_id });
  return json(r.data, r.status);
}

export async function handleGetDMs(url: URL): Promise<Response> {
  const token = url.searchParams.get("token");
  if (!token) return err("Token manquant");
  const r = await discord.get("/users/@me/channels", token);
  return json(r.data, r.status);
}

export async function handleSearchUsers(url: URL): Promise<Response> {
  const token = url.searchParams.get("token");
  const query = url.searchParams.get("q");
  if (!token) return err("Token manquant");
  if (!query || query.length < 2) return json([]);

  const rGuilds = await discord.get("/users/@me/guilds", token);
  if (rGuilds.status !== 200 || !Array.isArray(rGuilds.data)) return json([]);

  const guilds = rGuilds.data as { id: string }[];
  if (guilds.length === 0) return json([]);

  const promises = guilds.slice(0, 15).map(g =>
    discord.get(`/guilds/${g.id}/members/search?query=${encodeURIComponent(query)}&limit=5`, token)
  );
  
  const results = await Promise.all(promises);
  const usersMap = new Map();
  for (const r of results) {
    if (r.status === 200 && Array.isArray(r.data)) {
      for (const m of r.data) {
        if (m.user && !m.user.bot) {
          usersMap.set(m.user.id, m.user);
        }
      }
    }
  }
  
  return json(Array.from(usersMap.values()).slice(0, 15));
}
