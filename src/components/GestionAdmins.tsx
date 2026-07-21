'use client'

import { useState } from 'react'
import { DIRECTEUR_EMAIL } from '../lib/types'
import type { Store } from '../lib/store'
import { Alerte, Button, Card, Champ, EtatVide, classesInput } from './ui'

function Case({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-encre transition-colors duration-200 hover:bg-fond">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-bordure-forte bg-fond-2 text-accent-500 accent-accent-500 focus:ring-accent-500"
      />
      {label}
    </label>
  )
}

export function GestionAdmins({ store }: { store: Store }) {
  const [email, setEmail] = useState('')
  const [rdvPerm, setRdvPerm] = useState(true)
  const [slotsPerm, setSlotsPerm] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)

  function ajouter(e: React.FormEvent) {
    e.preventDefault()
    setSucces(null)
    const err = store.ajouterAdmin(email, {
      canManageAppointments: rdvPerm,
      canManageSlots: slotsPerm,
    })
    if (err) return setErreur(err)
    setErreur(null)
    setSucces('Administrateur ajouté.')
    setEmail('')
    setRdvPerm(true)
    setSlotsPerm(true)
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-encre-forte">
        Gestion des administrateurs
      </h2>
      <p className="mb-6 mt-1 text-sm text-doux">
        Réservé au directeur. La gestion des administrateurs ne peut pas être
        déléguée.
      </p>

      <form
        onSubmit={ajouter}
        className="mb-6 space-y-5 rounded-xl border border-bordure-forte bg-fond p-5"
      >
        <Champ label="Adresse email de l’administrateur">
          <input
            type="email"
            className={classesInput}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErreur(null)
            }}
            placeholder="exemple@gmail.com"
          />
        </Champ>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-encre">
            Permissions
          </legend>
          <div className="space-y-1">
            <Case
              label="Gérer les rendez-vous (accepter / refuser)"
              checked={rdvPerm}
              onChange={setRdvPerm}
            />
            <Case
              label="Gérer les créneaux disponibles (ajouter / supprimer)"
              checked={slotsPerm}
              onChange={setSlotsPerm}
            />
          </div>
        </fieldset>

        <Button type="submit">Ajouter l’administrateur</Button>
      </form>

      {erreur && (
        <div className="mb-4">
          <Alerte>{erreur}</Alerte>
        </div>
      )}
      {succes && (
        <div className="mb-4">
          <Alerte type="succes">{succes}</Alerte>
        </div>
      )}

      <ul className="space-y-2">
        <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-200 bg-accent-100 px-4 py-3.5">
          <div>
            <p className="font-semibold text-encre-forte">{DIRECTEUR_EMAIL}</p>
            <p className="mt-0.5 text-xs text-doux">
              Directeur — tous les droits
            </p>
          </div>
          <span className="text-xs font-semibold text-accent-600">
            Non supprimable
          </span>
        </li>

        {store.admins.length === 0 ? (
          <li>
            <EtatVide>Aucun administrateur secondaire.</EtatVide>
          </li>
        ) : (
          store.admins.map((a) => (
            <li
              key={a.email}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bordure-forte bg-fond px-4 py-3.5 transition-colors duration-200 hover:border-accent-300"
            >
              <div>
                <p className="font-semibold text-encre-forte">{a.email}</p>
                <p className="mt-0.5 text-xs text-doux">
                  {[
                    a.canManageAppointments && 'Rendez-vous',
                    a.canManageSlots && 'Créneaux',
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Aucune permission'}
                </p>
              </div>
              <Button
                variante="danger"
                onClick={() => store.supprimerAdmin(a.email)}
              >
                Supprimer
              </Button>
            </li>
          ))
        )}
      </ul>
    </Card>
  )
}
