// ── Discord Markdown renderer ─────────────────────────
import { esc } from "./utils.js";

export function renderMarkdown(text) {
  let s = esc(text);
  // Code blocks
  s = s.replace(/```([\s\S]+?)```/g, "<div class=\"md-pre\">$1</div>");
  s = s.replace(/`([^`]+)`/g, "<span class=\"md-code\">$1</span>");
  // Spoilers
  s = s.replace(/\|\|(.+?)\|\|/g, "<span class=\"md-spoiler\" onclick=\"this.classList.toggle('revealed')\">$1</span>");
  // Bold/italic
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/\*\*(.+?)\*\*/g,     "<strong>$1</strong>");
  s = s.replace(/__(.+?)__/g,         "<u>$1</u>");
  s = s.replace(/\*(.+?)\*/g,         "<em>$1</em>");
  s = s.replace(/_(.+?)_/g,           "<em>$1</em>");
  s = s.replace(/~~(.+?)~~/g,         "<s>$1</s>");
  // Quotes
  s = s.replace(/^&gt; (.+)$/gm, "<div class=\"md-quote\">$1</div>");
  // Mentions
  s = s.replace(/&lt;@\d+&gt;/g,       "<span class=\"md-mention\">@user</span>");
  s = s.replace(/&lt;#(\d+)&gt;/g,     "<span class=\"md-mention\">#channel</span>");
  s = s.replace(/&lt;@&amp;\d+&gt;/g,  "<span class=\"md-mention\">@role</span>");
  // Custom emoji
  s = s.replace(
    /&lt;a?:([^:]+):(\d+)&gt;/g,
    (_, n, id) => `<img src="https://cdn.discordapp.com/emojis/${id}.webp?size=24" style="width:22px;height:22px;vertical-align:-4px" alt=":${n}:">`
  );
  // Links
  s = s.replace(/(https?:\/\/[^\s<"]+)/g, "<a class=\"md-link\" href=\"$1\" target=\"_blank\" rel=\"noopener\">$1</a>");
  return s;
}
