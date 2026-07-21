'use client'

import { useEffect, useState } from 'react'
import { AppRdv } from '../components/AppRdv'
import { purgerCreneauxDemo } from '../lib/storage'

/**
 * Point d'entrée. Le store lit le localStorage dès l'initialisation de son
 * état : l'application n'est donc montée qu'une fois dans le navigateur.
 * Le rendu serveur ne produit rien, exactement comme l'ancien index.html
 * de Vite — ni erreur de rendu serveur, ni écart d'hydratation.
 */
export default function Page() {
  const [pret, setPret] = useState(false)

  useEffect(() => {
    // Nettoyage unique des créneaux de démonstration des versions
    // précédentes, avant toute lecture du store — même ordre qu'avant.
    purgerCreneauxDemo()
    setPret(true)
  }, [])

  if (!pret) return null

  return <AppRdv />
}
