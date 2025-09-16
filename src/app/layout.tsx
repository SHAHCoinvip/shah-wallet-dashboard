'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Providers from '@/app/providers'
import { Toaster } from 'react-hot-toast'
import NotifBell from '@/components/NotifBell'

const navItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Staking', href: '/staking' },
  { name: '🌾 Farming', href: '/farming' },
  { name: 'Swap', href: '/swap' },
  { name: 'Factory', href: '/factory' },
  { name: 'NFTs', href: '/nft' },
  { name: 'Discover', href: '/discover' },
  { name: 'Advanced Features', href: '/advanced' },
  { name: 'Alert Settings', href: '/settings/alerts' },
  { name: 'SHAHCOIN', href: '/shahcoin' },
  { name: 'Launchpad', href: '/launchpad' },
  { name: 'Telegram', href: '/telegram' },
  { name: 'Premium', href: '/premium' },
  { name: 'Admin', href: '/admin' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <html lang="en">
      <body className="flex bg-gray-950 text-white">
        <Providers>
            <Toaster position="top-center" />

            <aside className="w-56 min-h-screen bg-gray-900 p-4 border-r border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-yellow-400">SHAH Wallet</h2>
              <nav className="flex flex-col gap-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`py-2 px-4 rounded-lg transition-all font-medium hover:bg-yellow-500 hover:text-black ${
                      pathname === item.href ? 'bg-yellow-400 text-black' : 'text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
              
              {/* Notification Bell */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex justify-center">
                  <NotifBell />
                </div>
              </div>
            </aside>
            <main className="flex-1 overflow-y-auto h-screen">
              {children}
            </main>
        </Providers>
      </body>
    </html>
  )
}
