import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

/**
 * Configuration NextAuth (Auth.js v5).
 *
 * Authentification réelle des UTILISATEURS via Google OAuth. Le directeur et
 * les administrateurs conservent, pour l'instant, leur accès par saisie d'email
 * (géré côté client, hors NextAuth) — ce sera repris à une étape ultérieure.
 *
 * Session par JWT (cookie) : l'utilisateur reste connecté jusqu'à déconnexion.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Laisse toujours l'utilisateur choisir son compte Google.
      authorization: { params: { prompt: 'select_account' } },
    }),
  ],
  callbacks: {
    // Récupère prénom / nom réels depuis le profil Google au moment du login.
    jwt({ token, profile }) {
      if (profile) {
        const p = profile as { given_name?: string; family_name?: string }
        token.given_name = p.given_name ?? null
        token.family_name = p.family_name ?? null
      }
      return token
    },
    // Les expose sur la session pour le pré-remplissage du formulaire de rdv.
    session({ session, token }) {
      if (session.user) {
        if (typeof token.given_name === 'string') {
          session.user.prenom = token.given_name
        }
        if (typeof token.family_name === 'string') {
          session.user.nom = token.family_name
        }
      }
      return session
    },
  },
})
