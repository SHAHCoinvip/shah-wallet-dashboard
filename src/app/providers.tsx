"use client"

import React from 'react'
import { WagmiConfig } from 'wagmi'
import { http } from 'wagmi'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, bsc, arbitrum } from 'viem/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Ensure RainbowKit styles are included once at app root
import '@rainbow-me/rainbowkit/styles.css'

const rpcMainnet = process.env.NEXT_PUBLIC_RPC_MAINNET || 'https://ethereum-rpc.publicnode.com'
const rpcPolygon = process.env.NEXT_PUBLIC_RPC_POLYGON || 'https://polygon-rpc.com'
const rpcBsc = process.env.NEXT_PUBLIC_RPC_BSC || 'https://bsc-dataseed.binance.org'
const rpcArbitrum = process.env.NEXT_PUBLIC_RPC_ARBITRUM || 'https://arb1.arbitrum.io/rpc'

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  process.env.WALLETCONNECT_PROJECT_ID ||
  'c3a53d6cc4381d7bde9cd287d5dc1773'

const config = getDefaultConfig({
  appName: 'SHAH Wallet',
  projectId: walletConnectProjectId,
  chains: [mainnet, polygon, bsc, arbitrum],
  ssr: true,
  // Custom RPC transports per chain from env
  transports: {
    [mainnet.id]: http(rpcMainnet),
    [polygon.id]: http(rpcPolygon),
    [bsc.id]: http(rpcBsc),
    [arbitrum.id]: http(rpcArbitrum),
  },
  // getDefaultConfig sets up WalletConnect, Injected (MetaMask/Brave), and Coinbase by default.
  // WalletConnect will be presented prominently in the modal; others act as fallbacks.
})

// Create a client
const queryClient = new QueryClient()

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  )
}
