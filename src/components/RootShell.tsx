'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Providers from '@/app/providers'
import { Toaster } from 'react-hot-toast'
import NotifBell from '@/components/NotifBell'

const navItems = [
  // Main Navigation
  { name: 'Dashboard', href: '/', section: 'main' },
  { name: 'Discover', href: '/discover', section: 'main' },
  { name: 'Swap', href: '/swap', section: 'main' },
  
  // DeFi Section
  { name: 'Farming', href: '/farming', section: 'defi' },
  { name: 'Pools', href: '/pools', section: 'defi' },
  { name: 'Launchpad', href: '/launchpad', section: 'defi' },
  
  // Tools Section
  { name: 'Factory', href: '/factory', section: 'tools' },
  { name: 'Verify Factory', href: '/factory/verify', section: 'tools' },
  
  // Other
  { name: 'Shahcoin', href: '/shahcoin-wallet', section: 'other' },
  { name: 'Telegram Mini App', href: '/telegram', section: 'other' },
  { name: 'Settings', href: '/settings/alerts', section: 'other' },
]

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <Providers>
      <Toaster position="top-center" />
      
      {/* Test badge to verify Tailwind utilities work */}
      <div className="fixed top-4 right-4 z-50">
        <span className="test-badge">Tailwind Test</span>
      </div>
      
      <div className="flex bg-gray-950 text-white">
        <aside className="w-64 min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">SHAH Wallet</h2>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item block ${
                    pathname === item.href ? 'nav-item-active' : ''
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex justify-center">
              <NotifBell />
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
          {children}
        </main>
      </div>
    </Providers>
  )
}


