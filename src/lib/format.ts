import type { Slot } from './types'

const formatteurDate = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDate(date: string): string {
  const [a, m, j] = date.split('-').map(Number)
  if (!a || !m || !j) return date
  return formatteurDate.format(new Date(a, m - 1, j))
}

export function formatSlot(slot: Slot | undefined): string {
  if (!slot) return 'Créneau introuvable'
  return `${formatDate(slot.date)} à ${slot.time}`
}

export function formatDateHeure(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
