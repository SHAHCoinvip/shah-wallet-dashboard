import { useCallback, useEffect, useState } from 'react'
import { useWalletStore } from './store'
import { vaultStorage, fallbackStorage, encryptVault, decryptVault } from './vault'
import { deriveEvmKeyFromMnemonic } from './derive'
import { createLiteSigner, setActiveSigner, removeActiveSigner } from './signer'
import { generateMnemonicPhrase, validateMnemonicPhrase } from './mnemonic'
import { useChainId } from 'wagmi'
import { mainnet } from 'viem/chains'
import { 
  registerPasskeyForVault, 
  unlockWithPasskey, 
  disablePasskey, 
  isPasskeyEnabled,
  getPasskeyVaultMeta,
  isWebAuthnSupported,
  isSecureContext
} from './passkeys'

// Get storage instance
const getStorage = () => {
  try {
    return vaultStorage
  } catch {
    return fallbackStorage
  }
}

export function useVault() {
  const [storage] = useState(() => getStorage())

  const saveVault = useCallback(async (id: string, plaintext: string, password: string) => {
    const encrypted = await encryptVault(plaintext, password)
    await storage.saveVault(id, encrypted)
  }, [storage])

  const loadVault = useCallback(async (id: string, password: string) => {
    const encrypted = await storage.loadVault(id)
    if (!encrypted) {
      throw new Error('Vault not found')
    }
    return await decryptVault(encrypted, password)
  }, [storage])

  const deleteVault = useCallback(async (id: string) => {
    await storage.deleteVault(id)
  }, [storage])

  const listVaults = useCallback(async () => {
    return await storage.listVaults()
  }, [storage])

  return {
    saveVault,
    loadVault,
    deleteVault,
    listVaults
  }
}

export function usePasskeys() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSecure, setIsSecure] = useState(false)

  useEffect(() => {
    setIsSupported(isWebAuthnSupported())
    setIsSecure(isSecureContext())
  }, [])

  const enablePasskey = useCallback(async (vaultId: string, vaultKey: ArrayBuffer) => {
    const result = await registerPasskeyForVault(vaultId, vaultKey)
    return result
  }, [])

  const unlockWithPasskey = useCallback(async (vaultId: string) => {
    const result = await unlockWithPasskey(vaultId)
    return result
  }, [])

  const disablePasskey = useCallback(async (vaultId: string) => {
    return await disablePasskey(vaultId)
  }, [])

  const checkPasskeyEnabled = useCallback(async (vaultId: string) => {
    return await isPasskeyEnabled(vaultId)
  }, [])

  const getPasskeyMeta = useCallback(async (vaultId: string) => {
    return await getPasskeyVaultMeta(vaultId)
  }, [])

  return {
    isSupported,
    isSecure,
    enablePasskey,
    unlockWithPasskey,
    disablePasskey,
    checkPasskeyEnabled,
    getPasskeyMeta
  }
}


export function useLiteWallets() {
  const {
    liteWallets,
    createWallet,
    importWallet,
    deleteWallet,
    updateWallet,
    canCreateWallet
  } = useWalletStore()

  const createNewWallet = useCallback(async (params: {
    label: string
    password: string
    strength?: 128 | 256
  }) => {
    const { label, password, strength = 128 } = params
    
    // Generate mnemonic
    const mnemonic = generateMnemonicPhrase(strength)
    
    // Derive private key
    const { privateKey, address } = deriveEvmKeyFromMnemonic(mnemonic)
    
    // Create wallet metadata
    const walletId = `lite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const wallet: any = {
      id: walletId,
      label,
      address,
      createdAt: new Date().toISOString(),
      backedUp: false,
      encrypted: true
    }
    
    // Save encrypted vault
    const { saveVault } = useVault()
    await saveVault(walletId, JSON.stringify({ mnemonic, privateKey }), password)
    
    // Add to store
    createWallet(wallet)
    
    return wallet
  }, [createWallet])

  const importExistingWallet = useCallback(async (params: {
    mnemonic: string
    passphrase?: string
    label: string
    password: string
  }) => {
    const { mnemonic, passphrase, label, password } = params
    
    // Validate mnemonic
    if (!validateMnemonicPhrase(mnemonic)) {
      throw new Error('Invalid mnemonic phrase')
    }
    
    // Derive private key
    const { privateKey, address } = deriveEvmKeyFromMnemonic(mnemonic, passphrase)
    
    // Create wallet metadata
    const walletId = `lite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const wallet: any = {
      id: walletId,
      label,
      address,
      createdAt: new Date().toISOString(),
      backedUp: false,
      encrypted: true
    }
    
    // Save encrypted vault
    const { saveVault } = useVault()
    await saveVault(walletId, JSON.stringify({ mnemonic, privateKey }), password)
    
    // Add to store
    importWallet(wallet)
    
    return wallet
  }, [importWallet])

  const removeWallet = useCallback(async (id: string) => {
    // Delete from storage
    const { deleteVault } = useVault()
    await deleteVault(id)
    
    // Remove from store
    deleteWallet(id)
  }, [deleteWallet])

  const markAsBackedUp = useCallback((id: string) => {
    updateWallet(id, { backedUp: true })
  }, [updateWallet])

  return {
    wallets: liteWallets,
    createWallet: createNewWallet,
    importWallet: importExistingWallet,
    deleteWallet: removeWallet,
    updateWallet,
    markAsBackedUp,
    canCreate: canCreateWallet()
  }
}

export function useExternalWallets() {
  const {
    externalWallets,
    addExternalWallet,
    removeExternalWallet,
    canAddExternalWallet
  } = useWalletStore()

  const addWallet = useCallback((wallet: {
    address: string
    label: string
    connector: string
  }) => {
    const externalWallet = {
      ...wallet,
      connectedAt: new Date().toISOString()
    }
    addExternalWallet(externalWallet)
  }, [addExternalWallet])

  return {
    wallets: externalWallets,
    addWallet,
    removeWallet: removeExternalWallet,
    canAdd: canAddExternalWallet()
  }
}

export function useSignerSelector() {
  const chainId = useChainId()
  const chain = mainnet // Default to mainnet, could be dynamic based on chainId
  
  const {
    liteWallets,
    externalWallets,
    activeSigner,
    setActiveSigner,
    locked
  } = useWalletStore()

  const unlockWallet = useCallback(async (walletId: string, password: string) => {
    const wallet = liteWallets.find(w => w.id === walletId)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    // Load and decrypt vault
    const { loadVault } = useVault()
    const vaultData = await loadVault(walletId, password)
    const { privateKey } = JSON.parse(vaultData)

    // Create signer
    const signer = createLiteSigner(privateKey, chain)
    setActiveSigner(walletId, signer)

    // Set as active signer
    setActiveSigner({
      type: 'lite',
      id: walletId,
      address: wallet.address
    })

    return signer
  }, [liteWallets, setActiveSigner, chain])

  const lockWallet = useCallback(() => {
    if (activeSigner?.type === 'lite') {
      removeActiveSigner(activeSigner.id)
    }
    setActiveSigner(null)
  }, [activeSigner, setActiveSigner])

  const switchToExternalWallet = useCallback((address: string) => {
    const wallet = externalWallets.find(w => w.address === address)
    if (!wallet) {
      throw new Error('External wallet not found')
    }

    setActiveSigner({
      type: 'external',
      id: address,
      address: wallet.address
    })
  }, [externalWallets, setActiveSigner])

  const getActiveWallet = useCallback(() => {
    if (!activeSigner) return null

    if (activeSigner.type === 'lite') {
      return liteWallets.find(w => w.id === activeSigner.id)
    } else {
      return externalWallets.find(w => w.address === activeSigner.address)
    }
  }, [activeSigner, liteWallets, externalWallets])

  return {
    activeSigner,
    activeWallet: getActiveWallet(),
    locked,
    unlockWallet,
    lockWallet,
    switchToExternalWallet,
    liteWallets,
    externalWallets
  }
}

export function useAutoLock() {
  const {
    autoLockTimeout,
    setAutoLock,
    locked
  } = useWalletStore()

  const setAutoLockTimeout = useCallback((timeout: number) => {
    setAutoLock({
      timeout,
      enabled: timeout > 0
    })
  }, [setAutoLock])

  const disableAutoLock = useCallback(() => {
    setAutoLock({
      timeout: 0,
      enabled: false
    })
  }, [setAutoLock])

  return {
    autoLockTimeout,
    setAutoLockTimeout,
    disableAutoLock,
    isEnabled: autoLockTimeout > 0,
    locked
  }
} 