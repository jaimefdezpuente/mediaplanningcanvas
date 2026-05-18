import type { Metadata } from 'next'
import './globals.css'
import GoogleAnalytics from './components/GoogleAnalytics'

export const metadata: Metadata = {
  title: 'Media Planning Canvas — The Marketing Plan Generator',
  description: 'Crea tu plan de marketing completo con IA. La metodología de Jaime Fernández de la Puente-Campano, probada en 10 años en escuelas de negocio.',
  icons: { icon: '/favicon.svg' },
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || ''

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
        {children}
      </body>
    </html>
  )
}
