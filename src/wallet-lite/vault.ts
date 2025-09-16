import { VaultData } from './types'
import { 
  registerPasskeyForVault, 
  unlockWithPasskey, 
  disablePasskey, 
  isPasskeyEnabled,
  getPasskeyVaultMeta,
  isWebAuthnSupported,
  isSecureContext
} from './passkeys'

// Crypto utilities for vault encryption
const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 32
const ITERATIONS = 100000

export interface EncryptedVault {
  iv: string
  salt: string
  ciphertext: string
  version: number
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptVault(
  plaintext: string,
  password: string
): Promise<EncryptedVault> {
  const encoder = new TextEncoder()
  const plaintextBytes = encoder.encode(plaintext)
  
  // Generate salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  
  // Derive key
  const key = await deriveKey(password, salt)
  
  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintextBytes
  )
  
  return {
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    version: 1
  }
}

export async function decryptVault(
  vault: EncryptedVault,
  password: string
): Promise<string> {
  try {
    // Decode base64
    const iv = new Uint8Array(atob(vault.iv).split('').map(c => c.charCodeAt(0)))
    const salt = new Uint8Array(atob(vault.salt).split('').map(c => c.charCodeAt(0)))
    const ciphertext = new Uint8Array(atob(vault.ciphertext).split('').map(c => c.charCodeAt(0)))
    
    // Derive key
    const key = await deriveKey(password, salt)
    
    // Decrypt
    const plaintextBytes = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(plaintextBytes)
  } catch (error) {
    throw new Error('Failed to decrypt vault: Invalid password or corrupted data')
  }
}

// IndexedDB storage
const DB_NAME = 'ShahWalletVault'
const DB_VERSION = 1
const STORE_NAME = 'vaults'

class VaultStorage {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  async saveVault(id: string, vault: EncryptedVault): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const vaultData: VaultData = {
        id,
        ...vault,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const request = store.put(vaultData)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async loadVault(id: string): Promise<EncryptedVault | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      
      const request = store.get(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          const { id, createdAt, updatedAt, ...vault } = result
          resolve(vault)
        } else {
          resolve(null)
        }
      }
    })
  }

  async listVaults(): Promise<string[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      
      const request = store.getAllKeys()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const keys = request.result as string[]
        resolve(keys)
      }
    })
  }

  async deleteVault(id: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const request = store.delete(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const request = store.clear()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

export const vaultStorage = new VaultStorage()

// Fallback to localStorage if IndexedDB is not available
export class FallbackStorage {
  private prefix = 'shah_wallet_vault_'

  async saveVault(id: string, vault: EncryptedVault): Promise<void> {
    try {
      localStorage.setItem(this.prefix + id, JSON.stringify(vault))
    } catch (error) {
      throw new Error('Failed to save vault: Storage quota exceeded')
    }
  }

  async loadVault(id: string): Promise<EncryptedVault | null> {
    try {
      const data = localStorage.getItem(this.prefix + id)
      return data ? JSON.parse(data) : null
    } catch (error) {
      return null
    }
  }

  async listVaults(): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''))
      }
    }
    return keys
  }

  async deleteVault(id: string): Promise<void> {
    localStorage.removeItem(this.prefix + id)
  }

  async clearAll(): Promise<void> {
    const keys = await this.listVaults()
    keys.forEach(id => this.deleteVault(id))
  }
}

export const fallbackStorage = new FallbackStorage() 