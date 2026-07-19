import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  getSettings,
  isOwner,
  setOwnerUserId,
  type SessionWithSettings,
} from "../storage.js";

/**
 * by-me handler — responds with a random number 0–20 when the authorized owner
 * sends the trigger phrase (default "by me", case-insensitive, trimmed).
 *
 * On first use by any user, that user is auto-registered as the owner.
 * Unauthorized users see "Not authorized" if that setting is enabled.
 */
const composer = new Composer<Ctx>();

// Handle /by command (registered for command discoverability).
composer.command("by", async (ctx) => {
  if (!ctx.from) return;
  const userId = ctx.from.id;
  const session = ctx.session as SessionWithSettings;
  const settings = getSettings(session);

  // First user to send becomes the owner.
  if (settings.ownerUserId === null) {
    setOwnerUserId(session, userId);
    await ctx.reply(String(randomInt()));
    return;
  }

  if (isOwner(session, userId)) {
    await ctx.reply(String(randomInt()));
    return;
  }

  if (settings.showUnauthorizedMessage) {
    await ctx.reply("Not authorized");
  }
});

// Handle text messages matching the trigger phrase.
composer.on("message:text", async (ctx, next) => {
  const text = ctx.message.text.trim().toLowerCase();
  const session = ctx.session as SessionWithSettings;
  const settings = getSettings(session);
  const trigger = settings.triggerPhrase.trim().toLowerCase();

  if (text !== trigger) return next();

  const userId = ctx.from.id;

  // First user to send the trigger phrase becomes the owner.
  if (settings.ownerUserId === null) {
    setOwnerUserId(session, userId);
    await ctx.reply(String(randomInt()));
    return;
  }

  if (isOwner(session, userId)) {
    await ctx.reply(String(randomInt()));
    return;
  }

  if (settings.showUnauthorizedMessage) {
    await ctx.reply("Not authorized");
  }
});

function randomInt(): number {
  return Math.floor(Math.random() * 21);
}

export default composer;
