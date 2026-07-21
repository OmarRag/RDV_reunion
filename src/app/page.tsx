'use client'

import { useEffect, useState } from 'react'
import { AppRdv } from '../components/AppRdv'

/**
 * Point d'entrée. Le store lit le localStorage (session, emails) dès
 * l'initialisation de son état : l'application n'est donc montée qu'une fois
 * dans le navigateur. Les données partagées, elles, sont ensuite chargées
 * depuis la base via l'API. Aucun rendu serveur de l'interface, donc aucun
 * écart d'hydratation.
 */
export default function Page() {
  const [pret, setPret] = useState(false)

  useEffect(() => {
    setPret(true)
  }, [])

  if (!pret) return null

  return <AppRdv />
}
