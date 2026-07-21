import { NextResponse } from 'next/server'
import { genererCreneaux } from '../../../lib/server/rdv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Génère les créneaux d'une semaine. Body : { lundiISO, heuresParJour }. */
export async function POST(req: Request) {
  try {
    const { lundiISO, heuresParJour } = await req.json()
    if (typeof lundiISO !== 'string' || !Array.isArray(heuresParJour)) {
      return NextResponse.json({ erreur: 'Requête invalide.' }, { status: 400 })
    }
    const res = await genererCreneaux(lundiISO, heuresParJour)
    return NextResponse.json(res)
  } catch (e) {
    console.error('POST /api/slots', e)
    return NextResponse.json({ erreur: 'Erreur serveur.', ajoutes: 0 }, { status: 500 })
  }
}
