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
        <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">SHAH Wallet</h2>
          </div>
          
          {/* Navigation */}
          <nav className="p-4 space-y-6">
            {/* Main Navigation */}
            <div className="nav-section">
              <div className="nav-section-title">Main</div>
              {navItems.filter(item => item.section === 'main').map((item) => (
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
            </div>

            {/* DeFi Section */}
            <div className="nav-section">
              <div className="nav-section-title">DeFi</div>
              {navItems.filter(item => item.section === 'defi').map((item) => (
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
            </div>

            {/* Tools Section */}
            <div className="nav-section">
              <div className="nav-section-title">Tools</div>
              {navItems.filter(item => item.section === 'tools').map((item) => (
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
            </div>

            {/* Other Section */}
            <div className="nav-section">
              <div className="nav-section-title">Other</div>
              {navItems.filter(item => item.section === 'other').map((item) => (
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
            </div>
          </nav>
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex justify-center">
              <NotifBell />
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto h-screen bg-gray-950">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </Providers>
  )
}


