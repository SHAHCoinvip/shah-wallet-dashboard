# SHAH Wallet Security Documentation

## 🔒 Lite Wallet Security Overview

The SHAH Wallet implements a secure, local-only wallet system that provides users with full control over their private keys while maintaining high security standards.

## 🛡️ Security Features

### 1. Local-Only Custody
- **No Server Storage**: Private keys never leave the user's browser
- **Client-Side Encryption**: All sensitive data is encrypted before storage
- **Zero Knowledge**: Server has no access to user funds or private keys

### 2. Cryptographic Security
- **AES-GCM Encryption**: Industry-standard encryption for vault storage
- **PBKDF2 Key Derivation**: 100,000 iterations for password-based key derivation
- **BIP-39 Mnemonics**: Standard mnemonic phrase generation (12/24 words)
- **HD Wallet Support**: Hierarchical deterministic wallet structure

### 3. Storage Security
- **IndexedDB Primary**: Encrypted storage in browser's IndexedDB
- **localStorage Fallback**: Secure fallback with same encryption
- **Vault Architecture**: Each wallet has its own encrypted vault
- **No Plaintext Storage**: Private keys are never stored unencrypted

### 4. Access Control
- **Password Protection**: Strong password requirements (8+ characters)
- **Auto-Lock Timer**: Configurable auto-lock (5min, 15min, 1hr, disabled)
- **Activity Tracking**: Automatic locking on inactivity
- **Page Visibility Lock**: Locks when page becomes hidden

### 5. Memory Security
- **In-Memory Only**: Private keys exist only in memory when unlocked
- **Automatic Clearing**: Memory cleared on lock, page close, or refresh
- **No Persistence**: Keys never persist in localStorage or sessionStorage

## 🔧 Technical Implementation

### Encryption Process
```typescript
// 1. Generate random salt and IV
const salt = crypto.getRandomValues(new Uint8Array(32))
const iv = crypto.getRandomValues(new Uint8Array(12))

// 2. Derive key using PBKDF2
const key = await crypto.subtle.deriveKey({
  name: 'PBKDF2',
  salt,
  iterations: 100000,
  hash: 'SHA-256'
}, password, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])

// 3. Encrypt data
const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
```

### Vault Structure
```typescript
interface EncryptedVault {
  iv: string          // Base64 encoded initialization vector
  salt: string        // Base64 encoded salt
  ciphertext: string  // Base64 encoded encrypted data
  version: number     // Vault format version
}
```

### Storage Locations
- **Primary**: `IndexedDB` - `ShahWalletVault` database
- **Fallback**: `localStorage` - `shah_wallet_vault_*` keys
- **State**: `localStorage` - `shah-wallet-state` (metadata only)

## 🚨 Security Considerations

### 1. Browser Security
- **HTTPS Required**: Wallet only works over secure connections
- **Content Security Policy**: Strict CSP prevents XSS attacks
- **No External Scripts**: All crypto operations use Web Crypto API

### 2. User Responsibility
- **Backup Phrase**: Users must securely store their mnemonic phrase
- **Password Strength**: Strong passwords are required
- **Device Security**: Wallet security depends on device security

### 3. Limitations
- **Browser Dependencies**: Security depends on browser implementation
- **No Recovery**: Lost password = lost access (by design)
- **Single Device**: No cross-device synchronization

## 🔄 Auto-Lock Mechanism

### Timer Management
```typescript
// Start auto-lock timer
startAutoLockTimer(timeout, () => {
  lockWallet() // Clear memory and lock
})

// Reset on activity
resetAutoLockTimer(timeout, onLock)
```

### Activity Detection
- Mouse movements
- Keyboard input
- Touch events
- Scroll events
- Page visibility changes

## 🛠️ Kill Switch

### Emergency Lock
```typescript
// Immediate lock (clears all memory)
lockWallet()

// Clear all storage
await vaultStorage.clearAll()
await fallbackStorage.clearAll()
```

### Browser Close Protection
- Automatic lock on page unload
- Memory cleared on refresh
- No persistence across sessions

## 📋 Security Checklist

### Development
- [x] HTTPS enforcement
- [x] CSP headers
- [x] Input validation
- [x] Error handling
- [x] No sensitive data in logs

### Testing
- [x] Encryption/decryption tests
- [x] Memory clearing tests
- [x] Auto-lock functionality
- [x] Error scenarios
- [x] Browser compatibility

### Deployment
- [x] Environment variables
- [x] Feature flags
- [x] Monitoring setup
- [x] Backup procedures

## 🚀 Best Practices

### For Users
1. **Use Strong Passwords**: Minimum 8 characters, mix of types
2. **Secure Backup**: Store mnemonic phrase offline, multiple locations
3. **Regular Backups**: Export wallet data periodically
4. **Device Security**: Keep device updated and secure
5. **Auto-Lock**: Enable auto-lock for security

### For Developers
1. **No Logging**: Never log private keys or passwords
2. **Input Validation**: Validate all user inputs
3. **Error Handling**: Graceful error handling without data exposure
4. **Testing**: Comprehensive security testing
5. **Updates**: Keep dependencies updated

## 🔍 Security Audits

### Recommended Audits
- **Cryptographic Review**: Audit encryption implementation
- **Memory Analysis**: Verify memory clearing
- **Storage Review**: Audit storage security
- **Penetration Testing**: Test for vulnerabilities
- **Code Review**: Security-focused code review

### Audit Checklist
- [ ] Encryption algorithm verification
- [ ] Key derivation strength
- [ ] Memory management
- [ ] Storage security
- [ ] Input validation
- [ ] Error handling
- [ ] Browser compatibility
- [ ] Performance impact

## 📞 Security Contact

For security issues or questions:
- **Email**: security@shah.vip
- **GitHub**: Create security issue with [SECURITY] tag
- **Discord**: #security channel

## 📄 License

This security documentation is part of the SHAH Wallet project and is subject to the same license terms.

---

**⚠️ Important**: This wallet system is designed for advanced users who understand the security implications. Users are responsible for their own security and backup procedures. 