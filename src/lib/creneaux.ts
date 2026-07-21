import type { Slot } from './types'

/** Durée d'un rendez-vous, en minutes. */
export const DUREE_RDV = 30

/** Pas entre deux créneaux : 1 h, pour laisser 30 min de marge si un rdv déborde. */
export const PAS_MINUTES = 60

export const JOURS_SEMAINE = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
] as const

export function versMinutes(heure: string): number {
  const [h, m] = heure.split(':').map(Number)
  return h * 60 + m
}

export function versHeure(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function versISO(d: Date): string {
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mois}-${jour}`
}

/** Lundi de la semaine contenant la date fournie (AAAA-MM-JJ). */
export function lundiDeLaSemaine(dateISO: string): string {
  const [a, m, j] = dateISO.split('-').map(Number)
  const d = new Date(a, m - 1, j)
  // getDay() : 0 = dimanche … 6 = samedi. On ramène toujours au lundi.
  const decalage = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - decalage)
  return versISO(d)
}

/** Les cinq dates (lun→ven) de la semaine commençant au lundi fourni. */
export function datesDeLaSemaine(lundiISO: string): string[] {
  const [a, m, j] = lundiISO.split('-').map(Number)
  return JOURS_SEMAINE.map((_, i) => {
    const d = new Date(a, m - 1, j)
    d.setDate(d.getDate() + i)
    return versISO(d)
  })
}

/**
 * Heures de début générées pour une plage, avec un pas de 1 h.
 * Un créneau n'est retenu que si le rendez-vous de 30 min tient
 * entièrement dans la plage. Ex. 09:00–12:00 → 09:00, 10:00, 11:00.
 */
export function genererHeures(debut: string, fin: string): string[] {
  const min = versMinutes(debut)
  const max = versMinutes(fin)
  const heures: string[] = []
  for (let t = min; t + DUREE_RDV <= max; t += PAS_MINUTES) {
    heures.push(versHeure(t))
  }
  return heures
}

/**
 * Toutes les heures de début envisageables dans une plage, au pas de 1 h.
 * Contrairement à `genererHeures`, la dernière heure n'est pas exclue :
 * l'admin reste libre d'ouvrir un créneau qui déborde de sa plage.
 */
export function candidatsHeures(debut: string, fin: string): string[] {
  const min = versMinutes(debut)
  const max = versMinutes(fin)
  const heures: string[] = []
  for (let t = min; t <= max; t += PAS_MINUTES) {
    heures.push(versHeure(t))
  }
  return heures
}

/** true si les deux plages d'un même jour se chevauchent. */
export function plagesSeChevauchent(
  a: { debut: string; fin: string },
  b: { debut: string; fin: string },
): boolean {
  return (
    versMinutes(a.debut) < versMinutes(b.fin) &&
    versMinutes(b.debut) < versMinutes(a.fin)
  )
}

/** Regroupe des créneaux par date, chaque groupe trié par heure. */
export function grouperParJour(
  slots: Slot[],
): { date: string; slots: Slot[] }[] {
  const parDate = new Map<string, Slot[]>()
  for (const s of slots) {
    const liste = parDate.get(s.date)
    if (liste) liste.push(s)
    else parDate.set(s.date, [s])
  }
  return [...parDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, liste]) => ({
      date,
      slots: [...liste].sort((a, b) => a.time.localeCompare(b.time)),
    }))
}

/** Heure de fin affichée pour un créneau (début + 30 min). */
export function heureFin(debut: string): string {
  return versHeure(versMinutes(debut) + DUREE_RDV)
}
