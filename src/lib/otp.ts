import { createHmac, randomInt } from 'crypto'

/** Durée de validité d'un code, en minutes. */
export const OTP_TTL_MINUTES = 10

/** Nombre maximal de tentatives de saisie avant invalidation du code. */
export const OTP_MAX_ATTEMPTS = 5

/** Génère un code numérique à 6 chiffres (avec zéros de tête). */
export function genererCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

/**
 * Empreinte du code : on ne stocke jamais le code en clair en base.
 * HMAC-SHA256 clé par le secret NextAuth (jamais versionné).
 */
export function hacherCode(code: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? ''
  return createHmac('sha256', secret).update(code).digest('hex')
}
