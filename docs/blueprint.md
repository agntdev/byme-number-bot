# ByMe Number Bot — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot that responds with a random integer between 0 and 20 when the authorized owner sends the exact phrase 'by me' (case-insensitive). The bot ignores other messages and optionally blocks unauthorized users with a 'Not authorized' message.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- The bot owner (single user)

## Success criteria

- Bot responds with a number between 0 and 20 when owner sends 'by me'
- Unauthorized users receive a 'Not authorized' message if configured
- Bot ignores all other messages

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **by me** (message, actor: user, command: /by me) — Trigger the bot to respond with a random number between 0 and 20
- **/start** (command, actor: user, command: /start) — Open the main menu

## Flows

### Number Response Flow
_Trigger:_ message text 'by me' (case-insensitive)

1. Check if message is from authorized owner
2. Generate random number between 0 and 20
3. Send number as response

_Data touched:_ User entity

### Unauthorized Access Flow
_Trigger:_ message text 'by me' from unauthorized user

1. Check if message is from authorized owner
2. Send 'Not authorized' message if configured

_Data touched:_ User entity

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User** _(retention: persistent)_ — Authorized owner of the bot
  - fields: telegram_user_id, is_authorized, show_unauthorized_message

## Integrations

- **Telegram** (required) — Bot API messaging
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Set authorized user ID
- Enable/disable unauthorized message
- Change trigger phrase (optional)

## Permissions & privacy

- Only the authorized owner's Telegram user ID is stored
- No message history is retained
- Generated numbers are not stored

## Edge cases

- Owner sends 'by me' with extra whitespace
- Multiple users in a group chat send 'by me'
- Bot receives messages other than 'by me'

## Required tests

- Verify number response when owner sends 'by me'
- Verify unauthorized user message handling
- Verify bot ignores non-trigger messages

## Assumptions

- Owner is a single user
- Trigger phrase matching is case-insensitive and trims whitespace
- Bot will not store generated numbers
