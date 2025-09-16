import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WalletState, WalletAction, LiteWalletMeta, ExternalWalletMeta, AutoLockOptions } from './types'
import { vaultStorage, fallbackStorage } from './vault'
import { clearAllSigners, startAutoLockTimer, clearAutoLockTimer, updateActivity } from './signer'

const STORAGE_KEY = 'shah-wallet-state'

// Get storage instance (IndexedDB with localStorage fallback)
const getStorage = () => {
  try {
    return vaultStorage
  } catch {
    return fallbackStorage
  }
}

interface WalletStore extends WalletState {
  // Actions
  createWallet: (wallet: LiteWalletMeta) => void
  importWallet: (wallet: LiteWalletMeta) => void
  deleteWallet: (id: string) => void
  updateWallet: (id: string, updates: Partial<LiteWalletMeta>) => void
  addExternalWallet: (wallet: ExternalWalletMeta) => void
  removeExternalWallet: (address: string) => void
  setActiveSigner: (signer: WalletState['activeSigner']) => void
  lock: () => void
  unlock: () => void
  setAutoLock: (options: AutoLockOptions) => void
  updateActivity: () => void
  
  // Computed
  canCreateWallet: () => boolean
  canAddExternalWallet: () => boolean
  getWalletById: (id: string) => LiteWalletMeta | undefined
  getExternalWalletByAddress: (address: string) => ExternalWalletMeta | undefined
}

const initialState: WalletState = {
  liteWallets: [],
  externalWallets: [],
  activeSigner: null,
  locked: false,
  autoLockTimeout: 15 * 60 * 1000, // 15 minutes
  lastActivity: Date.now()
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      createWallet: (wallet: LiteWalletMeta) => {
        const state = get()
        if (state.liteWallets.length >= 3) {
          throw new Error('Maximum number of lite wallets reached (3)')
        }
        
        set(state => ({
          liteWallets: [...state.liteWallets, wallet]
        }))
      },

      importWallet: (wallet: LiteWalletMeta) => {
        const state = get()
        if (state.liteWallets.length >= 3) {
          throw new Error('Maximum number of lite wallets reached (3)')
        }
        
        // Check if wallet already exists
        const exists = state.liteWallets.some(w => w.address === wallet.address)
        if (exists) {
          throw new Error('Wallet with this address already exists')
        }
        
        set(state => ({
          liteWallets: [...state.liteWallets, wallet]
        }))
      },

      deleteWallet: (id: string) => {
        set(state => ({
          liteWallets: state.liteWallets.filter(w => w.id !== id),
          activeSigner: state.activeSigner?.id === id ? null : state.activeSigner
        }))
      },

      updateWallet: (id: string, updates: Partial<LiteWalletMeta>) => {
        set(state => ({
          liteWallets: state.liteWallets.map(w => 
            w.id === id ? { ...w, ...updates } : w
          )
        }))
      },

      addExternalWallet: (wallet: ExternalWalletMeta) => {
        const state = get()
        if (state.externalWallets.length >= 2) {
          throw new Error('Maximum number of external wallets reached (2)')
        }
        
        // Check if wallet already exists
        const exists = state.externalWallets.some(w => w.address === wallet.address)
        if (exists) {
          throw new Error('External wallet with this address already exists')
        }
        
        set(state => ({
          externalWallets: [...state.externalWallets, wallet]
        }))
      },

      removeExternalWallet: (address: string) => {
        set(state => ({
          externalWallets: state.externalWallets.filter(w => w.address !== address),
          activeSigner: state.activeSigner?.address === address ? null : state.activeSigner
        }))
      },

      setActiveSigner: (signer: WalletState['activeSigner']) => {
        set({ activeSigner: signer })
        updateActivity()
      },

      lock: () => {
        clearAllSigners()
        clearAutoLockTimer()
        set({ 
          locked: true, 
          activeSigner: null,
          lastActivity: Date.now()
        })
      },

      unlock: () => {
        const state = get()
        set({ locked: false })
        
        // Restart auto-lock timer
        if (state.autoLockTimeout > 0) {
          startAutoLockTimer(state.autoLockTimeout, () => {
            get().lock()
          })
        }
        
        updateActivity()
      },

      setAutoLock: (options: AutoLockOptions) => {
        const state = get()
        const newTimeout = options.enabled ? options.timeout : 0
        
        set({ autoLockTimeout: newTimeout })
        
        // Update timer if currently unlocked
        if (!state.locked) {
          if (newTimeout > 0) {
            startAutoLockTimer(newTimeout, () => {
              get().lock()
            })
          } else {
            clearAutoLockTimer()
          }
        }
      },

      updateActivity: () => {
        updateActivity()
        set({ lastActivity: Date.now() })
      },

      // Computed
      canCreateWallet: () => {
        const state = get()
        return state.liteWallets.length < 3
      },

      canAddExternalWallet: () => {
        const state = get()
        return state.externalWallets.length < 2
      },

      getWalletById: (id: string) => {
        const state = get()
        return state.liteWallets.find(w => w.id === id)
      },

      getExternalWalletByAddress: (address: string) => {
        const state = get()
        return state.externalWallets.find(w => w.address === address)
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        liteWallets: state.liteWallets,
        externalWallets: state.externalWallets,
        autoLockTimeout: state.autoLockTimeout
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restart auto-lock timer on rehydration
          if (state.autoLockTimeout > 0 && !state.locked) {
            startAutoLockTimer(state.autoLockTimeout, () => {
              state.lock()
            })
          }
        }
      }
    }
  )
)

// Auto-lock on page visibility change
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const state = useWalletStore.getState()
      if (!state.locked && state.autoLockTimeout > 0) {
        // Lock when page becomes hidden
        state.lock()
      }
    }
  })

  // Activity tracking
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
  activityEvents.forEach(event => {
    document.addEventListener(event, () => {
      const state = useWalletStore.getState()
      if (!state.locked) {
        state.updateActivity()
      }
    }, { passive: true })
  })
} 