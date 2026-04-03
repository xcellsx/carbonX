import { normalizeUserIdKey } from '../services/api';

const LEGACY_SESSIONS = 'sproutai_sessions';
const LEGACY_MESSAGES = 'sproutai_current_messages';
const LEGACY_FEEDBACK = 'sproutai_feedback';

function currentUid() {
  return normalizeUserIdKey(localStorage.getItem('userId') || '').trim();
}

export function sproutSessionsKey() {
  const uid = currentUid();
  return uid ? `sproutai_sessions:${uid}` : `sproutai_sessions:guest`;
}

export function sproutCurrentMessagesKey() {
  const uid = currentUid();
  return uid ? `sproutai_current_messages:${uid}` : `sproutai_current_messages:guest`;
}

export function sproutFeedbackKey() {
  const uid = currentUid();
  return uid ? `sproutai_feedback:${uid}` : `sproutai_feedback:guest`;
}

/** Copy old unscoped data only into the guest bucket — never into `sproutai_*:<userId>` or every account shared one history. */
function allowLegacyMigrationIntoKey(key) {
  return typeof key === 'string' && key.endsWith(':guest');
}

function migrateLegacySessions(key) {
  try {
    const cur = localStorage.getItem(key);
    if (cur) {
      const p = JSON.parse(cur);
      if (Array.isArray(p) && p.length > 0) return;
    }
    if (!allowLegacyMigrationIntoKey(key)) return;
    const leg = localStorage.getItem(LEGACY_SESSIONS);
    if (!leg) return;
    const p = JSON.parse(leg);
    if (Array.isArray(p) && p.length > 0) {
      localStorage.setItem(key, leg);
    }
  } catch (_) {}
}

function migrateLegacyMessages(key) {
  try {
    const cur = localStorage.getItem(key);
    if (cur) {
      const p = JSON.parse(cur);
      if (Array.isArray(p) && p.length > 0) return;
    }
    if (!allowLegacyMigrationIntoKey(key)) return;
    const leg = localStorage.getItem(LEGACY_MESSAGES);
    if (!leg) return;
    const p = JSON.parse(leg);
    if (Array.isArray(p) && p.length > 0) {
      localStorage.setItem(key, leg);
    }
  } catch (_) {}
}

function migrateLegacyFeedback(key) {
  try {
    const cur = localStorage.getItem(key);
    if (cur) {
      const p = JSON.parse(cur);
      if (p && typeof p === 'object' && Object.keys(p).length > 0) return;
    }
    if (!allowLegacyMigrationIntoKey(key)) return;
    const leg = localStorage.getItem(LEGACY_FEEDBACK);
    if (!leg) return;
    const p = JSON.parse(leg);
    if (p && typeof p === 'object' && Object.keys(p).length > 0) {
      localStorage.setItem(key, leg);
    }
  } catch (_) {}
}

export function loadSproutSessions() {
  const key = sproutSessionsKey();
  migrateLegacySessions(key);
  try {
    const s = localStorage.getItem(key);
    if (s) {
      const p = JSON.parse(s);
      return Array.isArray(p) ? p : [];
    }
  } catch (_) {}
  return [];
}

export function saveSproutSessions(sessions) {
  try {
    localStorage.setItem(sproutSessionsKey(), JSON.stringify(Array.isArray(sessions) ? sessions : []));
  } catch (_) {}
}

export function loadSproutCurrentMessages() {
  const key = sproutCurrentMessagesKey();
  migrateLegacyMessages(key);
  try {
    const s = localStorage.getItem(key);
    if (s) {
      const p = JSON.parse(s);
      return Array.isArray(p) ? p : [];
    }
  } catch (_) {}
  return [];
}

export function saveSproutCurrentMessages(messages) {
  try {
    localStorage.setItem(sproutCurrentMessagesKey(), JSON.stringify(Array.isArray(messages) ? messages : []));
  } catch (_) {}
}

export function loadSproutFeedbackMap() {
  const key = sproutFeedbackKey();
  migrateLegacyFeedback(key);
  try {
    const s = localStorage.getItem(key);
    if (s) {
      const o = JSON.parse(s);
      return typeof o === 'object' && o !== null ? o : {};
    }
  } catch (_) {}
  return {};
}

export function saveSproutFeedbackMap(map) {
  try {
    localStorage.setItem(sproutFeedbackKey(), JSON.stringify(map && typeof map === 'object' ? map : {}));
  } catch (_) {}
}
