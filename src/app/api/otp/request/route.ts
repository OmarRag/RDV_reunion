import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '../../../../lib/prisma'
import { EMAIL_REGEX, normaliserEmail } from '../../../../lib/roles'
import { OTP_TTL_MINUTES, genererCode, hacherCode } from '../../../../lib/otp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Demande un code de connexion à usage unique par email.
 * Génère un code à 6 chiffres, en stocke l'empreinte en base (une entrée par
 * email, écrasée à chaque demande), et l'envoie via Resend.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = normaliserEmail(String(body.email ?? ''))
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ erreur: 'Adresse email invalide.' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      console.error('OTP: RESEND_API_KEY ou EMAIL_FROM manquant.')
      return NextResponse.json(
        { erreur: "L'envoi d'emails n'est pas encore configuré." },
        { status: 500 },
      )
    }

    const code = genererCode()
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000)

    await prisma.emailOtp.upsert({
      where: { email },
      create: { email, codeHash: hacherCode(code), expiresAt, attempts: 0 },
      update: { codeHash: hacherCode(code), expiresAt, attempts: 0 },
    })

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Votre code de connexion : ${code}`,
      text: `Votre code de connexion est : ${code}\n\nIl est valable ${OTP_TTL_MINUTES} minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
      html: `<div style="font-family:system-ui,sans-serif;color:#2c3138">
        <p>Votre code de connexion à <strong>Prise de rendez-vous</strong> :</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
        <p style="color:#7a7f88;font-size:14px">Valable ${OTP_TTL_MINUTES} minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>`,
    })

    if (error) {
      console.error('OTP Resend error', error)
      return NextResponse.json({ erreur: "L'envoi de l'email a échoué." }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST /api/otp/request', e)
    return NextResponse.json({ erreur: 'Erreur serveur.' }, { status: 500 })
  }
}
