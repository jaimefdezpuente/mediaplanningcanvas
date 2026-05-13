import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Media Planning Canvas — Crea tu Plan de Marketing con IA',
  description: 'La metodología de marketing digital creada por Jaime Fernández de la Puente-Campano. Crea tu plan de marketing completo en minutos usando IA.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body style={{ position: 'relative', zIndex: 1 }}>{children}</body>
    </html>
  )
}
