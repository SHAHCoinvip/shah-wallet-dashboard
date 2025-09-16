// Lightweight crypto helpers to replace './crypto'
function generateRandomBytes(length: number): ArrayBuffer {
  const bytes = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  return bytes.buffer
}

async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = new Uint8Array(12)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(iv)
  }
  const encoded = new TextEncoder().encode(plaintext)
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return `${arrayBufferToBase64URL(iv.buffer)}.${arrayBufferToBase64URL(cipher)}`
}

async function decrypt(ciphertext: string, key: CryptoKey): Promise<string> {
  const [ivB64, dataB64] = ciphertext.split('.')
  const iv = new Uint8Array(base64URLToArrayBuffer(ivB64))
  const data = base64URLToArrayBuffer(dataB64)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(plain)
}

export interface PasskeyCredential {
  id: string
  publicKey: ArrayBuffer
  signCount: number
  createdAt: number
}

export interface PasskeyVault {
  vaultId: string
  credentialId: string
  wrappedVaultKey: ArrayBuffer
  vaultCipher: string
  meta: {
    createdAt: number
    lastUsed: number
    deviceName: string
  }
}

export interface PasskeyRegistrationResult {
  success: boolean
  credentialId?: string
  error?: string
}

export interface PasskeyUnlockResult {
  success: boolean
  vaultKey?: ArrayBuffer
  error?: string
}

/**
 * Check if WebAuthn is supported in the current environment
 */
export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' && 
         'PublicKeyCredential' in window &&
         'credentials' in navigator &&
         'create' in window.PublicKeyCredential &&
         'get' in window.PublicKeyCredential
}

/**
 * Check if the current context is secure (HTTPS or localhost)
 */
export function isSecureContext(): boolean {
  return typeof window !== 'undefined' && 
         (window.isSecureContext || window.location.hostname === 'localhost')
}

/**
 * Get device name for passkey registration
 */
export function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device'
  
  const platform = navigator.platform || 'Unknown'
  const userAgent = navigator.userAgent || ''
  
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    return `iOS ${platform}`
  } else if (userAgent.includes('Android')) {
    return `Android ${platform}`
  } else if (userAgent.includes('Mac')) {
    return `macOS ${platform}`
  } else if (userAgent.includes('Windows')) {
    return `Windows ${platform}`
  } else if (userAgent.includes('Linux')) {
    return `Linux ${platform}`
  }
  
  return platform
}

/**
 * Generate a random challenge for WebAuthn
 */
function generateChallenge(): ArrayBuffer {
  return generateRandomBytes(32)
}

/**
 * Convert ArrayBuffer to Base64URL string
 */
function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Convert Base64URL string to ArrayBuffer
 */
function base64URLToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const binary = atob(base64 + padding)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Register a passkey for a vault
 */
export async function registerPasskeyForVault(
  vaultId: string,
  vaultKey: ArrayBuffer
): Promise<PasskeyRegistrationResult> {
  try {
    if (!isWebAuthnSupported()) {
      return { success: false, error: 'WebAuthn not supported' }
    }

    if (!isSecureContext()) {
      return { success: false, error: 'Secure context required for WebAuthn' }
    }

    // Generate a random challenge
    const challenge = generateChallenge()
    
    // Create credential creation options
    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'SHAH Wallet',
        id: window.location.hostname
      },
      user: {
        id: base64URLToArrayBuffer(vaultId),
        name: `shah-wallet-${vaultId}`,
        displayName: `SHAH Wallet ${vaultId.slice(0, 8)}`
      },
      pubKeyCredParams: [
        {
          type: 'public-key',
          alg: -7 // ES256
        }
      ],
      timeout: 60000,
      attestation: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false
      }
    }

    // Create the credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions
    }) as PublicKeyCredential

    if (!credential) {
      return { success: false, error: 'Failed to create passkey' }
    }

    // Wrap the vault key with the passkey
    const wrappedVaultKey = await wrapVaultKey(vaultKey, credential)
    
    // Store the passkey vault data
    const passkeyVault: PasskeyVault = {
      vaultId,
      credentialId: arrayBufferToBase64URL(credential.rawId),
      wrappedVaultKey,
      vaultCipher: '', // This will be set by the vault system
      meta: {
        createdAt: Date.now(),
        lastUsed: Date.now(),
        deviceName: getDeviceName()
      }
    }

    // Store in IndexedDB
    await storePasskeyVault(passkeyVault)

    return {
      success: true,
      credentialId: passkeyVault.credentialId
    }

  } catch (error) {
    console.error('Passkey registration failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Unlock a vault using passkey
 */
export async function unlockWithPasskey(vaultId: string): Promise<PasskeyUnlockResult> {
  try {
    if (!isWebAuthnSupported()) {
      return { success: false, error: 'WebAuthn not supported' }
    }

    if (!isSecureContext()) {
      return { success: false, error: 'Secure context required for WebAuthn' }
    }

    // Get the stored passkey vault data
    const passkeyVault = await getPasskeyVault(vaultId)
    if (!passkeyVault) {
      return { success: false, error: 'Passkey not found for this vault' }
    }

    // Generate a challenge for authentication
    const challenge = generateChallenge()

    // Create credential request options
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: window.location.hostname,
      allowCredentials: [
        {
          type: 'public-key',
          id: base64URLToArrayBuffer(passkeyVault.credentialId),
          transports: ['internal']
        }
      ],
      userVerification: 'required',
      timeout: 60000
    }

    // Get the credential
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions
    }) as PublicKeyCredential

    if (!assertion) {
      return { success: false, error: 'Passkey authentication failed' }
    }

    // Unwrap the vault key
    const vaultKey = await unwrapVaultKey(passkeyVault.wrappedVaultKey, assertion)
    
    // Update last used timestamp
    passkeyVault.meta.lastUsed = Date.now()
    await storePasskeyVault(passkeyVault)

    return {
      success: true,
      vaultKey
    }

  } catch (error) {
    console.error('Passkey unlock failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Disable passkey for a vault
 */
export async function disablePasskey(vaultId: string): Promise<boolean> {
  try {
    await removePasskeyVault(vaultId)
    return true
  } catch (error) {
    console.error('Failed to disable passkey:', error)
    return false
  }
}

/**
 * Check if passkey is enabled for a vault
 */
export async function isPasskeyEnabled(vaultId: string): Promise<boolean> {
  try {
    const passkeyVault = await getPasskeyVault(vaultId)
    return !!passkeyVault
  } catch (error) {
    return false
  }
}

/**
 * Get passkey vault metadata
 */
export async function getPasskeyVaultMeta(vaultId: string): Promise<PasskeyVault['meta'] | null> {
  try {
    const passkeyVault = await getPasskeyVault(vaultId)
    return passkeyVault?.meta || null
  } catch (error) {
    return null
  }
}

/**
 * Wrap vault key with passkey credential
 */
async function wrapVaultKey(
  vaultKey: ArrayBuffer,
  credential: PublicKeyCredential
): Promise<ArrayBuffer> {
  // In a real implementation, this would use the credential's public key
  // to encrypt the vault key. For now, we'll use a simplified approach.
  
  // Convert vault key to base64 for storage
  const vaultKeyBase64 = arrayBufferToBase64URL(vaultKey)
  
  // In a real implementation, you would:
  // 1. Extract the public key from the credential
  // 2. Use Web Crypto API to encrypt the vault key
  // 3. Return the encrypted vault key
  
  // For now, we'll return the vault key as-is (this is NOT secure for production)
  // TODO: Implement proper key wrapping with Web Crypto API
  return vaultKey
}

/**
 * Unwrap vault key using passkey assertion
 */
async function unwrapVaultKey(
  wrappedVaultKey: ArrayBuffer,
  assertion: PublicKeyCredential
): Promise<ArrayBuffer> {
  // In a real implementation, this would use the assertion to decrypt the vault key
  // For now, we'll return the wrapped key as-is (this is NOT secure for production)
  // TODO: Implement proper key unwrapping with Web Crypto API
  return wrappedVaultKey
}

/**
 * Store passkey vault data in IndexedDB
 */
async function storePasskeyVault(passkeyVault: PasskeyVault): Promise<void> {
  const db = await openPasskeyDB()
  const tx = db.transaction(['passkeyVaults'], 'readwrite')
  const store = tx.objectStore('passkeyVaults')
  await store.put(passkeyVault)
}

/**
 * Get passkey vault data from IndexedDB
 */
async function getPasskeyVault(vaultId: string): Promise<PasskeyVault | null> {
  const db = await openPasskeyDB()
  const tx = db.transaction(['passkeyVaults'], 'readonly')
  const store = tx.objectStore('passkeyVaults')
  return await store.get(vaultId)
}

/**
 * Remove passkey vault data from IndexedDB
 */
async function removePasskeyVault(vaultId: string): Promise<void> {
  const db = await openPasskeyDB()
  const tx = db.transaction(['passkeyVaults'], 'readwrite')
  const store = tx.objectStore('passkeyVaults')
  await store.delete(vaultId)
}

/**
 * Open IndexedDB for passkey storage
 */
async function openPasskeyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ShahWalletPasskeys', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      if (!db.objectStoreNames.contains('passkeyVaults')) {
        const store = db.createObjectStore('passkeyVaults', { keyPath: 'vaultId' })
        store.createIndex('credentialId', 'credentialId', { unique: true })
      }
    }
  })
} 