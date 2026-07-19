import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  getSettings,
  setOwnerUserId,
  setShowUnauthorizedMessage,
  setTriggerPhrase,
  type SessionWithSettings,
} from "../storage.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";

registerMainMenuItem({ label: "⚙️ Settings", data: "settings:show", order: 90 });

const composer = new Composer<Ctx>();

// Ephemeral per-chat state for tracking which setting is being edited.
const pendingEdits = new Map<number, "owner" | "trigger">();

function settingsText(s: { ownerUserId: number | null; showUnauthorizedMessage: boolean; triggerPhrase: string }): string {
  const owner = s.ownerUserId !== null ? String(s.ownerUserId) : "Not set";
  const unauth = s.showUnauthorizedMessage ? "On" : "Off";
  return [
    "⚙️ Bot settings",
    "",
    `Owner: ${owner}`,
    `Unauthorized message: ${unauth}`,
    `Trigger phrase: "${s.triggerPhrase}"`,
  ].join("\n");
}

function settingsKeyboard(s: { showUnauthorizedMessage: boolean }): ReturnType<typeof inlineKeyboard> {
  const toggleLabel = s.showUnauthorizedMessage
    ? "🔕 Disable unauthorized msg"
    : "🔔 Enable unauthorized msg";
  return inlineKeyboard([
    [inlineButton("👤 Set owner ID", "settings:prompt_owner")],
    [inlineButton(toggleLabel, "settings:toggle_unauth")],
    [inlineButton("💬 Change trigger phrase", "settings:prompt_trigger")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
}

composer.callbackQuery("settings:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const session = ctx.session as SessionWithSettings;
  const s = getSettings(session);
  await ctx.editMessageText(settingsText(s), { reply_markup: settingsKeyboard(s) });
});

composer.callbackQuery("settings:toggle_unauth", async (ctx) => {
  await ctx.answerCallbackQuery();
  const session = ctx.session as SessionWithSettings;
  const s = getSettings(session);
  setShowUnauthorizedMessage(session, !s.showUnauthorizedMessage);
  const updated = getSettings(session);
  await ctx.editMessageText(settingsText(updated), { reply_markup: settingsKeyboard(updated) });
});

composer.callbackQuery("settings:prompt_owner", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat?.id;
  if (typeof chatId === "number") pendingEdits.set(chatId, "owner");
  await ctx.editMessageText(
    "Send the Telegram user ID to set as owner.\n\nExample: 123456789",
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:show")]]) },
  );
});

composer.callbackQuery("settings:prompt_trigger", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat?.id;
  if (typeof chatId === "number") pendingEdits.set(chatId, "trigger");
  await ctx.editMessageText(
    "Send the new trigger phrase.\n\nExample: by me",
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:show")]]) },
  );
});

// Handle pending settings input.
composer.on("message:text", async (ctx, next) => {
  const chatId = ctx.chat?.id;
  if (typeof chatId !== "number") return next();

  const pending = pendingEdits.get(chatId);
  if (!pending) return next();

  const text = ctx.message.text.trim();
  pendingEdits.delete(chatId);

  const session = ctx.session as SessionWithSettings;

  if (pending === "owner") {
    if (/^\d{1,10}$/.test(text)) {
      setOwnerUserId(session, Number(text));
    } else {
      await ctx.reply("That doesn't look like a user ID. Send a numeric ID.");
      return;
    }
  } else if (pending === "trigger") {
    if (text.length > 0 && text.length <= 64) {
      setTriggerPhrase(session, text);
    } else {
      await ctx.reply("Keep the phrase between 1 and 64 characters.");
      return;
    }
  }

  const s = getSettings(session);
  await ctx.reply(settingsText(s), { reply_markup: settingsKeyboard(s) });
});

export default composer;
