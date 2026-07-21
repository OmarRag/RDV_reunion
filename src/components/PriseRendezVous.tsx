'use client'

import { useMemo, useState } from 'react'
import { grouperParJour, heureFin } from '../lib/creneaux'
import { formatDate, formatSlot } from '../lib/format'
import { PROFILS } from '../lib/types'
import type { Profil, Slot } from '../lib/types'
import type { Store } from '../lib/store'
import { Alerte, Button, Champ, EtatVide, classesInput } from './ui'

const ETAPES = [
  { titre: 'Profil', sousTitre: 'Qui êtes-vous ?' },
  { titre: 'Identité', sousTitre: 'Vos nom et prénom' },
  { titre: 'Objectif', sousTitre: 'Le motif de la réunion' },
  { titre: 'Créneau', sousTitre: 'Choisissez un horaire disponible' },
  { titre: 'Récapitulatif', sousTitre: 'Vérifiez avant de confirmer' },
]

function BarreProgression({ etape }: { etape: number }) {
  const pourcentage = (etape / (ETAPES.length - 1)) * 100

  return (
    <div className="mb-10">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-sm font-medium text-accent-600">
          Étape {etape + 1} sur {ETAPES.length}
        </p>
        <p className="text-sm text-doux">{ETAPES[etape].titre}</p>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-fond-3"
        role="progressbar"
        aria-valuenow={etape + 1}
        aria-valuemin={1}
        aria-valuemax={ETAPES.length}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-500 to-vert-500 transition-all duration-500 ease-out"
          style={{ width: `${pourcentage}%` }}
        />
      </div>

      <ol className="mt-4 hidden justify-between gap-2 sm:flex">
        {ETAPES.map((e, i) => (
          <li
            key={e.titre}
            className={`text-xs font-medium transition-colors duration-300 ${
              i === etape
                ? 'text-accent-600'
                : i < etape
                  ? 'text-vert-500'
                  : 'text-doux/70'
            }`}
          >
            {i < etape ? '✓ ' : ''}
            {e.titre}
          </li>
        ))}
      </ol>
    </div>
  )
}

function ChoixCreneaux({
  slots,
  slotId,
  onChoisir,
}: {
  slots: Slot[]
  slotId: string
  onChoisir: (id: string) => void
}) {
  const jours = useMemo(() => grouperParJour(slots), [slots])

  if (jours.length === 0) {
    return (
      <EtatVide>
        Aucun créneau n’a encore été publié. Revenez un peu plus tard.
      </EtatVide>
    )
  }

  return (
    <div className="space-y-7">
      {jours.map(({ date, slots: duJour }) => (
        <div key={date}>
          <h3 className="mb-3 text-sm font-semibold capitalize text-encre">
            {formatDate(date)}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {duJour.map((s) => {
              const pris = s.status !== 'libre'
              const choisi = slotId === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={pris}
                  aria-disabled={pris}
                  onClick={() => onChoisir(s.id)}
                  title={pris ? 'Créneau déjà pris' : undefined}
                  className={`rounded-xl border px-3 py-3 text-center text-sm transition-all duration-200 ease-out ${
                    pris
                      ? 'cursor-not-allowed border-bordure-forte bg-fond-2 text-doux/70 line-through'
                      : choisi
                        ? 'border-accent-400 bg-accent-100 text-accent-600 shadow-sm shadow-accent-600/15 ring-2 ring-accent-200'
                        : 'border-bordure-forte bg-surface text-encre hover:-translate-y-0.5 hover:border-accent-300 hover:bg-accent-100/60'
                  }`}
                >
                  <span className="block font-semibold">{s.time}</span>
                  <span className="mt-0.5 block text-xs opacity-70">
                    {pris ? 'Déjà pris' : `→ ${heureFin(s.time)}`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function PriseRendezVous({
  store,
  onTermine,
}: {
  store: Store
  onTermine: () => void
}) {
  const [etape, setEtape] = useState(0)
  const [profil, setProfil] = useState<Profil | ''>('')
  // Pré-remplissage depuis le compte Google, librement modifiable ensuite.
  const [nom, setNom] = useState(() => store.currentUser?.nom ?? '')
  const [prenom, setPrenom] = useState(() => store.currentUser?.prenom ?? '')
  const [objectif, setObjectif] = useState('')
  const [slotId, setSlotId] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  const slotChoisi = store.slots.find((s) => s.id === slotId)

  function suivant() {
    setErreur(null)
    if (etape === 0 && !profil) return setErreur('Veuillez choisir un profil.')
    if (etape === 1 && (!nom.trim() || !prenom.trim())) {
      return setErreur('Veuillez saisir votre nom et votre prénom.')
    }
    if (etape === 2 && !objectif.trim()) {
      return setErreur('Veuillez décrire l’objectif de la réunion.')
    }
    if (etape === 3 && !slotId) {
      return setErreur('Veuillez choisir un créneau disponible.')
    }
    setEtape((e) => e + 1)
  }

  function precedent() {
    setErreur(null)
    setEtape((e) => Math.max(0, e - 1))
  }

  async function confirmer() {
    if (!profil) return
    const err = await store.creerRendezVous({
      profil,
      nom,
      prenom,
      objectif,
      slotId,
    })
    if (err) {
      setErreur(err)
      setSlotId('')
      setEtape(3)
      return
    }
    onTermine()
  }

  return (
    <div className="animate-apparition rounded-2xl border border-bordure bg-surface p-6 shadow-sm shadow-encre/5 sm:p-9">
      <BarreProgression etape={etape} />

      {/* La clé sur l'étape rejoue l'animation à chaque changement de page. */}
      <div key={etape} className="animate-etape">
        <h2 className="text-xl font-semibold tracking-tight text-encre-forte">
          {ETAPES[etape].titre}
        </h2>
        <p className="mb-7 mt-1 text-sm text-doux">
          {ETAPES[etape].sousTitre}
        </p>

        {etape === 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROFILS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setProfil(p)
                  setErreur(null)
                }}
                className={`rounded-xl border px-4 py-4 text-sm font-semibold transition-all duration-200 ease-out ${
                  profil === p
                    ? 'border-accent-400 bg-accent-100 text-accent-600 shadow-sm shadow-accent-600/15 ring-2 ring-accent-200'
                    : 'border-bordure-forte bg-surface text-encre hover:-translate-y-0.5 hover:border-accent-300 hover:bg-accent-100/60'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {etape === 1 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Champ label="Nom">
              <input
                className={classesInput}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex. Benali"
              />
            </Champ>
            <Champ label="Prénom">
              <input
                className={classesInput}
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex. Sara"
              />
            </Champ>
          </div>
        )}

        {etape === 2 && (
          <Champ label="Objectif de la réunion">
            <textarea
              className={`${classesInput} min-h-40 resize-y`}
              value={objectif}
              onChange={(e) => setObjectif(e.target.value)}
              placeholder="Décrivez brièvement le motif de votre demande…"
            />
          </Champ>
        )}

        {etape === 3 && (
          <>
            <p className="mb-5 text-xs text-doux">
              Chaque rendez-vous dure 30 minutes. Les créneaux grisés sont déjà
              réservés.
            </p>
            <ChoixCreneaux
              slots={store.slots}
              slotId={slotId}
              onChoisir={(id) => {
                setSlotId(id)
                setErreur(null)
              }}
            />
          </>
        )}

        {etape === 4 && (
          <dl className="divide-y divide-bordure overflow-hidden rounded-xl border border-bordure">
            {[
              ['Profil', profil],
              ['Nom et prénom', `${prenom} ${nom}`],
              ['Objectif', objectif],
              ['Créneau', formatSlot(slotChoisi)],
            ].map(([cle, valeur]) => (
              <div
                key={cle}
                className="grid gap-1 bg-fond px-4 py-3.5 sm:grid-cols-3"
              >
                <dt className="text-sm font-medium text-doux">{cle}</dt>
                <dd className="whitespace-pre-wrap text-sm text-encre-forte first-letter:capitalize sm:col-span-2">
                  {valeur}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {erreur && (
        <div className="mt-5">
          <Alerte>{erreur}</Alerte>
        </div>
      )}

      <div className="mt-8 flex justify-between gap-3 border-t border-bordure pt-6">
        <Button
          variante="secondaire"
          onClick={precedent}
          disabled={etape === 0}
        >
          ← Précédent
        </Button>
        {etape < ETAPES.length - 1 ? (
          <Button onClick={suivant}>Suivant →</Button>
        ) : (
          <Button variante="succes" onClick={confirmer}>
            Confirmer la demande
          </Button>
        )}
      </div>
    </div>
  )
}
