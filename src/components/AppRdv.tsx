'use client'

import { useEffect, useMemo, useState } from 'react'
import { Connexion } from './Connexion'
import { GestionAdmins } from './GestionAdmins'
import { GestionCreneaux } from './GestionCreneaux'
import { GestionRendezVous } from './GestionRendezVous'
import { MesRendezVous } from './MesRendezVous'
import { PriseRendezVous } from './PriseRendezVous'
import { Alerte, Button, Logo } from './ui'
import { useStore } from '../lib/store'

type Onglet = { cle: string; libelle: string }

function Entete({
  email,
  sousTitre,
  onDeconnexion,
}: {
  email: string
  sousTitre: string
  onDeconnexion: () => void
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-bordure bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex items-center gap-3.5">
          <Logo hauteur={46} />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-encre-forte">
              Rendez-vous — Plateforme technologique de recherche
            </h1>
            <p className="mt-0.5 text-sm text-accent-600">{sousTitre}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-doux sm:inline">
            {email}
          </span>
          <Button variante="secondaire" onClick={onDeconnexion}>
            Se déconnecter
          </Button>
        </div>
      </div>
    </header>
  )
}

function Navigation({
  onglets,
  actif,
  onChange,
}: {
  onglets: Onglet[]
  actif: string
  onChange: (cle: string) => void
}) {
  return (
    <nav className="mx-auto max-w-5xl px-4 pt-6">
      <div className="flex flex-wrap gap-2">
        {onglets.map((o) => (
          <button
            key={o.cle}
            onClick={() => onChange(o.cle)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 ${
              actif === o.cle
                ? 'bg-accent-500 text-surface shadow-sm shadow-accent-600/20'
                : 'border border-bordure-forte bg-surface text-encre hover:border-accent-300 hover:bg-fond'
            }`}
          >
            {o.libelle}
          </button>
        ))}
      </div>
    </nav>
  )
}

export function AppRdv() {
  const store = useStore()
  const { currentUser, role } = store

  const onglets = useMemo<Onglet[]>(() => {
    if (!currentUser) return []
    if (role.isAdmin) {
      const liste: Onglet[] = []
      if (role.canManageAppointments) {
        liste.push({ cle: 'rdv', libelle: 'Rendez-vous' })
      }
      if (role.canManageSlots) {
        liste.push({ cle: 'creneaux', libelle: 'Créneaux' })
      }
      if (role.canManageAdmins) {
        liste.push({ cle: 'admins', libelle: 'Administrateurs' })
      }
      return liste
    }
    return [
      { cle: 'demande', libelle: 'Demander un rendez-vous' },
      { cle: 'mes-rdv', libelle: 'Mes rendez-vous' },
    ]
  }, [currentUser, role])

  const [actif, setActif] = useState('')

  // Garde le routage cohérent avec les droits (changement d'utilisateur, etc.).
  useEffect(() => {
    if (onglets.length === 0) return
    if (!onglets.some((o) => o.cle === actif)) setActif(onglets[0].cle)
  }, [onglets, actif])

  if (!currentUser) {
    return (
      <Connexion
        emails={store.emails}
        onConnexion={store.seConnecter}
        onOublierEmail={store.oublierEmail}
      />
    )
  }

  const sousTitre = role.isDirecteur
    ? 'Espace directeur'
    : role.isAdmin
      ? 'Espace administrateur'
      : 'Espace demandeur'

  return (
    <div className="fond-app min-h-screen">
      <Entete
        email={currentUser.email}
        sousTitre={sousTitre}
        onDeconnexion={store.seDeconnecter}
      />

      {onglets.length > 1 && (
        <Navigation onglets={onglets} actif={actif} onChange={setActif} />
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        {onglets.length === 0 ? (
          <Alerte type="info">
            Aucune permission ne vous a été attribuée. Contactez le directeur.
          </Alerte>
        ) : (
          <>
            {actif === 'rdv' && role.canManageAppointments && (
              <GestionRendezVous store={store} />
            )}
            {actif === 'creneaux' && role.canManageSlots && (
              <GestionCreneaux store={store} />
            )}
            {actif === 'admins' && role.canManageAdmins && (
              <GestionAdmins store={store} />
            )}
            {actif === 'demande' && !role.isAdmin && (
              <PriseRendezVous
                store={store}
                onTermine={() => setActif('mes-rdv')}
              />
            )}
            {actif === 'mes-rdv' && !role.isAdmin && (
              <MesRendezVous store={store} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
