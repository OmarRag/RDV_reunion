import type { Admin, Appointment, CurrentUser, Slot } from './types'

/** Schéma du localStorage : une clé -> un type. */
type StorageSchema = {
  currentUser: CurrentUser | null
  admins: Admin[]
  slots: Slot[]
  appointments: Appointment[]
  /** Emails déjà utilisés pour se connecter sur cet appareil. */
  emails: string[]
}

const PREFIX = 'rdv:'

/**
 * Nom réel de chaque clé dans le localStorage. Tout est cloisonné à cette
 * application : aucun risque de collision avec un autre site ou une autre
 * donnée du navigateur.
 */
const CLES: Record<keyof StorageSchema, string> = {
  currentUser: PREFIX + 'currentUser',
  admins: PREFIX + 'admins',
  slots: PREFIX + 'slots',
  appointments: PREFIX + 'appointments',
  emails: 'rdv_reunion_emails',
}

const DEFAULTS: StorageSchema = {
  currentUser: null,
  admins: [],
  slots: [],
  appointments: [],
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

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/**
 * Supprime les créneaux de démonstration créés par les anciennes versions.
 * Ne touche qu'aux créneaux encore libres et sans rendez-vous rattaché :
 * aucune demande d'utilisateur ne peut être perdue.
 */
export function purgerCreneauxDemo(): void {
  const CLE_PURGE = PREFIX + 'purge-demo:v1'
  if (localStorage.getItem(CLE_PURGE) === '1') return
  localStorage.setItem(CLE_PURGE, '1')

  const rdv = get('appointments')
  const conserves = get('slots').filter(
    (s) => s.status !== 'libre' || rdv.some((a) => a.slotId === s.id),
  )
  set('slots', conserves)
}
