'use client'

import { useMemo } from 'react'
import { formatDateHeure, formatSlot } from '../lib/format'
import type { Store } from '../lib/store'
import { BadgeRdv, Card, EtatVide } from './ui'

export function MesRendezVous({ store }: { store: Store }) {
  const mesRdv = useMemo(() => {
    const email = store.currentUser?.email
    return store.appointments
      .filter((a) => a.userEmail === email)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [store.appointments, store.currentUser])

  return (
    <Card>
      <h2 className="text-lg font-semibold text-encre-forte">Mes rendez-vous</h2>
      <p className="mb-6 mt-1 text-sm text-doux">
        Suivez l’état de vos demandes.
      </p>

      {mesRdv.length === 0 ? (
        <EtatVide>Vous n’avez encore aucune demande de rendez-vous.</EtatVide>
      ) : (
        <ul className="space-y-3">
          {mesRdv.map((rdv) => {
            const slot = store.slots.find((s) => s.id === rdv.slotId)
            return (
              <li
                key={rdv.id}
                className="rounded-xl border border-bordure-forte bg-fond p-5 transition-colors duration-200 hover:border-accent-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold capitalize text-encre-forte">
                      {formatSlot(slot)}
                    </p>
                    <p className="mt-1 text-sm text-doux">
                      {rdv.profil} — {rdv.prenom} {rdv.nom}
                    </p>
                  </div>
                  <BadgeRdv status={rdv.status} />
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-encre">
                  {rdv.objectif}
                </p>

                {rdv.status === 'accepte' && (
                  <p className="mt-4 rounded-lg border border-vert-300 bg-vert-100 px-3 py-2 text-sm capitalize text-vert-600">
                    Rendez-vous confirmé : {formatSlot(slot)}
                  </p>
                )}
                {rdv.status === 'refuse' && (
                  <p className="mt-4 rounded-lg border border-brique-300 bg-brique-100 px-3 py-2 text-sm text-brique-600">
                    Demande refusée. Vous pouvez soumettre une nouvelle demande
                    sur un autre créneau.
                  </p>
                )}

                <p className="mt-4 text-xs text-doux">
                  Demande envoyée le {formatDateHeure(rdv.createdAt)}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
