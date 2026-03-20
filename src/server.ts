import { router } from "./router.ts";

// ── Entry point ───────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3000);

console.log(`\n🐰 DiscordBotSpeaker v2.0.0 (Bun ${Bun.version}) → http://localhost:${PORT}\n`);

Bun.serve({
  port: PORT,
  fetch: async (req) => {
    try {
      return await router(req);
    } catch (err) {
      console.error("[server]", err);
      return new Response(JSON.stringify({ error: "Erreur interne" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
  error(err) {
    console.error("[fatal]", err);
    return new Response(JSON.stringify({ error: "Serveur planté" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  },
});
