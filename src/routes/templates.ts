import { loadTemplates, saveTemplates } from "../lib/storage.ts";
import { json, ok, err } from "../lib/response.ts";
import type { MessageTemplate } from "../types/index.ts";

export async function handleGetTemplates(): Promise<Response> {
  return json(await loadTemplates());
}

export async function handlePostTemplate(req: Request): Promise<Response> {
  const body = await req.json() as Omit<MessageTemplate, "id" | "createdAt">;
  if (!body.name?.trim()) return err("Nom requis");

  const tpls = await loadTemplates();
  const tpl: MessageTemplate = {
    id:        crypto.randomUUID(),
    name:      body.name.trim().slice(0, 40),
    type:      body.type ?? "msg",
    content:   body.content ?? "",
    embeds:    body.embeds ?? [],
    createdAt: new Date().toISOString(),
  };
  tpls.push(tpl);
  await saveTemplates(tpls);
  return json(tpl, 201);
}

export async function handleDeleteTemplate(id: string): Promise<Response> {
  const tpls = await loadTemplates();
  const idx  = tpls.findIndex(t => t.id === id);
  if (idx === -1) return err("Template introuvable", 404);
  tpls.splice(idx, 1);
  await saveTemplates(tpls);
  return ok();
}
