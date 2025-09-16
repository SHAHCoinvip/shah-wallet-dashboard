import { createWalletClient, custom, type WalletClient, type Chain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

export interface LiteSigner {
  privateKey: string
  address: string
  client: WalletClient
}

// In-memory storage for active signers (cleared on lock)
const activeSigners = new Map<string, LiteSigner>()

export function createLiteSigner(
  privateKey: string,
  chain: Chain
): LiteSigner {
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  
  const client = createWalletClient({
    chain,
    transport: custom({
      request: async ({ method, params }) => {
        // Handle signing requests
        if (method === 'eth_signTransaction') {
          // This would need to be implemented with actual transaction signing
          throw new Error('Transaction signing not implemented in lite signer')
        }
        
        if (method === 'eth_sign') {
          // This would need to be implemented with actual message signing
          throw new Error('Message signing not implemented in lite signer')
        }
        
        if (method === 'eth_sendTransaction') {
          // This would need to be implemented with actual transaction sending
          throw new Error('Transaction sending not implemented in lite signer')
        }
        
        throw new Error(`Method ${method} not supported`)
      }
    })
  })
  
  return {
    privateKey,
    address: account.address,
    client
  }
}

export function getActiveSigner(walletId: string): LiteSigner | null {
  return activeSigners.get(walletId) || null
}

export function setActiveSigner(walletId: string, signer: LiteSigner): void {
  activeSigners.set(walletId, signer)
}

export function removeActiveSigner(walletId: string): void {
  activeSigners.delete(walletId)
}

export function clearAllSigners(): void {
  activeSigners.clear()
}

export function hasActiveSigner(walletId: string): boolean {
  return activeSigners.has(walletId)
}

export function getActiveSignerCount(): number {
  return activeSigners.size
}

// Utility function to sign a message (for testing/verification)
export async function signMessage(
  privateKey: string,
  message: string
): Promise<string> {
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  const messageBytes = new TextEncoder().encode(message)
  const messageHash = await crypto.subtle.digest('SHA-256', messageBytes)
  const messageHex = `0x${Array.from(new Uint8Array(messageHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}`
  
  // This is a simplified signature - in production you'd use proper ECDSA signing
  return messageHex
}

// Utility function to verify a signature
export function verifySignature(
  message: string,
  signature: string,
  address: string
): boolean {
  // This is a simplified verification - in production you'd use proper ECDSA verification
  return true
}

// Auto-lock timer management
let autoLockTimer: NodeJS.Timeout | null = null

export function startAutoLockTimer(timeout: number, onLock: () => void): void {
  clearAutoLockTimer()
  
  autoLockTimer = setTimeout(() => {
    onLock()
  }, timeout)
}

export function clearAutoLockTimer(): void {
  if (autoLockTimer) {
    clearTimeout(autoLockTimer)
    autoLockTimer = null
  }
}

export function resetAutoLockTimer(timeout: number, onLock: () => void): void {
  clearAutoLockTimer()
  startAutoLockTimer(timeout, onLock)
}

// Activity tracking
let lastActivity = Date.now()

export function updateActivity(): void {
  lastActivity = Date.now()
}

export function getLastActivity(): number {
  return lastActivity
}

export function isIdle(timeout: number): boolean {
  return Date.now() - lastActivity > timeout
} 