// ── Application entry point (ES module) ──────────────
import { S } from "./modules/state.js";
import { $, toast } from "./modules/utils.js";
import { apiGet, apiPost } from "./modules/api.js";
import { connect, disconnect, selectGuild, loadGuilds, loadSavedBots } from "./modules/guild.js";
import { selectChannel, renderChannels, _onChanDragStart, _onChanDragOver, _onChanDrop, _openChanEdit, _closeChanEdit, _saveChanEdit, _onShowHome, _onDMSearch } from "./modules/channel.js";
import { loadMessages, renderMessages, filterMessages, setAutoRefresh,
         setReply, clearReply, startEdit, onEditKey, delMsg, endPoll } from "./modules/messages.js";
import { setMode, onType, onKey, onFiles, rmFile, sendMsg,
         toggleEmbed, addEmbedField, rmEmbedField, syncEmbedColor, syncEmbedColorHex, clearEmbed, applySlash } from "./modules/input.js";
import { initEmojiPicker, openEmojiPicker, pickEmoji, filterEmojis, removeEmoji, renderEmojiGrid, EMOJI_CATS } from "./modules/emoji.js";
import { initPoll, renderAnswers, addAnswer, rmAnswer, onPollQInput, updPollBtn, sendPoll } from "./modules/poll.js";
import { addCompBlock, rmCompBlock, moveComp, sendComponents, updateCompPreview } from "./modules/components.js";
import { loadTemplates, toggleTplDropdown, saveTemplate, delTemplate, applyTemplate,
         openChanEdit, closeChanEdit, saveChanEdit, openPins,
         openGuildEdit, closeGuildEdit, saveGuildEdit,
         openBotEdit, closeBotEdit, saveBotEdit } from "./modules/modals.js";
import { toggleMembers, loadMembers } from "./modules/members.js";

// ── Expose to window for inline event handlers ────────
Object.assign(window, {
  S, connect, disconnect,
  selectGuild, selectChannel,
  loadMessages, filterMessages, clearSearch: () => { $("msg-search").value = ""; filterMessages(""); },
  setAutoRefresh, setReply, clearReply,
  setMode, onType, onKey, onFiles, rmFile, sendMsg,
  toggleEmbed, addEmbedField, syncEmbedColor, syncEmbedColorHex, clearEmbed,
  openEmojiPicker, filterEmojis, removeEmoji,
  addAnswer, onPollQInput, sendPoll,
  addCompBlock, sendComponents,
  toggleTplDropdown, saveTemplate,
  openChanEdit, closeChanEdit, saveChanEdit, openPins,
  openGuildEdit, closeGuildEdit, saveGuildEdit,
  showHome: _onShowHome,
  _onDMSearch: _onDMSearch,

  _openDM: async (userId, optName) => {
    if (!S.token) return;
    const r = await apiPost("/api/dm", { token: S.token, recipient_id: userId });
    if (r.id) {
      const u = r.recipients?.[0] || { id: userId, username: optName || "Utilisateur" };
      const key = `recent_dms_${S.bot.id}`;
      const recent = JSON.parse(localStorage.getItem(key) || "[]");
      const idx = recent.findIndex(x => x.id === u.id);
      if (idx > -1) recent.splice(idx, 1);
      recent.unshift({ id: u.id, username: u.global_name ?? u.username, avatar: u.avatar });
      if (recent.length > 50) recent.pop();
      localStorage.setItem(key, JSON.stringify(recent));

      if (!S.channels) S.channels = [];
      if (!S.channels.find(c => c.id === r.id)) {
        S.channels.push({ id: r.id, type: 1, name: u.global_name ?? u.username });
      }
      
      if (S.guildId === null) {
        window.showHome();
      }

      await selectChannel(r.id);
    } else {
      toast(r.error ?? "Impossible d'ouvrir le MP", "err");
    }
  },

  _toggleMembers:    toggleMembers,
  _loadGuilds:       loadGuilds,
  _selectGuild:      selectGuild,

  // Internal refs used by sub-modules via window._*
  _openChanEdit:     openChanEdit,
  _setReply:         setReply,
  _openGuildEdit:    openGuildEdit,
  _closeGuildEdit:   closeGuildEdit,
  _saveGuildEdit:    saveGuildEdit,
  _openBotEdit:      openBotEdit,
  _closeBotEdit:     closeBotEdit,
  _saveBotEdit:      saveBotEdit,
  _startEdit:        startEdit,
  _onEditKey:        onEditKey,
  _delMsg:           delMsg,
  _endPoll:          endPoll,
  _rmFile:           rmFile,
  _rmEmbedField:     rmEmbedField,
  _openEmojiPicker:  openEmojiPicker,
  _renderAnswers:    renderAnswers,
  _rmAnswer:         rmAnswer,
  _updPollBtn:       updPollBtn,
  _applySlash:       applySlash,
  _onType:           onType,
  _setMode:          setMode,
  _moveComp:         moveComp,
  _rmCompBlock:      rmCompBlock,
  _updateCompPreview:updateCompPreview,
  _applyTemplate:    applyTemplate,
  _delTemplate:      delTemplate,
  _answers:          null,              // set after poll init below
});

// ── Boot ──────────────────────────────────────────────
(async () => {
  // Init UI components
  initEmojiPicker();
  initPoll();
  window._answers = (await import("./modules/poll.js")).getAnswers();
  window._renderAnswers = renderAnswers;
  loadTemplates();
  loadSavedBots();

  // Restore session
  try {
    const cfg = await apiGet("/api/config");
    if (cfg.token) {
      $("bot-token-input").value = cfg.token;
      S.token = cfg.token;
      const ok = await connect(true);
      if (ok && cfg.guildId) {
        await selectGuild(cfg.guildId, true);
        if (cfg.channelId) await selectChannel(cfg.channelId, true);
      }
    }
  } catch { /* no saved session */ }

  // Global click — close dropdowns/picker
  document.addEventListener("click", e => {
    const pk = $("emoji-picker");
    if (pk?.classList.contains("show") && !pk.contains(e.target) && e.target.id !== "emoji-btn-msg")
      pk.classList.remove("show");
    const td = $("tpl-dropdown");
    if (td?.classList.contains("show") && !td.contains(e.target) && !e.target.closest('[onclick*="toggleTpl"]'))
      td.classList.remove("show");
    const sp = $("slash-popup");
    if (sp?.classList.contains("show") && !sp.contains(e.target))
      sp.classList.remove("show");
  });

  // Lightbox close
  $("lightbox")?.addEventListener("click", () => $("lightbox").classList.remove("show"));
})();
