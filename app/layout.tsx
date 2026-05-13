import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Media Planning Canvas — The Marketing Plan Generator',
  description: 'Crea tu plan de marketing completo con IA. La metodología de Jaime Fernández de la Puente-Campano, probada en 10 años en escuelas de negocio.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
