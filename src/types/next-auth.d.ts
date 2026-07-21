import type { DefaultSession } from 'next-auth'

// Étend la session NextAuth avec le prénom / nom issus du compte Google.
declare module 'next-auth' {
  interface Session {
    user: {
      prenom?: string
      nom?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    given_name?: string | null
    family_name?: string | null
  }
}
