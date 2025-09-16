import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: '0bb54f293dc3fccdca208f5d05c50cbe', // ✅ Your real WalletConnect PROJECT_ID
    }),
  ],
  ssr: true,
})
