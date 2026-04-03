import { normalizeUserIdKey } from '../services/api';

/** Legacy global key; per-user keys are `${CUSTOM_TEMPLATES_STORAGE_PREFIX}:${userId}`. */
export const CUSTOM_TEMPLATES_STORAGE_PREFIX = 'carbonx-custom-templates';

export function getCustomTemplatesStorageKey() {
  const uid = normalizeUserIdKey(localStorage.getItem('userId') || '').trim();
  return uid
    ? `${CUSTOM_TEMPLATES_STORAGE_PREFIX}:${uid}`
    : `${CUSTOM_TEMPLATES_STORAGE_PREFIX}:guest`;
}

/**
 * Custom templates for the logged-in user (same key scheme as Inventory).
 * Legacy `carbonx-custom-templates` (no suffix) is migrated only into the **guest** key — never into
 * `carbonx-custom-templates:<userId>` or a new account would inherit another user's Browse Templates / BOM cards.
 */
export function getStoredCustomTemplates() {
  try {
    const key = getCustomTemplatesStorageKey();
    const saved = localStorage.getItem(key);
    if (saved != null) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }
    const isGuestKey = key === `${CUSTOM_TEMPLATES_STORAGE_PREFIX}:guest`;
    if (isGuestKey) {
      const legacy = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_PREFIX);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(key, JSON.stringify(parsed));
          return parsed;
        }
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function setStoredCustomTemplates(templates) {
  try {
    const arr = Array.isArray(templates) ? templates : [];
    localStorage.setItem(getCustomTemplatesStorageKey(), JSON.stringify(arr));
  } catch {}
}
