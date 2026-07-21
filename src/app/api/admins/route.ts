import { NextResponse } from 'next/server'
import { ajouterAdmin } from '../../../lib/server/rdv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Ajoute un administrateur secondaire. Body : { email, canManageAppointments, canManageSlots }. */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const erreur = await ajouterAdmin(String(body.email ?? ''), {
      canManageAppointments: Boolean(body.canManageAppointments),
      canManageSlots: Boolean(body.canManageSlots),
    })
    return NextResponse.json({ erreur })
  } catch (e) {
    console.error('POST /api/admins', e)
    return NextResponse.json({ erreur: 'Erreur serveur.' }, { status: 500 })
  }
}
