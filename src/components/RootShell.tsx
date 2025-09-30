'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Providers from '@/app/providers'
import { Toaster } from 'react-hot-toast'
import NotifBell from '@/components/NotifBell'

const navItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'Discover', href: '/discover' },
  { name: 'Factory', href: '/factory' },
  { name: 'Verify Factory', href: '/factory/verify' },
  { name: 'Farming', href: '/farming' },
  { name: 'Launchpad', href: '/launchpad' },
  { name: 'Pools', href: '/pools' },
  { name: 'Settings', href: '/settings/alerts' },
  { name: 'Shahcoin', href: '/shahcoin-wallet' },
  { name: 'Swap', href: '/swap' },
  { name: 'Telegram Mini App', href: '/telegram' },
]

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <Providers>
      <Toaster position="top-center" />
      <div className="flex bg-gray-950 text-white">
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
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex justify-center">
              <NotifBell />
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto h-screen">
          {children}
        </main>
      </div>
    </Providers>
  )
}


