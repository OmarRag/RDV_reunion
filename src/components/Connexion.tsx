import { useState } from 'react'
import { Alerte, Button, Logo, classesInput } from './ui'

const IMAGE_FOND =
  'https://mobile.ledesk.ma/wp-content/uploads/2025/07/um6ss-casa-1.jpeg'

function LogoGoogle({ taille = 18 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

/**
 * Colonne image : 75 % de la largeur sur écran large, bandeau en portrait.
 * L'image remplit la colonne en `cover`, sans voile.
 */
function ColonneImage() {
  return (
    <div className="relative h-52 w-full shrink-0 overflow-hidden sm:h-64 md:h-auto md:w-3/4">
      <img
        src={IMAGE_FOND}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    </div>
  )
}

/** Faux écran Google — aucune authentification réelle, simple simulation. */
function EcranGoogle({
  emails,
  onValider,
  onOublier,
  onAnnuler,
}: {
  emails: string[]
  onValider: (email: string) => void
  onOublier: (email: string) => void
  onAnnuler: () => void
}) {
  // On propose d'emblée les comptes connus ; sinon, saisie libre.
  const [saisieLibre, setSaisieLibre] = useState(emails.length === 0)
  const [email, setEmail] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  function valider(e: React.FormEvent) {
    e.preventDefault()
    const valeur = email.trim()
    if (!valeur) return setErreur('Veuillez saisir votre adresse email.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur)) {
      return setErreur('Adresse email invalide.')
    }
    onValider(valeur)
  }

  function oublier(cible: string) {
    onOublier(cible)
    // Plus aucun compte mémorisé : on bascule sur la saisie libre.
    if (emails.length <= 1) setSaisieLibre(true)
  }

  return (
    <div className="animate-voile fixed inset-0 z-50 flex items-center justify-center bg-encre/40 p-4 backdrop-blur-sm">
      <div className="animate-apparition w-full max-w-md rounded-2xl border border-bordure bg-surface p-8 shadow-2xl shadow-encre/20">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoGoogle taille={40} />
          <h2 className="mt-4 text-2xl font-normal text-encre-forte">
            {saisieLibre ? 'Connexion' : 'Choisir un compte'}
          </h2>
          <p className="mt-1 text-sm text-doux">
            {saisieLibre
              ? 'Utiliser votre compte Google'
              : 'Pour continuer vers Prise de rendez-vous'}
          </p>
        </div>

        {saisieLibre ? (
          <form onSubmit={valider} className="space-y-4">
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErreur(null)
              }}
              placeholder="Adresse email"
              className={classesInput}
            />
            {erreur && <Alerte>{erreur}</Alerte>}
            <p className="text-xs text-doux">
              Simulation : aucune authentification réelle n’est effectuée.
            </p>
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variante="fantome"
                onClick={() => {
                  if (emails.length === 0) return onAnnuler()
                  setErreur(null)
                  setSaisieLibre(false)
                }}
              >
                {emails.length === 0 ? 'Annuler' : 'Retour'}
              </Button>
              <Button type="submit">Suivant</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <ul className="divide-y divide-bordure overflow-hidden rounded-xl border border-bordure">
              {emails.map((e) => (
                <li key={e} className="flex items-stretch bg-fond">
                  <button
                    type="button"
                    onClick={() => onValider(e)}
                    className="flex flex-1 items-center gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-accent-100"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500 text-sm font-semibold uppercase text-surface"
                    >
                      {e.slice(0, 1)}
                    </span>
                    <span className="truncate text-sm text-encre-forte">
                      {e}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => oublier(e)}
                    aria-label={`Retirer ${e} de la liste`}
                    title="Retirer de la liste"
                    className="px-4 text-lg leading-none text-doux transition-colors duration-200 hover:bg-brique-100 hover:text-brique-600"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                setEmail('')
                setErreur(null)
                setSaisieLibre(true)
              }}
              className="w-full rounded-xl border border-dashed border-bordure-forte px-4 py-3 text-sm font-semibold text-accent-600 transition-colors duration-200 hover:bg-accent-100"
            >
              Utiliser un autre email
            </button>

            <p className="text-xs text-doux">
              Simulation : aucune authentification réelle n’est effectuée.
            </p>

            <div className="pt-1">
              <Button type="button" variante="fantome" onClick={onAnnuler}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function Connexion({
  emails,
  onConnexion,
  onOublierEmail,
}: {
  emails: string[]
  onConnexion: (email: string) => void
  onOublierEmail: (email: string) => void
}) {
  const [ouvert, setOuvert] = useState(false)

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <ColonneImage />

      {/*
        Panneau de connexion : 25 % à droite sur écran large, opaque.
        Une largeur minimale évite qu'il devienne illisible sur les
        écrans juste au-dessus du point de rupture.
      */}
      <div className="flex w-full flex-1 flex-col justify-center border-panneau-bord bg-panneau px-6 py-10 md:w-1/4 md:min-w-80 md:flex-none md:border-l md:px-8">
        <div className="animate-apparition mx-auto w-full max-w-sm text-center">
          <div className="mb-7 flex justify-center">
            <Logo hauteur={96} />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-encre-forte">
            Prise de rendez-vous
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-encre">
            Réservez un entretien avec le directeur de la plateforme
            technologique de recherche.
          </p>

          <button
            onClick={() => setOuvert(true)}
            className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-bordure-forte bg-surface px-4 py-3 text-sm font-semibold text-encre-forte shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent-300 hover:bg-fond hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            <LogoGoogle />
            Se connecter avec Google
          </button>
        </div>
      </div>

      {ouvert && (
        <EcranGoogle
          emails={emails}
          onValider={onConnexion}
          onOublier={onOublierEmail}
          onAnnuler={() => setOuvert(false)}
        />
      )}
    </div>
  )
}
