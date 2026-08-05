import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './lib/prisma'
import { normaliserEmail } from './lib/roles'
import { OTP_MAX_ATTEMPTS, hacherCode } from './lib/otp'

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
    // Méthode alternative : code à usage unique reçu par email (voir /api/otp).
    Credentials({
      id: 'email-otp',
      name: 'Code par email',
      credentials: { email: {}, code: {} },
      async authorize(creds) {
        const email = normaliserEmail(String(creds?.email ?? ''))
        const code = String(creds?.code ?? '')
        if (!email || !/^\d{6}$/.test(code)) return null

        const rec = await prisma.emailOtp.findUnique({ where: { email } })
        if (!rec) return null

        // Expiré ou trop de tentatives : on invalide.
        if (rec.expiresAt < new Date() || rec.attempts >= OTP_MAX_ATTEMPTS) {
          await prisma.emailOtp.delete({ where: { email } }).catch(() => {})
          return null
        }

        if (hacherCode(code) !== rec.codeHash) {
          await prisma.emailOtp.update({
            where: { email },
            data: { attempts: { increment: 1 } },
          })
          return null
        }

        // Succès : le code est consommé.
        await prisma.emailOtp.delete({ where: { email } }).catch(() => {})
        return { id: email, email }
      },
    }),
  ],
  callbacks: {
    // Récupère prénom / nom réels depuis le profil Google au moment du login,
    // et garantit la présence de l'email dans le token (Google comme code email).
    jwt({ token, user, profile }) {
      if (user?.email) token.email = user.email
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
