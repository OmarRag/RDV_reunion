import { NextResponse } from 'next/server'
import { creerRendezVous } from '../../../lib/server/rdv'
import type { Profil } from '../../../lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Crée une demande de rendez-vous (avec verrou sur le créneau). */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const erreur = await creerRendezVous({
      userEmail: String(body.userEmail ?? ''),
      profil: body.profil as Profil,
      nom: String(body.nom ?? ''),
      prenom: String(body.prenom ?? ''),
      objectif: String(body.objectif ?? ''),
      slotId: String(body.slotId ?? ''),
    })
    return NextResponse.json({ erreur })
  } catch (e) {
    console.error('POST /api/appointments', e)
    return NextResponse.json({ erreur: 'Erreur serveur.' }, { status: 500 })
  }
}
