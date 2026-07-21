import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { purgerCreneauxDemo } from './lib/storage'

// Nettoyage unique des créneaux de démonstration des versions précédentes.
// Les créneaux sont désormais créés uniquement par l'admin.
purgerCreneauxDemo()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
