import { loadConfig, saveConfig } from "../lib/storage.ts";
import { ok } from "../lib/response.ts";

export async function handleGetConfig(): Promise<Response> {
  return ok(await loadConfig());
}

export async function handlePostConfig(req: Request): Promise<Response> {
  const body = await req.json();
  await saveConfig(body);
  return ok();
}
