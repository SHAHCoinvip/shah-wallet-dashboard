'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useAccount, useBalance } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  Home,
  Compass,
  Factory,
  Layers,
  Sprout,
  Rocket,
  Droplets,
  ArrowLeftRight,
  Settings,
  Network,
  Smartphone,
} from 'lucide-react'
import Providers, { wagmiConfig } from '@/app/providers'
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

const truncateAddress = (address?: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { address, isConnected, chainId } = useAccount()
  const { data: balance } = useBalance({
    address,
    query: { enabled: !!address },
  })

  const activeChain = chainId ? wagmiConfig.chains.find((chain) => chain.id === chainId) : undefined

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.25)' }}
            >
              <Image src="/shah-gold-logo.png" alt="SHAH Wallet" width={28} height={28} priority />
            </div>
            <div>
              <h1>SHAH Wallet</h1>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.75rem' }}>Royal DeFi Suite</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <span>v1.0.0</span>
          <NotifBell />
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <div className="status-pill">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#00C27D' }} />
              {activeChain?.name ?? 'Wallet Not Connected'}
            </div>
            {isConnected && balance?.formatted && (
              <div className="balance-pill">
                <span>Balance</span>
                <strong>{parseFloat(balance.formatted).toFixed(4)}</strong>
                <span>{balance.symbol}</span>
              </div>
            )}
          </div>

          <div className="topbar-right">
            {isConnected && <div className="wallet-pill">{truncateAddress(address)}</div>}
            <ConnectButton chainStatus="icon" showBalance={false} accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} />
          </div>
        </header>

        <main className="main-container fade-in">{children}</main>
      </div>
    </div>
  )
}

export default function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Toaster position="top-center" />
      <ShellContent>{children}</ShellContent>
    </Providers>
  )
}
