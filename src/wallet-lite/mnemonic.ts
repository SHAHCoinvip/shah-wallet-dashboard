import { generateMnemonic, validateMnemonic } from 'bip39'

export function generateMnemonicPhrase(strength: 128 | 256 = 128): string {
  return generateMnemonic(strength)
}

export function validateMnemonicPhrase(mnemonic: string): boolean {
  return validateMnemonic(mnemonic)
}

export function getMnemonicStrength(mnemonic: string): 128 | 256 {
  const words = mnemonic.trim().split(/\s+/)
  return words.length === 12 ? 128 : 256
}

export function formatMnemonic(mnemonic: string): string {
  return mnemonic.trim().toLowerCase()
}

export function getMnemonicWordCount(mnemonic: string): number {
  return mnemonic.trim().split(/\s+/).length
}

export function isMnemonicComplete(mnemonic: string): boolean {
  const words = mnemonic.trim().split(/\s+/)
  return words.length === 12 || words.length === 24
} 