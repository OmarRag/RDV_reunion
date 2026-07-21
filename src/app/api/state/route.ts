import { NextResponse } from 'next/server'
import { lireEtat } from '../../../lib/server/rdv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** État partagé complet (créneaux, rendez-vous, admins) en une seule requête. */
export async function GET() {
  try {
    const etat = await lireEtat()
    return NextResponse.json(etat)
  } catch (e) {
    console.error('GET /api/state', e)
    return NextResponse.json({ erreur: 'Erreur serveur.' }, { status: 500 })
  }
}
