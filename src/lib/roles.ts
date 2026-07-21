import { DIRECTEUR_EMAIL } from './types'
import type { Admin, Role } from './types'

/** Validation d'email partagée entre le client et le serveur. */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normaliserEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Droits effectifs d'un email. Fonction pure (aucun React, aucun accès base) :
 * réutilisable côté client comme côté serveur.
 */
export function calculerRole(email: string | undefined, admins: Admin[]): Role {
  const aucun: Role = {
    isDirecteur: false,
    isAdmin: false,
    canManageAppointments: false,
    canManageSlots: false,
    canManageAdmins: false,
  }
  if (!email) return aucun

  const e = normaliserEmail(email)
  if (e === DIRECTEUR_EMAIL) {
    return {
      isDirecteur: true,
      isAdmin: true,
      canManageAppointments: true,
      canManageSlots: true,
      canManageAdmins: true,
    }
  }

  const admin = admins.find((a) => normaliserEmail(a.email) === e)
  if (!admin) return aucun

  return {
    isDirecteur: false,
    isAdmin: true,
    canManageAppointments: admin.canManageAppointments,
    canManageSlots: admin.canManageSlots,
    // La gestion des admins reste exclusive au directeur.
    canManageAdmins: false,
  }
}
