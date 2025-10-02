import './globals.css'
import './fallback.css' // Fallback CSS for production
import RootShell from '@/components/RootShell'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  )
}
