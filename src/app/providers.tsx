'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

/** Fournit le contexte de session NextAuth à toute l'application (côté client). */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
