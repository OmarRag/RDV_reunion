export const DIRECTEUR_EMAIL = 'directeur@gmail.com'

export const PROFILS = [
  'Doctorant',
  'Mastorant',
  'Docteur',
  'Professeur',
  'Externe',
] as const

export type Profil = (typeof PROFILS)[number]

export type CurrentUser = {
  email: string
  /** Nom complet issu du compte Google (utilisateurs authentifiés). */
  name?: string
  /** Prénom Google, pour pré-remplir le formulaire de rdv (modifiable). */
  prenom?: string
  /** Nom de famille Google, pour pré-remplir le formulaire de rdv (modifiable). */
  nom?: string
}

export type Admin = {
  email: string
  canManageAppointments: boolean
  canManageSlots: boolean
}

export type SlotStatus = 'libre' | 'en_attente' | 'confirme'

export type Slot = {
  id: string
  /** format ISO court : AAAA-MM-JJ */
  date: string
  /** format 24h : HH:MM */
  time: string
  status: SlotStatus
}

export type AppointmentStatus = 'en_attente' | 'accepte' | 'refuse'

export type Appointment = {
  id: string
  userEmail: string
  profil: Profil
  nom: string
  prenom: string
  objectif: string
  slotId: string
  status: AppointmentStatus
  createdAt: string
}

/** Droits effectifs d'un utilisateur connecté. */
export type Role = {
  isDirecteur: boolean
  isAdmin: boolean
  canManageAppointments: boolean
  canManageSlots: boolean
  canManageAdmins: boolean
}
