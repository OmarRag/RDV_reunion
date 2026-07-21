import { useCallback, useEffect, useMemo, useState } from 'react'
import * as storage from './storage'
import { datesDeLaSemaine } from './creneaux'
import { DIRECTEUR_EMAIL } from './types'
import type {
  Admin,
  Appointment,
  CurrentUser,
  Profil,
  Role,
  Slot,
} from './types'

export function normaliserEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function calculerRole(
  email: string | undefined,
  admins: Admin[],
): Role {
  if (!email) {
    return {
      isDirecteur: false,
      isAdmin: false,
      canManageAppointments: false,
      canManageSlots: false,
      canManageAdmins: false,
    }
  }
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
  if (!admin) {
    return {
      isDirecteur: false,
      isAdmin: false,
      canManageAppointments: false,
      canManageSlots: false,
      canManageAdmins: false,
    }
  }
  return {
    isDirecteur: false,
    isAdmin: true,
    canManageAppointments: admin.canManageAppointments,
    canManageSlots: admin.canManageSlots,
    // La gestion des admins reste exclusive au directeur.
    canManageAdmins: false,
  }
}

/**
 * Recalcule le statut de chaque créneau à partir des rendez-vous.
 * Source de vérité : le rendez-vous. Un créneau est « en_attente » ou
 * « confirme » uniquement s'il existe un rdv correspondant, sinon « libre ».
 */
function reconcilier(slots: Slot[], appointments: Appointment[]): Slot[] {
  return slots.map((slot) => {
    const rdv = appointments.find(
      (a) => a.slotId === slot.id && a.status !== 'refuse',
    )
    const attendu: Slot['status'] = !rdv
      ? 'libre'
      : rdv.status === 'accepte'
        ? 'confirme'
        : 'en_attente'
    return slot.status === attendu ? slot : { ...slot, status: attendu }
  })
}

export function useStore() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() =>
    storage.get('currentUser'),
  )
  const [admins, setAdmins] = useState<Admin[]>(() => storage.get('admins'))
  const [slots, setSlots] = useState<Slot[]>(() => storage.get('slots'))
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    storage.get('appointments'),
  )
  // Emails déjà utilisés sur cet appareil, proposés à la connexion suivante.
  const [emails, setEmails] = useState<string[]>(() => storage.get('emails'))

  // Cohérence au démarrage : aligne les créneaux sur les rendez-vous.
  useEffect(() => {
    setSlots((prev) => {
      const next = reconcilier(prev, storage.get('appointments'))
      return next.some((s, i) => s !== prev[i]) ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    storage.set('currentUser', currentUser)
  }, [currentUser])
  useEffect(() => {
    storage.set('admins', admins)
  }, [admins])
  useEffect(() => {
    storage.set('slots', slots)
  }, [slots])
  useEffect(() => {
    storage.set('appointments', appointments)
  }, [appointments])
  useEffect(() => {
    storage.set('emails', emails)
  }, [emails])

  const role = useMemo(
    () => calculerRole(currentUser?.email, admins),
    [currentUser, admins],
  )

  const seConnecter = useCallback((email: string) => {
    const e = normaliserEmail(email)
    setCurrentUser({ email: e })
    // Mémorisation sans doublon, le plus récent en tête.
    setEmails((prev) => [e, ...prev.filter((x) => x !== e)])
  }, [])

  /** Retire un email de la liste mémorisée sur cet appareil. */
  const oublierEmail = useCallback((email: string) => {
    const e = normaliserEmail(email)
    setEmails((prev) => prev.filter((x) => x !== e))
  }, [])

  const seDeconnecter = useCallback(() => {
    setCurrentUser(null)
    storage.remove('currentUser')
  }, [])

  // --- Créneaux ---

  /**
   * Génère les créneaux d'une semaine à partir des heures retenues par
   * le directeur, jour par jour (index 0 = lundi … 4 = vendredi).
   * Les créneaux déjà existants sont conservés tels quels.
   */
  const genererCreneauxSemaine = useCallback(
    (
      lundiISO: string,
      heuresParJour: string[][],
    ): { erreur: string | null; ajoutes: number } => {
      const dates = datesDeLaSemaine(lundiISO)
      const nouveaux: Slot[] = []

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i]
        // Un jour peut rester vide : aucune disponibilité ce jour-là.
        for (const time of heuresParJour[i] ?? []) {
          const existeDeja =
            slots.some((s) => s.date === date && s.time === time) ||
            nouveaux.some((s) => s.date === date && s.time === time)
          if (existeDeja) continue
          nouveaux.push({ id: storage.uid(), date, time, status: 'libre' })
        }
      }

      if (nouveaux.length === 0) {
        return {
          erreur:
            'Aucun nouveau créneau à générer : aucune heure retenue, ou toutes existent déjà.',
          ajoutes: 0,
        }
      }
      setSlots((prev) => [...prev, ...nouveaux])
      return { erreur: null, ajoutes: nouveaux.length }
    },
    [slots],
  )

  const supprimerSlot = useCallback((id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id || s.status !== 'libre'))
  }, [])

  // --- Rendez-vous ---

  const creerRendezVous = useCallback(
    (data: {
      profil: Profil
      nom: string
      prenom: string
      objectif: string
      slotId: string
    }): string | null => {
      if (!currentUser) return 'Vous devez être connecté.'

      // Verrou : on ne réserve que si le créneau est encore libre.
      const slot = slots.find((s) => s.id === data.slotId)
      if (!slot) return 'Créneau introuvable.'
      if (slot.status !== 'libre') {
        return 'Ce créneau vient d’être pris. Veuillez en choisir un autre.'
      }

      const rdv: Appointment = {
        id: storage.uid(),
        userEmail: currentUser.email,
        profil: data.profil,
        nom: data.nom.trim(),
        prenom: data.prenom.trim(),
        objectif: data.objectif.trim(),
        slotId: data.slotId,
        status: 'en_attente',
        createdAt: new Date().toISOString(),
      }
      setAppointments((prev) => [...prev, rdv])
      setSlots((prev) =>
        prev.map((s) =>
          s.id === data.slotId ? { ...s, status: 'en_attente' } : s,
        ),
      )
      return null
    },
    [currentUser, slots],
  )

  const accepterRendezVous = useCallback(
    (id: string) => {
      const rdv = appointments.find((a) => a.id === id)
      if (!rdv || rdv.status !== 'en_attente') return
      const suivants = appointments.map((a) =>
        a.id === id ? { ...a, status: 'accepte' as const } : a,
      )
      setAppointments(suivants)
      setSlots((prev) => reconcilier(prev, suivants))
    },
    [appointments],
  )

  const refuserRendezVous = useCallback(
    (id: string) => {
      const rdv = appointments.find((a) => a.id === id)
      if (!rdv || rdv.status !== 'en_attente') return
      const suivants = appointments.map((a) =>
        a.id === id ? { ...a, status: 'refuse' as const } : a,
      )
      setAppointments(suivants)
      // Le créneau redevient libre, sauf s'il est repris par un autre rdv.
      setSlots((prev) => reconcilier(prev, suivants))
    },
    [appointments],
  )

  // --- Admins ---

  const ajouterAdmin = useCallback(
    (
      email: string,
      perms: { canManageAppointments: boolean; canManageSlots: boolean },
    ): string | null => {
      const e = normaliserEmail(email)
      if (!e) return 'Veuillez saisir une adresse email.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Adresse email invalide.'
      if (e === DIRECTEUR_EMAIL) return 'Le directeur est déjà administrateur.'
      if (admins.some((a) => normaliserEmail(a.email) === e)) {
        return 'Cet administrateur existe déjà.'
      }
      setAdmins((prev) => [...prev, { email: e, ...perms }])
      return null
    },
    [admins],
  )

  const supprimerAdmin = useCallback((email: string) => {
    const e = normaliserEmail(email)
    if (e === DIRECTEUR_EMAIL) return
    setAdmins((prev) => prev.filter((a) => normaliserEmail(a.email) !== e))
  }, [])

  return {
    currentUser,
    admins,
    slots,
    appointments,
    emails,
    role,
    seConnecter,
    seDeconnecter,
    oublierEmail,
    genererCreneauxSemaine,
    supprimerSlot,
    creerRendezVous,
    accepterRendezVous,
    refuserRendezVous,
    ajouterAdmin,
    supprimerAdmin,
  }
}

export type Store = ReturnType<typeof useStore>
