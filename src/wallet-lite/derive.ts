import { mnemonicToSeedSync } from 'bip39'
import { HDKey } from 'hdkey'
import { privateKeyToAccount } from 'viem/accounts'

export interface DerivedKey {
  privateKey: string
  address: string
}

export function deriveEvmKeyFromMnemonic(
  mnemonic: string,
  passphrase: string = '',
  path: string = "m/44'/60'/0'/0/0"
): DerivedKey {
  // Generate seed from mnemonic
  const seed = mnemonicToSeedSync(mnemonic, passphrase)
  
  // Create HD key
  const hdkey = HDKey.fromMasterSeed(seed)
  
  // Derive private key
  const childKey = hdkey.derive(path)
  const privateKey = `0x${childKey.privateKey?.toString('hex')}`
  
  // Get address
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  
  return {
    privateKey,
    address: account.address
  }
}

export function deriveMultipleKeys(
  mnemonic: string,
  passphrase: string = '',
  count: number = 1,
  startIndex: number = 0
): DerivedKey[] {
  const keys: DerivedKey[] = []
  
  for (let i = 0; i < count; i++) {
    const path = `m/44'/60'/0'/0/${startIndex + i}`
    keys.push(deriveEvmKeyFromMnemonic(mnemonic, passphrase, path))
  }
  
  return keys
}

export function validatePrivateKey(privateKey: string): boolean {
  try {
    if (!privateKey.startsWith('0x')) return false
    if (privateKey.length !== 66) return false // 32 bytes + 0x prefix
    
    // Try to create account to validate
    privateKeyToAccount(privateKey as `0x${string}`)
    return true
  } catch {
    return false
  }
}

export function validateAddress(address: string): boolean {
  try {
    if (!address.startsWith('0x')) return false
    if (address.length !== 42) return false // 20 bytes + 0x prefix
    
    // Basic checksum validation
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  } catch {
    return false
  }
} 