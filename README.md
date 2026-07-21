# Prise de rendez-vous — Plateforme technologique de recherche

Application de prise de rendez-vous avec le directeur de la plateforme
technologique de recherche. Next.js (App Router), React, TypeScript et
Tailwind CSS.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
```

| Script          | Rôle                                    |
| --------------- | --------------------------------------- |
| `npm run dev`   | Serveur de développement (port 5173)    |
| `npm run build` | Build de production                     |
| `npm run start` | Sert le build de production             |
| `npm run lint`  | Oxlint                                  |

## Fonctionnement

- **Connexion** : simulation d'un écran Google, sans authentification réelle.
  Les emails déjà utilisés sont mémorisés sur l'appareil et proposés à la
  connexion suivante.
- **Rôles** : `directeur@gmail.com` est administrateur avec tous les droits.
  Il peut désigner d'autres administrateurs et leur déléguer la gestion des
  rendez-vous et/ou des créneaux — jamais celle des administrateurs.
- **Demandeur** : parcours en cinq étapes (profil, identité, objectif,
  créneau, récapitulatif), puis suivi de ses demandes.
- **Administration** : définition des disponibilités du lundi au vendredi
  (plusieurs plages par jour, rendez-vous de 30 min espacés d'une heure),
  puis acceptation ou refus des demandes.

## État des données

Tout est stocké dans le **localStorage** du navigateur, sous le préfixe
`rdv:`. Il n'y a ni base de données ni authentification côté serveur : les
données ne sont ni partagées entre appareils, ni persistantes au-delà du
navigateur. Le branchement d'une vraie base et de l'authentification Google
est une étape ultérieure.

Toute l'application est rendue côté client (`app/page.tsx` ne monte
l'interface qu'une fois dans le navigateur), puisque son état initial est lu
depuis le localStorage.

## Déploiement

Hébergé sur Vercel, déployé automatiquement à chaque push sur `main`.
