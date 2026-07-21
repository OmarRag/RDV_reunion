import type { CurrentUser } from './types'

/**
 * localStorage : uniquement les données LOCALES à l'appareil. Les créneaux,
 * rendez-vous et admins vivent désormais en base Neon (voir lib/server/rdv.ts).
 */
type StorageSchema = {
  /** Session courante sur cet appareil (simulation de connexion Google). */
  currentUser: CurrentUser | null
  /** Emails déjà utilisés pour se connecter sur cet appareil. */
  emails: string[]
}

const PREFIX = 'rdv:'

const CLES: Record<keyof StorageSchema, string> = {
  currentUser: PREFIX + 'currentUser',
  emails: 'rdv_reunion_emails',
}

const DEFAULTS: StorageSchema = {
  currentUser: null,
  emails: [],
}

export function get<K extends keyof StorageSchema>(key: K): StorageSchema[K] {
  try {
    const raw = localStorage.getItem(CLES[key])
    if (raw === null) return DEFAULTS[key]
    return JSON.parse(raw) as StorageSchema[K]
  } catch {
    return DEFAULTS[key]
  }
}

export function set<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K],
): void {
  localStorage.setItem(CLES[key], JSON.stringify(value))
}

export function remove(key: keyof StorageSchema): void {
  localStorage.removeItem(CLES[key])
}

/** Identifiant local (clés React des plages en cours d'édition côté admin). */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
