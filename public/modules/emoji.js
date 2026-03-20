// ── Emoji picker ──────────────────────────────────────
import { S } from "./state.js";
import { $ } from "./utils.js";

export const EMOJI_CATS = [
  { l:"😀", n:"Visages",  e:["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😚","🥲","😋","😛","😜","🤪","🤗","🤔","🤐","😑","😶","😏","😒","🙄","😬","🤥","😴","😷","🤒","🤕","🤢","🤧","🥵","🥶","😵","🥳","😈","👿","💀","💩","🤡","👻","👾","🤖"] },
  { l:"👋", n:"Gestes",   e:["👋","🤚","🖐","✋","🖖","👌","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","👍","👎","✊","👊","🤛","🤜","👏","🙌","🙏","✍️","💅","💪"] },
  { l:"❤️", n:"Coeurs",   e:["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝"] },
  { l:"🎉", n:"Fete",     e:["🎉","🎊","🎈","🎁","🎀","🏆","🥇","🥈","🥉","🏅","🎪","🎭","🎨","🎬","🎤","🎧","🎵","🎶","🎹","🥁","🎷","🎺","🎸","🎻","🎲","🎯","🎮","🧩"] },
  { l:"🐱", n:"Animaux",  e:["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🦆","🦅","🦉","🦇","🐴","🦄","🐢","🐍","🐙","🐬","🐳","🦈","🐘"] },
  { l:"🍕", n:"Food",     e:["🍏","🍎","🍊","🍋","🍌","🍉","🍇","🍓","🍒","🍑","🥭","🍍","🥝","🍅","🥑","🥦","🌽","🧄","🧅","🥔","🍞","🥚","🍳","🥞","🥓","🍗","🍖","🌭","🍔","🍟","🍕","🎂","🍰","🧁","🍩","🍪","🍫","☕","🍵"] },
  { l:"⚽", n:"Sport",    e:["⚽","🏀","🏈","⚾","🎾","🏐","🏒","⛳","🎣","🥊","🥋","🎽","🛹","⛸","🏆","🥇"] },
  { l:"🚀", n:"Objets",   e:["🚀","🛸","🌍","🌙","⭐","🌟","💫","⚡","☄️","💥","🔥","🌈","☀️","💧","🌊","💎","🔮","📱","💻","🖥","💡","🔦","📷","📸","🎥","🔭","🔬"] },
  { l:"✅", n:"Symboles", e:["✅","❎","🆗","🆙","🆒","🆕","🆓","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","⚠️","🚫","💯","♻️","✔️","⚙️","🔧","🔨","🔩","🔗","📌","📍","✏️","📝","📖"] },
];

let epTarget = "msg", epIdx = -1;
const answers = [];  // shared with poll module

export function getAnswers() { return answers; }

export function renderEmojiCats() {
  const cats = $("ep-cats"); cats.innerHTML = "";
  EMOJI_CATS.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.className = `ep-cat${i === 0 ? " active" : ""}`;
    btn.textContent = c.l; btn.title = c.n;
    btn.onclick = () => { document.querySelectorAll(".ep-cat").forEach(b => b.classList.remove("active")); btn.classList.add("active"); renderEmojiGrid(c.e); };
    cats.appendChild(btn);
  });
}

export function renderEmojiGrid(emojis) {
  const grid = $("ep-grid"); grid.innerHTML = "";
  if (S.guildEmojis.length) {
    grid.innerHTML += `<div class="ep-section-label">Serveur</div>`;
    S.guildEmojis.forEach(em => {
      const btn = document.createElement("button"); btn.className = "ep-srv-emoji";
      btn.innerHTML = `<img src="https://cdn.discordapp.com/emojis/${em.id}.webp?size=32" loading="lazy" alt=":${em.name}:"/>`; btn.title = `:${em.name}:`;
      btn.onclick = () => pickEmoji(em.name, em.id); grid.appendChild(btn);
    });
    grid.innerHTML += `<div class="ep-section-label">Standard</div>`;
  }
  emojis.forEach(e => {
    const btn = document.createElement("button"); btn.className = "ep-emoji";
    btn.textContent = e; btn.onclick = () => pickEmoji(e); grid.appendChild(btn);
  });
}

export function filterEmojis(q) {
  if (!q) return renderEmojiGrid(EMOJI_CATS.flatMap(c => c.e));
  const ql = q.toLowerCase();
  renderEmojiGrid(EMOJI_CATS.flatMap(c => c.e).filter(e => e.includes(ql)));
}

export function openEmojiPicker(evt, target, idx = -1) {
  evt.stopPropagation(); epTarget = target; epIdx = idx;
  const pk = $("emoji-picker"); pk.classList.add("show");
  const rect = evt.target.getBoundingClientRect();
  const top  = rect.top - 360 - 8;
  pk.style.left = Math.min(rect.left, window.innerWidth - 310) + "px";
  pk.style.top  = (top < 8 ? rect.bottom + 8 : top) + "px";
  $("ep-remove-btn").style.display = (target === "ans" && idx >= 0) ? "" : "none";
}

export function pickEmoji(emoji, emojiId = "") {
  $("emoji-picker").classList.remove("show");
  if (epTarget === "msg") {
    const ta = $("msg-input"); ta.value += emoji; ta.focus();
    window._onType?.();
  } else if (epTarget === "ans" && epIdx >= 0) {
    answers[epIdx].emoji   = emoji;
    answers[epIdx].emojiId = emojiId;
    window._renderAnswers?.();
  }
}

export function removeEmoji() {
  if (epTarget === "ans" && epIdx >= 0) { answers[epIdx].emoji = ""; answers[epIdx].emojiId = ""; window._renderAnswers?.(); }
  $("emoji-picker").classList.remove("show");
}

export function initEmojiPicker() {
  renderEmojiCats();
  renderEmojiGrid(EMOJI_CATS.flatMap(c => c.e));
}
