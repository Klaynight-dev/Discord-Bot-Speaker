import { err } from "../lib/response.ts";

// Simple video proxy to avoid CORS issues
export async function handleVideoProxy(url: URL): Promise<Response> {
  const target = url.searchParams.get("url");
  if (!target) return err("URL manquante");

  try {
    const r = await fetch(target, { headers: { Range: "bytes=0-" } });
    const body = r.body;
    if (!body) return err("Flux vide");

    return new Response(body, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("Content-Type") ?? "video/mp4",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return err("Proxy échoué", 502);
  }
}
