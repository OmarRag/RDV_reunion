import { NextResponse } from 'next/server'
import { supprimerAdmin } from '../../../../lib/server/rdv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Retire un administrateur secondaire (le directeur est protégé). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ email: string }> },
) {
  try {
    const { email } = await params
    await supprimerAdmin(decodeURIComponent(email))
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/admins/[email]', e)
    return NextResponse.json({ erreur: 'Erreur serveur.' }, { status: 500 })
  }
}
