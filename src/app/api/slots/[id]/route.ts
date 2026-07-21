import { NextResponse } from 'next/server'
import { supprimerSlot } from '../../../../lib/server/rdv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Supprime un créneau (sans effet s'il n'est pas libre). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await supprimerSlot(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/slots/[id]', e)
    return NextResponse.json({ erreur: 'Erreur serveur.' }, { status: 500 })
  }
}
