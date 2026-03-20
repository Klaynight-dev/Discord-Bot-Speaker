// Minimal Discord Gateway client just for updating presence
const connections = new Map<string, WebSocket>();

export function updatePresence(token: string, presence: any): boolean {
  let ws = connections.get(token);
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    if (!ws) {
      ws = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");
      ws.onopen = () => {
        ws.send(JSON.stringify({
          op: 2,
          d: {
            token, intents: 0,
            properties: { os: "windows", browser: "DiscordBotSpeaker", device: "DiscordBotSpeaker" },
            presence
          }
        }));
      };
      ws.onmessage = (evt) => {
        const data = JSON.parse(evt.data.toString());
        if (data.op === 10) {
          const interval = data.d.heartbeat_interval;
          const pid = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 1, d: null })); }, interval);
          (ws as any)._heartbeat = pid;
        }
      };
      ws.onclose = () => { clearInterval((ws as any)._heartbeat); connections.delete(token); };
      connections.set(token, ws);
      return true;
    }
    return false;
  }
  
  ws.send(JSON.stringify({ op: 3, d: presence }));
  return true;
}
