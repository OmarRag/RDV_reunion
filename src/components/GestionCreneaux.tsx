'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DUREE_RDV,
  JOURS_SEMAINE,
  candidatsHeures,
  datesDeLaSemaine,
  genererHeures,
  grouperParJour,
  heureFin,
  lundiDeLaSemaine,
  plagesSeChevauchent,
  versISO,
  versMinutes,
} from '../lib/creneaux'
import { uid } from '../lib/storage'
import { formatDate } from '../lib/format'
import type { Store } from '../lib/store'
import { Alerte, BadgeSlot, Button, Card, EtatVide, classesInput } from './ui'

/**
 * Une plage horaire d'un jour.
 * `choisies` vaut null tant que l'admin n'a rien ajusté : les créneaux
 * proposés par défaut s'appliquent. Dès qu'il coche ou décoche une heure,
 * la sélection devient explicite.
 */
type Plage = {
  id: string
  debut: string
  fin: string
  choisies: string[] | null
}

const plagesVides = (): Plage[][] => JOURS_SEMAINE.map(() => [])

/** Heures effectivement retenues : la sélection explicite, sinon les défauts. */
function heuresRetenues(p: Plage): string[] {
  if (!p.debut || !p.fin || versMinutes(p.fin) <= versMinutes(p.debut)) return []
  return p.choisies ?? genererHeures(p.debut, p.fin)
}

/** « 10:00 » → « 10h », « 10:30 » → « 10h30 ». */
function enHeureCourte(h: string): string {
  const [hh, mm] = h.split(':')
  return mm === '00' ? `${Number(hh)}h` : `${Number(hh)}h${mm}`
}

/** Résumé d'une plage repliée. */
function resumePlage(p: Plage): string {
  if (!p.debut || !p.fin) return 'Plage incomplète'
  return `${enHeureCourte(p.debut)}–${enHeureCourte(p.fin)}`
}

export function GestionCreneaux({ store }: { store: Store }) {
  const [lundi, setLundi] = useState(() => lundiDeLaSemaine(versISO(new Date())))
  const [plages, setPlages] = useState<Plage[][]>(plagesVides)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)
  // Accordéon : une seule plage dépliée à la fois, tous jours confondus.
  const [plageOuverte, setPlageOuverte] = useState<string | null>(null)

  const dates = useMemo(() => datesDeLaSemaine(lundi), [lundi])
  const jours = useMemo(() => grouperParJour(store.slots), [store.slots])

  function majJour(jour: number, maj: (liste: Plage[]) => Plage[]) {
    setErreur(null)
    setSucces(null)
    setPlages((prev) => prev.map((l, i) => (i === jour ? maj(l) : l)))
  }

  function ajouterPlage(jour: number) {
    const nouvelle: Plage = { id: uid(), debut: '', fin: '', choisies: null }
    majJour(jour, (liste) => [...liste, nouvelle])
    // La plage précédemment ouverte se referme, la nouvelle se déplie.
    setPlageOuverte(nouvelle.id)
  }

  function supprimerPlage(jour: number, id: string) {
    majJour(jour, (liste) => liste.filter((p) => p.id !== id))
    setPlageOuverte((ouverte) => (ouverte === id ? null : ouverte))
  }

  function majPlage(jour: number, id: string, champ: 'debut' | 'fin', v: string) {
    // Changer les bornes réinitialise la sélection sur les créneaux proposés.
    majJour(jour, (liste) =>
      liste.map((p) => (p.id === id ? { ...p, [champ]: v, choisies: null } : p)),
    )
  }

  function basculerHeure(jour: number, id: string, heure: string) {
    majJour(jour, (liste) =>
      liste.map((p) => {
        if (p.id !== id) return p
        const actuelles = heuresRetenues(p)
        const suivantes = actuelles.includes(heure)
          ? actuelles.filter((h) => h !== heure)
          : [...actuelles, heure].sort((a, b) => a.localeCompare(b))
        return { ...p, choisies: suivantes }
      }),
    )
  }

  /** Indices des plages en conflit avec une autre plage du même jour. */
  function idsEnConflit(liste: Plage[]): Set<string> {
    const conflits = new Set<string>()
    const valides = liste.filter(
      (p) => p.debut && p.fin && versMinutes(p.fin) > versMinutes(p.debut),
    )
    for (let a = 0; a < valides.length; a++) {
      for (let b = a + 1; b < valides.length; b++) {
        if (plagesSeChevauchent(valides[a], valides[b])) {
          conflits.add(valides[a].id)
          conflits.add(valides[b].id)
        }
      }
    }
    return conflits
  }

  /** Une plage est enregistrable si elle est complète, cohérente et sans conflit. */
  function plageValide(p: Plage, liste: Plage[]): boolean {
    return Boolean(
      p.debut &&
        p.fin &&
        versMinutes(p.fin) > versMinutes(p.debut) &&
        !idsEnConflit(liste).has(p.id),
    )
  }

  /**
   * Replie la plage ouverte : elle est conservée si elle est valide,
   * abandonnée sinon. Appelé à la confirmation comme au changement de jour.
   */
  function fermerPlageOuverte() {
    const id = plageOuverte
    if (!id) return
    const jour = plages.findIndex((liste) => liste.some((p) => p.id === id))
    setPlageOuverte(null)
    if (jour === -1) return
    const plage = plages[jour].find((p) => p.id === id)
    if (plage && !plageValide(plage, plages[jour])) {
      setPlages((prev) =>
        prev.map((liste, i) =>
          i === jour ? liste.filter((p) => p.id !== id) : liste,
        ),
      )
    }
  }

  // Quitter la zone d'édition (clic ailleurs, autre jour, perte de focus)
  // replie automatiquement la plage ouverte.
  const editeurRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!plageOuverte) return
    function auDehors(e: Event) {
      const cible = e.target as Node | null
      if (!cible || editeurRef.current?.contains(cible)) return
      fermerPlageOuverte()
    }
    document.addEventListener('mousedown', auDehors)
    document.addEventListener('focusin', auDehors)
    return () => {
      document.removeEventListener('mousedown', auDehors)
      document.removeEventListener('focusin', auDehors)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plageOuverte, plages])

  function generer(e: React.FormEvent) {
    e.preventDefault()
    setSucces(null)

    // Les plages incomplètes ou incohérentes sont abandonnées, comme au repli.
    const retenues = plages.map((liste) =>
      liste.filter(
        (p) => p.debut && p.fin && versMinutes(p.fin) > versMinutes(p.debut),
      ),
    )

    for (let i = 0; i < retenues.length; i++) {
      if (idsEnConflit(retenues[i]).size > 0) {
        return setErreur(
          `${JOURS_SEMAINE[i]} : deux plages se chevauchent. Corrigez-les avant de générer.`,
        )
      }
    }

    // Les plages d'un même jour sont fusionnées, sans doublon d'heure.
    const heuresParJour = retenues.map((liste) => [
      ...new Set(liste.flatMap(heuresRetenues)),
    ])

    const { erreur: err, ajoutes } = store.genererCreneauxSemaine(
      lundi,
      heuresParJour,
    )
    if (err) return setErreur(err)
    setErreur(null)
    setSucces(
      `${ajoutes} créneau${ajoutes > 1 ? 'x' : ''} généré${ajoutes > 1 ? 's' : ''}.`,
    )
    setPlages(plagesVides())
    setPlageOuverte(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-encre-forte">
          Définir mes disponibilités
        </h2>
        <p className="mt-1 text-sm text-doux">
          Du lundi au vendredi, autant de plages horaires que nécessaire par
          jour. Les rendez-vous durent {DUREE_RDV} min et sont espacés d’une
          heure, afin de garder une marge si un entretien déborde. Les créneaux
          proposés sont modifiables un par un. Laissez un jour sans plage s’il
          n’y a aucune disponibilité.
        </p>

        <form onSubmit={generer} className="mt-6">
          <label className="block max-w-xs">
            <span className="mb-2 block text-sm font-medium text-encre">
              Semaine du
            </span>
            <input
              type="date"
              className={classesInput}
              value={lundi}
              onChange={(e) => {
                if (!e.target.value) return
                setLundi(lundiDeLaSemaine(e.target.value))
                setErreur(null)
                setSucces(null)
              }}
            />
            <span className="mt-1.5 block text-xs text-doux">
              La date est automatiquement ramenée au lundi de la semaine.
            </span>
          </label>

          <div className="mt-6 space-y-3">
            {JOURS_SEMAINE.map((jour, i) => {
              const conflits = idsEnConflit(plages[i])
              return (
                <div
                  key={jour}
                  className="rounded-xl border border-bordure-forte bg-fond p-4 transition-colors duration-200 hover:border-accent-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-encre-forte">
                        {jour}
                      </p>
                      <p className="text-xs text-doux">{formatDate(dates[i])}</p>
                    </div>
                    <Button
                      type="button"
                      variante="secondaire"
                      onClick={() => ajouterPlage(i)}
                    >
                      + Ajouter une plage
                    </Button>
                  </div>

                  {plages[i].length === 0 ? (
                    <p className="mt-3 text-xs text-doux">
                      Aucune disponibilité ce jour-là.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {plages[i].map((p, n) => {
                        const apercu = heuresRetenues(p)
                        const candidats =
                          p.debut &&
                          p.fin &&
                          versMinutes(p.fin) > versMinutes(p.debut)
                            ? candidatsHeures(p.debut, p.fin)
                            : []
                        const enConflit = conflits.has(p.id)
                        const ouverte = plageOuverte === p.id

                        // Plage repliée : résumé compact + actions.
                        if (!ouverte) {
                          return (
                            <div
                              key={p.id}
                              className={`animate-apparition flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-surface px-3 py-2.5 ${
                                enConflit
                                  ? 'border-brique-300 ring-2 ring-brique-100'
                                  : 'border-bordure'
                              }`}
                            >
                              <div>
                                <p className="text-sm font-semibold text-encre-forte">
                                  {resumePlage(p)}
                                </p>
                                <p className="mt-0.5 text-xs text-doux">
                                  {enConflit
                                    ? 'Chevauche une autre plage du même jour.'
                                    : `${apercu.length} créneau${apercu.length > 1 ? 'x' : ''}`}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variante="secondaire"
                                  onClick={() => setPlageOuverte(p.id)}
                                >
                                  Modifier
                                </Button>
                                <Button
                                  type="button"
                                  variante="danger"
                                  onClick={() => supprimerPlage(i, p.id)}
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={p.id}
                            ref={editeurRef}
                            className={`animate-apparition rounded-lg border bg-surface p-3 ${
                              enConflit
                                ? 'border-brique-300 ring-2 ring-brique-100'
                                : 'border-accent-300 ring-2 ring-accent-100'
                            }`}
                          >
                            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                              <label className="text-xs text-doux">
                                Plage {n + 1} — début
                                <input
                                  type="time"
                                  className={`${classesInput} mt-1`}
                                  value={p.debut}
                                  onChange={(e) =>
                                    majPlage(i, p.id, 'debut', e.target.value)
                                  }
                                />
                              </label>
                              <label className="text-xs text-doux">
                                Fin
                                <input
                                  type="time"
                                  className={`${classesInput} mt-1`}
                                  value={p.fin}
                                  onChange={(e) =>
                                    majPlage(i, p.id, 'fin', e.target.value)
                                  }
                                />
                              </label>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  onClick={() => {
                                    if (!plageValide(p, plages[i])) {
                                      return setErreur(
                                        `${jour} : renseignez une plage complète et sans chevauchement.`,
                                      )
                                    }
                                    setErreur(null)
                                    setPlageOuverte(null)
                                  }}
                                >
                                  Confirmer
                                </Button>
                                <Button
                                  type="button"
                                  variante="danger"
                                  onClick={() => supprimerPlage(i, p.id)}
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </div>

                            {enConflit && (
                              <p className="mt-3 text-xs font-medium text-brique-600">
                                Cette plage en chevauche une autre du même jour.
                              </p>
                            )}

                            {apercu.length > 0 && (
                              <p className="animate-apparition mt-3 text-xs text-accent-600">
                                {apercu.length} créneau
                                {apercu.length > 1 ? 'x' : ''} :{' '}
                                {apercu.join(' · ')}
                              </p>
                            )}

                            {candidats.length > 0 && (
                              <div className="mt-3">
                                <p className="mb-2 text-xs text-doux">
                                  Cliquez pour ouvrir ou fermer un créneau :
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {candidats.map((h) => {
                                    const retenu = apercu.includes(h)
                                    return (
                                      <button
                                        key={h}
                                        type="button"
                                        aria-pressed={retenu}
                                        onClick={() =>
                                          basculerHeure(i, p.id, h)
                                        }
                                        title={`${h} – ${heureFin(h)}`}
                                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                                          retenu
                                            ? 'border-accent-400 bg-accent-100 text-accent-600'
                                            : 'border-bordure-forte bg-fond-2 text-doux hover:border-accent-300 hover:text-encre'
                                        }`}
                                      >
                                        {h}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6">
            <Button type="submit">Générer les créneaux de la semaine</Button>
          </div>
        </form>

        {erreur && (
          <div className="mt-4">
            <Alerte>{erreur}</Alerte>
          </div>
        )}
        {succes && (
          <div className="mt-4">
            <Alerte type="succes">{succes}</Alerte>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-encre-forte">
          Créneaux existants
        </h2>
        <p className="mb-6 mt-1 text-sm text-doux">
          Tous les créneaux que vous avez générés. Seuls ceux encore libres
          peuvent être supprimés.
        </p>

        {jours.length === 0 ? (
          <EtatVide>
            Aucun créneau pour le moment. Utilisez le formulaire ci-dessus pour
            en générer.
          </EtatVide>
        ) : (
          <div className="space-y-6">
            {jours.map(({ date, slots }) => (
              <div key={date}>
                <h3 className="mb-3 text-sm font-semibold capitalize text-encre">
                  {formatDate(date)}
                </h3>
                <ul className="space-y-2">
                  {slots.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bordure-forte bg-fond px-4 py-3 transition-colors duration-200 hover:border-accent-300"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-semibold text-encre-forte">
                          {s.time} – {heureFin(s.time)}
                        </span>
                        <BadgeSlot status={s.status} />
                      </div>
                      {s.status === 'libre' ? (
                        <Button
                          variante="danger"
                          onClick={() => store.supprimerSlot(s.id)}
                        >
                          Supprimer
                        </Button>
                      ) : (
                        <span className="text-xs text-doux">
                          Créneau occupé — suppression impossible
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
