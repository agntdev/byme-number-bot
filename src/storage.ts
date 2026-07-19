/**
 * Settings storage — uses the session for conversation state.
 *
 * In production the session is Redis-backed (via the toolkit), so settings
 * survive restarts. In the test harness each fresh bot gets a fresh session,
 * so specs don't leak state across runs.
 */

export interface SettingsData {
  ownerUserId: number | null;
  showUnauthorizedMessage: boolean;
  triggerPhrase: string;
}

const DEFAULTS: SettingsData = {
  ownerUserId: null,
  showUnauthorizedMessage: true,
  triggerPhrase: "by me",
};

// Extend the per-chat session with a settings bag.
// grammY's session plugin merges this into the session object at runtime.
export interface SessionWithSettings {
  settings?: Partial<SettingsData>;
}

function merge(session: SessionWithSettings): SettingsData {
  const s = session.settings ?? {};
  return {
    ownerUserId: s.ownerUserId ?? DEFAULTS.ownerUserId,
    showUnauthorizedMessage: s.showUnauthorizedMessage ?? DEFAULTS.showUnauthorizedMessage,
    triggerPhrase: s.triggerPhrase ?? DEFAULTS.triggerPhrase,
  };
}

export function getSettings(session: SessionWithSettings): SettingsData {
  return merge(session);
}

export function setOwnerUserId(session: SessionWithSettings, id: number): void {
  if (!session.settings) session.settings = {};
  session.settings.ownerUserId = id;
}

export function setShowUnauthorizedMessage(session: SessionWithSettings, enabled: boolean): void {
  if (!session.settings) session.settings = {};
  session.settings.showUnauthorizedMessage = enabled;
}

export function setTriggerPhrase(session: SessionWithSettings, phrase: string): void {
  if (!session.settings) session.settings = {};
  session.settings.triggerPhrase = phrase;
}

export function isOwner(session: SessionWithSettings, userId: number): boolean {
  return merge(session).ownerUserId === userId;
}
