'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Factory, Layers, Sprout, Rocket, Droplets, ArrowLeftRight, Settings, Network, Smartphone } from 'lucide-react'
import Image from 'next/image'
import Providers from '@/app/providers'
import { Toaster } from 'react-hot-toast'
import NotifBell from '@/components/NotifBell'

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Discover', href: '/discover', icon: Compass },
  { name: 'Blockchain', href: '/shahcoin-wallet', icon: Network },
  { name: 'Factory', href: '/factory', icon: Factory },
  { name: 'Staking', href: '/staking', icon: Layers },
  { name: 'Farming', href: '/farming', icon: Sprout },
  { name: 'Launchpad', href: '/launchpad', icon: Rocket },
  { name: 'Pools', href: '/pools', icon: Droplets },
  { name: 'Swap', href: '/swap', icon: ArrowLeftRight },
  { name: 'Telegram App', href: '/telegram', icon: Smartphone },
  { name: 'Settings', href: '/settings/alerts', icon: Settings },
]

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <Providers>
      <Toaster position="top-center" />
      
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col" style={{ background: '#0A0A0A', borderRight: '1px solid rgba(212, 175, 55, 0.1)' }}>
          {/* Logo */}
          <div className="p-6 border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.1)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center p-1.5" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                <Image src="/shah-gold-logo.png" alt="SHAH" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <div className="text-xl font-semibold" style={{ color: '#F1F1F1' }}>SHAH</div>
                <div className="text-xs" style={{ color: '#A1A1AA' }}>Wallet</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative group"
                  style={{
                    background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    color: isActive ? '#D4AF37' : '#A1A1AA',
                  }}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r" style={{ background: '#D4AF37' }} />
                  )}
                  <Icon className="w-5 h-5" style={{ color: isActive ? '#D4AF37' : '#A1A1AA' }} />
                  <span className="text-sm">{item.name}</span>
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg" style={{ boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)' }} />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.1)' }}>
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: '#A1A1AA' }}>
                v1.0.0
              </div>
              <NotifBell />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64" style={{ background: '#0A0A0A' }}>
          {children}
        </main>
      </div>
    </Providers>
  )
}
