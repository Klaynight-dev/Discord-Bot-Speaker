// ── Poll builder ──────────────────────────────────────
import { S } from "./state.js";
import { apiPost } from "./api.js";
import { $, esc, toast } from "./utils.js";
import { loadMessages } from "./messages.js";

const answers = [];

export function getAnswers() { return answers; }

export function initPoll() {
  answers.splice(0);
  answers.push({ text: "", emoji: "", emojiId: "" }, { text: "", emoji: "", emojiId: "" });
  renderAnswers();
}

export function renderAnswers() {
  const list = $("answers-list"); list.innerHTML = "";
  answers.forEach((a, i) => {
    const row = document.createElement("div"); row.className = "ans-row";
    row.innerHTML = `<button class="ans-emoji-btn" onclick="window._openEmojiPicker(event,'ans',${i})">${a.emoji || `<span class="placeholder">+</span>`}</button>
      <input class="ans-input" placeholder="Réponse ${i+1}…" maxlength="55" value="${esc(a.text)}" oninput="window._answers[${i}].text=this.value;window._updPollBtn()"/>
      ${answers.length > 2 ? `<button class="ans-rm" onclick="window._rmAnswer(${i})">✕</button>` : ""}`;
    list.appendChild(row);
  });
  $("ans-count").textContent = `${answers.length} / 10`;
  updPollBtn();
}

export function addAnswer() {
  if (answers.length >= 10) return;
  answers.push({ text: "", emoji: "", emojiId: "" });
  renderAnswers();
}

export function rmAnswer(i) {
  if (answers.length <= 2) return;
  answers.splice(i, 1); renderAnswers();
}

export function updPollBtn() {
  const filled = answers.filter(a => a.text.trim()).length;
  $("ans-filled").textContent = String(filled);
  $("send-poll-btn").disabled = !$("poll-q")?.value?.trim() || filled < 2;
}

export function onPollQInput() {
  const v = $("poll-q").value;
  $("q-ctr").textContent = `${v.length} / 300`;
  updPollBtn();
}

export async function sendPoll() {
  if (!S.channelId) { toast("Sélectionnez un salon", "err"); return; }
  const q = $("poll-q").value.trim();
  if (!q) { toast("Question requise", "err"); return; }
  const r = await apiPost("/api/poll", {
    token: S.token, channelId: S.channelId, question: q,
    answers, duration: parseInt($("poll-dur").value), allow_multiselect: $("poll-multi").checked,
  });
  if (r.id) { toast("Sondage publié ✓"); $("poll-q").value = ""; initPoll(); if (!S.arTimer) await loadMessages(); }
  else toast(r.message ?? "Erreur", "err");
}
