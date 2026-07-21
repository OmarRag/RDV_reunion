'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { AppointmentStatus, SlotStatus } from '../lib/types'

/** Servi tel quel depuis `public/` : aucune transformation, aucun recadrage. */
const logo = '/logo_ptr.jpeg'

/**
 * Logo tel que fourni : aucun cadre ni fond ajouté, il porte déjà le sien.
 * La hauteur pilote la taille, la largeur suit : aucune déformation.
 */
export function Logo({ hauteur = 92 }: { hauteur?: number }) {
  return (
    <img
      src={logo}
      alt="Plateformes technologiques de recherche — UM6SS"
      className="block h-auto w-auto object-contain"
      style={{ height: hauteur }}
    />
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`animate-apparition rounded-2xl border border-bordure bg-surface p-6 shadow-sm shadow-encre/5 ${className}`}
    >
      {children}
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primaire' | 'secondaire' | 'danger' | 'succes' | 'fantome'
}

const VARIANTES: Record<string, string> = {
  primaire:
    'bg-accent-500 text-surface hover:bg-accent-600 shadow-sm shadow-accent-600/20 focus-visible:outline-accent-500',
  secondaire:
    'bg-surface text-encre border border-bordure-forte hover:bg-fond hover:border-accent-300 focus-visible:outline-accent-500',
  danger:
    'bg-brique-500 text-surface hover:bg-brique-600 shadow-sm shadow-brique-600/20 focus-visible:outline-brique-500',
  succes:
    'bg-vert-500 text-surface hover:bg-vert-600 shadow-sm shadow-vert-600/20 focus-visible:outline-vert-500',
  fantome: 'text-doux hover:text-encre hover:bg-fond focus-visible:outline-accent-500',
}

export function Button({
  variante = 'primaire',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40 ${VARIANTES[variante]} ${className}`}
    />
  )
}

const LIBELLES_RDV: Record<AppointmentStatus, string> = {
  en_attente: 'En attente',
  accepte: 'Accepté',
  refuse: 'Refusé',
}

const COULEURS_RDV: Record<AppointmentStatus, string> = {
  en_attente: 'bg-ambre-100 text-ambre-600 border-ambre-300',
  accepte: 'bg-vert-100 text-vert-600 border-vert-300',
  refuse: 'bg-brique-100 text-brique-600 border-brique-300',
}

export function BadgeRdv({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${COULEURS_RDV[status]}`}
    >
      {LIBELLES_RDV[status]}
    </span>
  )
}

const LIBELLES_SLOT: Record<SlotStatus, string> = {
  libre: 'Libre',
  en_attente: 'Réservé (en attente)',
  confirme: 'Confirmé',
}

const COULEURS_SLOT: Record<SlotStatus, string> = {
  libre: 'bg-fond-2 text-doux border-bordure-forte',
  en_attente: 'bg-ambre-100 text-ambre-600 border-ambre-300',
  confirme: 'bg-vert-100 text-vert-600 border-vert-300',
}

export function BadgeSlot({ status }: { status: SlotStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${COULEURS_SLOT[status]}`}
    >
      {LIBELLES_SLOT[status]}
    </span>
  )
}

export function Alerte({
  children,
  type = 'erreur',
}: {
  children: ReactNode
  type?: 'erreur' | 'succes' | 'info'
}) {
  const styles = {
    erreur: 'bg-brique-100 text-brique-600 border-brique-300',
    succes: 'bg-vert-100 text-vert-600 border-vert-300',
    info: 'bg-accent-100 text-accent-600 border-accent-200',
  }[type]
  return (
    <div
      className={`animate-apparition rounded-xl border px-4 py-3 text-sm ${styles}`}
    >
      {children}
    </div>
  )
}

export function EtatVide({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-bordure-forte bg-fond/60 px-4 py-10 text-center text-sm text-doux">
      {children}
    </p>
  )
}

export function Champ({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-encre">{label}</span>
      {children}
    </label>
  )
}

export const classesInput =
  'w-full rounded-xl border border-bordure-forte bg-surface px-4 py-2.5 text-sm text-encre placeholder:text-doux/70 outline-none transition-all duration-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-200'
