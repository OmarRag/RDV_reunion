import { prisma } from '../prisma'
import { datesDeLaSemaine } from '../creneaux'
import { DIRECTEUR_EMAIL } from '../types'
import type { Admin, Appointment, Profil, Slot } from '../types'
import { EMAIL_REGEX, normaliserEmail } from '../roles'

/**
 * Logique métier des données PARTAGÉES (créneaux, rendez-vous, admins),
 * exécutée exclusivement côté serveur contre la base Neon. Reprend à
 * l'identique les règles de l'ancien store localStorage, mais de façon
 * cohérente et atomique pour un usage multi-utilisateurs.
 */

export type EtatPartage = {
  slots: Slot[]
  appointments: Appointment[]
  admins: Admin[]
}

/** Statut d'un créneau déduit des rendez-vous encore actifs qui le visent. */
function statutDepuisRdv(actifs: { status: string }[]): Slot['status'] {
  if (actifs.length === 0) return 'libre'
  return actifs.some((a) => a.status === 'accepte') ? 'confirme' : 'en_attente'
}

/** Lecture complète de l'état partagé, sérialisé au format attendu par le client. */
export async function lireEtat(): Promise<EtatPartage> {
  const [slots, appointments, admins] = await prisma.$transaction([
    prisma.slot.findMany(),
    prisma.appointment.findMany(),
    prisma.admin.findMany(),
  ])

  return {
    slots: slots.map((s) => ({
      id: s.id,
      date: s.date,
      time: s.time,
      status: s.status as Slot['status'],
    })),
    appointments: appointments.map((a) => ({
      id: a.id,
      userEmail: a.userEmail,
      profil: a.profil as Profil,
      nom: a.nom,
      prenom: a.prenom,
      objectif: a.objectif,
      slotId: a.slotId,
      status: a.status as Appointment['status'],
      createdAt: a.createdAt.toISOString(),
    })),
    admins: admins.map((a) => ({
      email: a.email,
      canManageAppointments: a.canManageAppointments,
      canManageSlots: a.canManageSlots,
    })),
  }
}

// --- Créneaux ---

/**
 * Génère les créneaux d'une semaine à partir des heures retenues jour par jour
 * (index 0 = lundi … 4 = vendredi). Les créneaux déjà existants sont conservés :
 * la contrainte d'unicité (date, heure) écarte les doublons.
 */
export async function genererCreneaux(
  lundiISO: string,
  heuresParJour: string[][],
): Promise<{ erreur: string | null; ajoutes: number }> {
  const dates = datesDeLaSemaine(lundiISO)
  const paires: { date: string; time: string; status: string }[] = []

  for (let i = 0; i < dates.length; i++) {
    for (const time of heuresParJour[i] ?? []) {
      paires.push({ date: dates[i], time, status: 'libre' })
    }
  }

  if (paires.length === 0) {
    return {
      erreur:
        'Aucun nouveau créneau à générer : aucune heure retenue, ou toutes existent déjà.',
      ajoutes: 0,
    }
  }

  const res = await prisma.slot.createMany({ data: paires, skipDuplicates: true })
  if (res.count === 0) {
    return {
      erreur:
        'Aucun nouveau créneau à générer : aucune heure retenue, ou toutes existent déjà.',
      ajoutes: 0,
    }
  }
  return { erreur: null, ajoutes: res.count }
}

/** Supprime un créneau, uniquement s'il est encore libre. */
export async function supprimerSlot(id: string): Promise<void> {
  await prisma.slot.deleteMany({ where: { id, status: 'libre' } })
}

// --- Rendez-vous ---

export async function creerRendezVous(data: {
  userEmail: string
  profil: Profil
  nom: string
  prenom: string
  objectif: string
  slotId: string
}): Promise<string | null> {
  if (!data.userEmail) return 'Vous devez être connecté.'

  // Verrou transactionnel : on ne réserve que si le créneau est encore libre.
  return prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: data.slotId } })
    if (!slot) return 'Créneau introuvable.'
    if (slot.status !== 'libre') {
      return 'Ce créneau vient d’être pris. Veuillez en choisir un autre.'
    }

    await tx.appointment.create({
      data: {
        userEmail: data.userEmail,
        profil: data.profil,
        nom: data.nom.trim(),
        prenom: data.prenom.trim(),
        objectif: data.objectif.trim(),
        slotId: data.slotId,
        status: 'en_attente',
      },
    })
    await tx.slot.update({
      where: { id: data.slotId },
      data: { status: 'en_attente' },
    })
    return null
  })
}

/** Accepte ou refuse un rdv en attente, puis réaligne son créneau. */
export async function changerStatutRdv(
  id: string,
  action: 'accepter' | 'refuser',
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const rdv = await tx.appointment.findUnique({ where: { id } })
    if (!rdv || rdv.status !== 'en_attente') return

    const nouveau = action === 'accepter' ? 'accepte' : 'refuse'
    await tx.appointment.update({ where: { id }, data: { status: nouveau } })

    // Le créneau suit ses rendez-vous : libre si plus aucun ne le retient.
    const actifs = await tx.appointment.findMany({
      where: { slotId: rdv.slotId, status: { not: 'refuse' } },
    })
    await tx.slot.updateMany({
      where: { id: rdv.slotId },
      data: { status: statutDepuisRdv(actifs) },
    })
  })
}

// --- Admins ---

export async function ajouterAdmin(
  email: string,
  perms: { canManageAppointments: boolean; canManageSlots: boolean },
): Promise<string | null> {
  const e = normaliserEmail(email)
  if (!e) return 'Veuillez saisir une adresse email.'
  if (!EMAIL_REGEX.test(e)) return 'Adresse email invalide.'
  if (e === DIRECTEUR_EMAIL) return 'Le directeur est déjà administrateur.'

  const existe = await prisma.admin.findUnique({ where: { email: e } })
  if (existe) return 'Cet administrateur existe déjà.'

  await prisma.admin.create({
    data: {
      email: e,
      canManageAppointments: perms.canManageAppointments,
      canManageSlots: perms.canManageSlots,
    },
  })
  return null
}

export async function supprimerAdmin(email: string): Promise<void> {
  const e = normaliserEmail(email)
  if (e === DIRECTEUR_EMAIL) return
  await prisma.admin.deleteMany({ where: { email: e } })
}
