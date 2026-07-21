import { useMemo, useState } from 'react'
import { formatDateHeure, formatSlot } from '../lib/format'
import type { AppointmentStatus } from '../lib/types'
import type { Store } from '../lib/store'
import { BadgeRdv, Button, Card, EtatVide } from './ui'

const FILTRES: { cle: AppointmentStatus | 'tous'; libelle: string }[] = [
  { cle: 'tous', libelle: 'Tous' },
  { cle: 'en_attente', libelle: 'En attente' },
  { cle: 'accepte', libelle: 'Acceptés' },
  { cle: 'refuse', libelle: 'Refusés' },
]

export function GestionRendezVous({ store }: { store: Store }) {
  const [filtre, setFiltre] = useState<AppointmentStatus | 'tous'>('tous')

  const rdvs = useMemo(() => {
    const tries = [...store.appointments].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
    return filtre === 'tous' ? tries : tries.filter((a) => a.status === filtre)
  }, [store.appointments, filtre])

  const nbAttente = store.appointments.filter(
    (a) => a.status === 'en_attente',
  ).length

  return (
    <Card>
      <h2 className="text-lg font-semibold text-encre-forte">
        Gestion des rendez-vous
      </h2>
      <p className="mb-6 mt-1 text-sm text-doux">
        {nbAttente > 0
          ? `${nbAttente} demande${nbAttente > 1 ? 's' : ''} en attente de traitement.`
          : 'Aucune demande en attente.'}
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.cle}
            onClick={() => setFiltre(f.cle)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
              filtre === f.cle
                ? 'border-accent-300 bg-accent-100 text-accent-600'
                : 'border-bordure-forte bg-fond text-doux hover:border-accent-300 hover:text-encre'
            }`}
          >
            {f.libelle}
          </button>
        ))}
      </div>

      {rdvs.length === 0 ? (
        <EtatVide>Aucune demande à afficher.</EtatVide>
      ) : (
        <ul className="space-y-3">
          {rdvs.map((rdv) => {
            const slot = store.slots.find((s) => s.id === rdv.slotId)
            return (
              <li
                key={rdv.id}
                className="rounded-xl border border-bordure-forte bg-fond p-5 transition-colors duration-200 hover:border-accent-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-encre-forte">
                      {rdv.prenom} {rdv.nom}
                      <span className="ml-2 rounded-full border border-bordure-forte bg-fond px-2.5 py-0.5 text-xs font-medium text-encre">
                        {rdv.profil}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-doux">
                      {rdv.userEmail}
                    </p>
                  </div>
                  <BadgeRdv status={rdv.status} />
                </div>

                <p className="mt-3 text-sm font-medium capitalize text-accent-600">
                  Créneau demandé : {formatSlot(slot)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-encre">
                  {rdv.objectif}
                </p>
                <p className="mt-4 text-xs text-doux">
                  Reçue le {formatDateHeure(rdv.createdAt)}
                </p>

                {rdv.status === 'en_attente' && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      variante="succes"
                      onClick={() => store.accepterRendezVous(rdv.id)}
                    >
                      Accepter
                    </Button>
                    <Button
                      variante="danger"
                      onClick={() => store.refuserRendezVous(rdv.id)}
                    >
                      Refuser
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
