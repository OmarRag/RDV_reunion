import { NextResponse } from 'next/server'
import { changerStatutRdv } from '../../../../lib/server/rdv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Accepte ou refuse un rdv. Body : { action: 'accepter' | 'refuser' }. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { action } = await req.json()
    if (action !== 'accepter' && action !== 'refuser') {
      return NextResponse.json({ erreur: 'Action invalide.' }, { status: 400 })
    }
    await changerStatutRdv(id, action)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/appointments/[id]', e)
    return NextResponse.json({ erreur: 'Erreur serveur.' }, { status: 500 })
  }
}
