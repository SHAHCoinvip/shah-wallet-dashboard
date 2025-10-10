'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Providers from '@/app/providers'
import { Toaster } from 'react-hot-toast'
import NotifBell from '@/components/NotifBell'

const navItems = [
  // Main Navigation
  { name: 'Dashboard', href: '/', icon: '🏠' },
  { name: 'Discover', href: '/discover', icon: '🔍' },
  { name: 'Swap', href: '/swap', icon: '🔄' },
  
  // DeFi Section
  { name: 'Farming', href: '/farming', icon: '🌾' },
  { name: 'Pools', href: '/pools', icon: '💧' },
  { name: 'Launchpad', href: '/launchpad', icon: '🚀' },
  
  // Tools Section
  { name: 'Factory', href: '/factory', icon: '🏭' },
  { name: 'Verify Factory', href: '/factory/verify', icon: '✅' },
  
  // Other
  { name: 'Shahcoin', href: '/shahcoin-wallet', icon: '🪙' },
  { name: 'Telegram Mini App', href: '/telegram', icon: '📱' },
  { name: 'Settings', href: '/settings/alerts', icon: '⚙️' },
]

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <Providers>
      <Toaster position="top-center" />
      
      <div className="flex bg-[var(--color-bg)] text-[var(--color-text)]">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Logo */}
          <div className="sidebar-logo">
            <div className="w-8 h-8 bg-[var(--color-gold)] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">S</span>
            </div>
            <span>SHAH Wallet</span>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${
                  pathname === item.href ? 'active' : ''
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-[#2a2a2a]">
            <div className="flex justify-center">
              <NotifBell />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-60">
          <div className="main-container fade-in">
            {children}
          </div>
        </main>
      </div>
    </Providers>
  )
}