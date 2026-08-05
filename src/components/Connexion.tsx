'use client'

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Connexion({
  onGoogle,
  onDemanderCode,
  onConnecterCode,
  onAdminLogin,
}: {
  onGoogle: () => void
  onDemanderCode: (email: string) => Promise<string | null>
  onConnecterCode: (email: string, code: string) => Promise<string | null>
  onAdminLogin: (email: string) => void
}) {
  // Connexion par code email.
  const [emailCode, setEmailCode] = useState('')
  const [code, setCode] = useState('')
  const [codeEnvoye, setCodeEnvoye] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [messageCode, setMessageCode] = useState<string | null>(null)
  const [erreurCode, setErreurCode] = useState<string | null>(null)

  // Accès administrateur temporaire : replié par défaut.
  const [adminOuvert, setAdminOuvert] = useState(false)
  const [email, setEmail] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  async function demanderCode(e: React.FormEvent) {
    e.preventDefault()
    const valeur = emailCode.trim()
    setErreurCode(null)
    if (!EMAIL_RE.test(valeur)) return setErreurCode('Adresse email invalide.')
    setOccupe(true)
    const err = await onDemanderCode(valeur)
    setOccupe(false)
    if (err) return setErreurCode(err)
    setCodeEnvoye(true)
    setMessageCode(`Code envoyé à ${valeur}. Vérifiez votre boîte mail.`)
  }

  async function validerCode(e: React.FormEvent) {
    e.preventDefault()
    setErreurCode(null)
    if (!/^\d{6}$/.test(code.trim())) {
      return setErreurCode('Le code comporte 6 chiffres.')
    }
    setOccupe(true)
    const err = await onConnecterCode(emailCode.trim(), code.trim())
    setOccupe(false)
    if (err) return setErreurCode(err)
    // Session établie : on recharge pour que l'app reflète l'état connecté.
    window.location.reload()
  }

  function validerAdmin(e: React.FormEvent) {
    e.preventDefault()
    const valeur = email.trim()
    if (!valeur) return setErreur('Veuillez saisir votre adresse email.')
    if (!EMAIL_RE.test(valeur)) {
      return setErreur('Adresse email invalide.')
    }
    onAdminLogin(valeur)
  }

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
            onClick={onGoogle}
            className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-bordure-forte bg-surface px-4 py-3 text-sm font-semibold text-encre-forte shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent-300 hover:bg-fond hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            <LogoGoogle />
            Se connecter avec Google
          </button>

          {/* Connexion alternative : code à usage unique reçu par email. */}
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-3 text-xs text-doux">
              <span className="h-px flex-1 bg-bordure-forte" />
              ou par email
              <span className="h-px flex-1 bg-bordure-forte" />
            </div>

            {!codeEnvoye ? (
              <form onSubmit={demanderCode} className="space-y-3 text-left">
                <input
                  type="email"
                  value={emailCode}
                  onChange={(e) => {
                    setEmailCode(e.target.value)
                    setErreurCode(null)
                  }}
                  placeholder="Votre adresse email"
                  className={classesInput}
                />
                {erreurCode && <Alerte>{erreurCode}</Alerte>}
                <Button type="submit" className="w-full" disabled={occupe}>
                  {occupe ? 'Envoi…' : 'Recevoir un code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={validerCode} className="space-y-3 text-left">
                {messageCode && <Alerte type="succes">{messageCode}</Alerte>}
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, ''))
                    setErreurCode(null)
                  }}
                  placeholder="Code à 6 chiffres"
                  className={`${classesInput} text-center text-lg tracking-[0.4em]`}
                />
                {erreurCode && <Alerte>{erreurCode}</Alerte>}
                <Button type="submit" className="w-full" disabled={occupe}>
                  {occupe ? 'Vérification…' : 'Se connecter'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setCodeEnvoye(false)
                    setCode('')
                    setMessageCode(null)
                    setErreurCode(null)
                  }}
                  className="w-full text-xs font-medium text-doux underline-offset-2 transition-colors duration-200 hover:text-encre hover:underline"
                >
                  Changer d’email ou renvoyer un code
                </button>
              </form>
            )}
          </div>

          {/* Accès administrateur temporaire (repris à une étape ultérieure). */}
          <div className="mt-8">
            {!adminOuvert ? (
              <button
                type="button"
                onClick={() => setAdminOuvert(true)}
                className="text-xs font-medium text-doux underline-offset-2 transition-colors duration-200 hover:text-encre hover:underline"
              >
                Accès administrateur
              </button>
            ) : (
              <form
                onSubmit={validerAdmin}
                className="animate-apparition space-y-3 text-left"
              >
                <div className="flex items-center gap-2 text-xs text-doux">
                  <span className="h-px flex-1 bg-bordure-forte" />
                  Accès administrateur (temporaire)
                  <span className="h-px flex-1 bg-bordure-forte" />
                </div>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErreur(null)
                  }}
                  placeholder="Adresse email administrateur"
                  className={classesInput}
                />
                {erreur && <Alerte>{erreur}</Alerte>}
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variante="fantome"
                    onClick={() => {
                      setAdminOuvert(false)
                      setErreur(null)
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">Entrer</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
