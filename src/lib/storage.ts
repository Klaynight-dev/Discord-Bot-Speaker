import type { AppConfig, MessageTemplate } from "../types/index.ts";

// ── Persistent JSON storage via Bun.file ─────────────
const CFG_PATH = "./config.json";
const TPL_PATH = "./templates.json";

export async function loadConfig(): Promise<AppConfig> {
  try {
    return JSON.parse(await Bun.file(CFG_PATH).text()) as AppConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(data: AppConfig): Promise<void> {
  await Bun.write(CFG_PATH, JSON.stringify(data, null, 2));
}

export async function loadTemplates(): Promise<MessageTemplate[]> {
  try {
    return JSON.parse(await Bun.file(TPL_PATH).text()) as MessageTemplate[];
  } catch {
    return [];
  }
}

export async function saveTemplates(data: MessageTemplate[]): Promise<void> {
  await Bun.write(TPL_PATH, JSON.stringify(data, null, 2));
}
