export interface LiteWalletMeta {
  id: string
  label: string
  address: string
  createdAt: string
  backedUp: boolean
  encrypted: boolean
}

export interface ExternalWalletMeta {
  address: string
  label: string
  connectedAt: string
  connector: string // 'metamask', 'walletconnect', etc.
}

export interface VaultData {
  id: string
  iv: string
  salt: string
  ciphertext: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface WalletState {
  liteWallets: LiteWalletMeta[]
  externalWallets: ExternalWalletMeta[]
  activeSigner: {
    type: 'lite' | 'external'
    id: string
    address: string
  } | null
  locked: boolean
  autoLockTimeout: number
  lastActivity: number
}

export interface CreateWalletParams {
  label: string
  password: string
  strength?: 128 | 256
}

export interface ImportWalletParams {
  mnemonic: string
  passphrase?: string
  label: string
  password: string
}

export interface UnlockParams {
  walletId: string
  password: string
}

export interface AutoLockOptions {
  timeout: number // milliseconds
  enabled: boolean
}

export type WalletAction = 
  | { type: 'CREATE_WALLET'; payload: LiteWalletMeta }
  | { type: 'IMPORT_WALLET'; payload: LiteWalletMeta }
  | { type: 'DELETE_WALLET'; payload: { id: string } }
  | { type: 'UPDATE_WALLET'; payload: Partial<LiteWalletMeta> & { id: string } }
  | { type: 'ADD_EXTERNAL_WALLET'; payload: ExternalWalletMeta }
  | { type: 'REMOVE_EXTERNAL_WALLET'; payload: { address: string } }
  | { type: 'SET_ACTIVE_SIGNER'; payload: WalletState['activeSigner'] }
  | { type: 'LOCK' }
  | { type: 'UNLOCK' }
  | { type: 'SET_AUTO_LOCK'; payload: AutoLockOptions }
  | { type: 'UPDATE_ACTIVITY' } 