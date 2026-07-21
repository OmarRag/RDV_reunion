'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as storage from './storage'
import { calculerRole, normaliserEmail } from './roles'
import type {
  Admin,
  Appointment,
  CurrentUser,
  Profil,
  Slot,
} from './types'

// Réexports pour compatibilité avec les anciens imports.
export { calculerRole, normaliserEmail } from './roles'

type EtatPartage = {
  slots: Slot[]
  appointments: Appointment[]
  admins: Admin[]
}

const ETAT_VIDE: EtatPartage = { slots: [], appointments: [], admins: [] }

/** Intervalle de rafraîchissement des données partagées, en millisecondes. */
const INTERVALLE_SYNC = 5000

const ERREUR_RESEAU = 'Connexion au serveur impossible. Veuillez réessayer.'

export function useStore() {
  // Session locale à l'appareil : conservée en localStorage, comme avant.
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() =>
    storage.get('currentUser'),
  )
  const [emails, setEmails] = useState<string[]>(() => storage.get('emails'))

  // Données PARTAGÉES : lues depuis la base Neon via l'API.
  const [etat, setEtat] = useState<EtatPartage>(ETAT_VIDE)

  useEffect(() => {
    storage.set('currentUser', currentUser)
  }, [currentUser])
  useEffect(() => {
    storage.set('emails', emails)
  }, [emails])

  const rafraichir = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' })
      if (!res.ok) return
      setEtat((await res.json()) as EtatPartage)
    } catch {
      // Réseau indisponible : on conserve l'état courant sans le vider.
    }
  }, [])

  // Chargement initial, puis rafraîchissement périodique et au retour sur
  // l'onglet : les données partagées restent à jour entre appareils.
  useEffect(() => {
    rafraichir()
    const timer = setInterval(rafraichir, INTERVALLE_SYNC)
    const onFocus = () => rafraichir()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [rafraichir])

  const role = useMemo(
    () => calculerRole(currentUser?.email, etat.admins),
    [currentUser, etat.admins],
  )

  // --- Session ---

  const seConnecter = useCallback((email: string) => {
    const e = normaliserEmail(email)
    setCurrentUser({ email: e })
    // Mémorisation sans doublon, le plus récent en tête (local à l'appareil).
    setEmails((prev) => [e, ...prev.filter((x) => x !== e)])
  }, [])

  const oublierEmail = useCallback((email: string) => {
    const e = normaliserEmail(email)
    setEmails((prev) => prev.filter((x) => x !== e))
  }, [])

  const seDeconnecter = useCallback(() => {
    setCurrentUser(null)
    storage.remove('currentUser')
  }, [])

  // --- Créneaux ---

  const genererCreneauxSemaine = useCallback(
    async (
      lundiISO: string,
      heuresParJour: string[][],
    ): Promise<{ erreur: string | null; ajoutes: number }> => {
      try {
        const res = await fetch('/api/slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lundiISO, heuresParJour }),
        })
        const data = await res.json()
        await rafraichir()
        return { erreur: data.erreur ?? null, ajoutes: data.ajoutes ?? 0 }
      } catch {
        return { erreur: ERREUR_RESEAU, ajoutes: 0 }
      }
    },
    [rafraichir],
  )

  const supprimerSlot = useCallback(
    async (id: string): Promise<void> => {
      try {
        await fetch(`/api/slots/${id}`, { method: 'DELETE' })
        await rafraichir()
      } catch {
        /* ignoré : le prochain rafraîchissement rétablira l'état réel */
      }
    },
    [rafraichir],
  )

  // --- Rendez-vous ---

  const creerRendezVous = useCallback(
    async (data: {
      profil: Profil
      nom: string
      prenom: string
      objectif: string
      slotId: string
    }): Promise<string | null> => {
      if (!currentUser) return 'Vous devez être connecté.'
      try {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, userEmail: currentUser.email }),
        })
        const body = await res.json()
        await rafraichir()
        return body.erreur ?? null
      } catch {
        return ERREUR_RESEAU
      }
    },
    [currentUser, rafraichir],
  )

  const changerStatut = useCallback(
    async (id: string, action: 'accepter' | 'refuser') => {
      try {
        await fetch(`/api/appointments/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        await rafraichir()
      } catch {
        /* ignoré : le prochain rafraîchissement rétablira l'état réel */
      }
    },
    [rafraichir],
  )

  const accepterRendezVous = useCallback(
    (id: string) => changerStatut(id, 'accepter'),
    [changerStatut],
  )
  const refuserRendezVous = useCallback(
    (id: string) => changerStatut(id, 'refuser'),
    [changerStatut],
  )

  // --- Admins ---

  const ajouterAdmin = useCallback(
    async (
      email: string,
      perms: { canManageAppointments: boolean; canManageSlots: boolean },
    ): Promise<string | null> => {
      try {
        const res = await fetch('/api/admins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, ...perms }),
        })
        const body = await res.json()
        await rafraichir()
        return body.erreur ?? null
      } catch {
        return ERREUR_RESEAU
      }
    },
    [rafraichir],
  )

  const supprimerAdmin = useCallback(
    async (email: string): Promise<void> => {
      try {
        await fetch(`/api/admins/${encodeURIComponent(normaliserEmail(email))}`, {
          method: 'DELETE',
        })
        await rafraichir()
      } catch {
        /* ignoré : le prochain rafraîchissement rétablira l'état réel */
      }
    },
    [rafraichir],
  )

  return {
    currentUser,
    slots: etat.slots,
    appointments: etat.appointments,
    admins: etat.admins,
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
