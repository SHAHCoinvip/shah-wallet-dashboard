import {
  isWebAuthnSupported,
  isSecureContext,
  getDeviceName,
  registerPasskeyForVault,
  unlockWithPasskey,
  disablePasskey,
  isPasskeyEnabled,
  getPasskeyVaultMeta
} from '../passkeys'

// Mock the WebAuthn API
const mockPublicKeyCredential = {
  rawId: new ArrayBuffer(32),
  id: 'test-credential-id',
  type: 'public-key'
}

const mockNavigator = {
  credentials: {
    create: jest.fn(),
    get: jest.fn()
  }
}

const mockWindow = {
  PublicKeyCredential: {
    isUserVerifyingPlatformAuthenticatorAvailable: jest.fn()
  },
  isSecureContext: true,
  location: {
    hostname: 'localhost'
  }
}

describe('Passkeys', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock global objects
    global.navigator = mockNavigator as any
    global.window = mockWindow as any
    global.PublicKeyCredential = mockWindow.PublicKeyCredential as any
  })

  describe('isWebAuthnSupported', () => {
    it('should return true when WebAuthn is supported', () => {
      expect(isWebAuthnSupported()).toBe(true)
    })

    it('should return false when PublicKeyCredential is not available', () => {
      delete (global as any).PublicKeyCredential
      expect(isWebAuthnSupported()).toBe(false)
    })

    it('should return false when navigator.credentials is not available', () => {
      delete (global as any).navigator.credentials
      expect(isWebAuthnSupported()).toBe(false)
    })
  })

  describe('isSecureContext', () => {
    it('should return true for localhost', () => {
      expect(isSecureContext()).toBe(true)
    })

    it('should return true for HTTPS', () => {
      const mockWindow = {
        isSecureContext: true,
        location: { hostname: 'example.com' }
      }
      global.window = mockWindow as any
      expect(isSecureContext()).toBe(true)
    })

    it('should return false for insecure context', () => {
      const mockWindow = {
        isSecureContext: false,
        location: { hostname: 'example.com' }
      }
      global.window = mockWindow as any
      expect(isSecureContext()).toBe(false)
    })
  })

  describe('getDeviceName', () => {
    it('should return device name for iOS', () => {
      const mockNavigator = {
        platform: 'iPhone',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      }
      global.navigator = mockNavigator as any
      
      expect(getDeviceName()).toContain('iOS')
    })

    it('should return device name for Android', () => {
      const mockNavigator = {
        platform: 'Linux armv8l',
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)'
      }
      global.navigator = mockNavigator as any
      
      expect(getDeviceName()).toContain('Android')
    })

    it('should return device name for macOS', () => {
      const mockNavigator = {
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      }
      global.navigator = mockNavigator as any
      
      expect(getDeviceName()).toContain('macOS')
    })

    it('should return device name for Windows', () => {
      const mockNavigator = {
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
      global.navigator = mockNavigator as any
      
      expect(getDeviceName()).toContain('Windows')
    })

    it('should return platform for unknown device', () => {
      const mockNavigator = {
        platform: 'UnknownPlatform',
        userAgent: 'Unknown User Agent'
      }
      global.navigator = mockNavigator as any
      
      expect(getDeviceName()).toBe('UnknownPlatform')
    })
  })

  describe('registerPasskeyForVault', () => {
    it('should return error when WebAuthn is not supported', async () => {
      delete (global as any).PublicKeyCredential
      
      const result = await registerPasskeyForVault('vault1', new ArrayBuffer(32))
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('WebAuthn not supported')
    })

    it('should return error when not in secure context', async () => {
      const mockWindow = {
        isSecureContext: false,
        location: { hostname: 'example.com' }
      }
      global.window = mockWindow as any
      
      const result = await registerPasskeyForVault('vault1', new ArrayBuffer(32))
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Secure context required for WebAuthn')
    })

    it('should create passkey when conditions are met', async () => {
      const mockCredential = {
        ...mockPublicKeyCredential,
        rawId: new ArrayBuffer(32)
      }
      
      mockNavigator.credentials.create.mockResolvedValue(mockCredential)
      
      const result = await registerPasskeyForVault('vault1', new ArrayBuffer(32))
      
      expect(result.success).toBe(true)
      expect(result.credentialId).toBeDefined()
    })

    it('should handle credential creation failure', async () => {
      mockNavigator.credentials.create.mockResolvedValue(null)
      
      const result = await registerPasskeyForVault('vault1', new ArrayBuffer(32))
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create passkey')
    })

    it('should handle credential creation error', async () => {
      mockNavigator.credentials.create.mockRejectedValue(new Error('User cancelled'))
      
      const result = await registerPasskeyForVault('vault1', new ArrayBuffer(32))
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('User cancelled')
    })
  })

  describe('unlockWithPasskey', () => {
    it('should return error when WebAuthn is not supported', async () => {
      delete (global as any).PublicKeyCredential
      
      const result = await unlockWithPasskey('vault1')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('WebAuthn not supported')
    })

    it('should return error when not in secure context', async () => {
      const mockWindow = {
        isSecureContext: false,
        location: { hostname: 'example.com' }
      }
      global.window = mockWindow as any
      
      const result = await unlockWithPasskey('vault1')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Secure context required for WebAuthn')
    })

    it('should return error when passkey not found', async () => {
      const result = await unlockWithPasskey('nonexistent-vault')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Passkey not found for this vault')
    })

    it('should unlock vault when passkey is valid', async () => {
      // First register a passkey
      const mockCredential = {
        ...mockPublicKeyCredential,
        rawId: new ArrayBuffer(32)
      }
      mockNavigator.credentials.create.mockResolvedValue(mockCredential)
      
      const registerResult = await registerPasskeyForVault('vault1', new ArrayBuffer(32))
      expect(registerResult.success).toBe(true)
      
      // Then try to unlock
      mockNavigator.credentials.get.mockResolvedValue(mockCredential)
      
      const unlockResult = await unlockWithPasskey('vault1')
      
      expect(unlockResult.success).toBe(true)
      expect(unlockResult.vaultKey).toBeDefined()
    })

    it('should handle unlock failure', async () => {
      // First register a passkey
      const mockCredential = {
        ...mockPublicKeyCredential,
        rawId: new ArrayBuffer(32)
      }
      mockNavigator.credentials.create.mockResolvedValue(mockCredential)
      
      const registerResult = await registerPasskeyForVault('vault1', new ArrayBuffer(32))
      expect(registerResult.success).toBe(true)
      
      // Then try to unlock with failure
      mockNavigator.credentials.get.mockResolvedValue(null)
      
      const unlockResult = await unlockWithPasskey('vault1')
      
      expect(unlockResult.success).toBe(false)
      expect(unlockResult.error).toBe('Passkey authentication failed')
    })
  })

  describe('disablePasskey', () => {
    it('should disable passkey successfully', async () => {
      // First register a passkey
      const mockCredential = {
        ...mockPublicKeyCredential,
        rawId: new ArrayBuffer(32)
      }
      mockNavigator.credentials.create.mockResolvedValue(mockCredential)
      
      const registerResult = await registerPasskeyForVault('vault1', new ArrayBuffer(32))
      expect(registerResult.success).toBe(true)
      
      // Then disable it
      const result = await disablePasskey('vault1')
      
      expect(result).toBe(true)
    })

    it('should handle disable failure gracefully', async () => {
      const result = await disablePasskey('nonexistent-vault')
      
      expect(result).toBe(true) // Should not throw error
    })
  })

  describe('isPasskeyEnabled', () => {
    it('should return false for non-existent vault', async () => {
      const result = await isPasskeyEnabled('nonexistent-vault')
      
      expect(result).toBe(false)
    })

    it('should return true for vault with passkey', async () => {
      // First register a passkey
      const mockCredential = {
        ...mockPublicKeyCredential,
        rawId: new ArrayBuffer(32)
      }
      mockNavigator.credentials.create.mockResolvedValue(mockCredential)
      
      const registerResult = await registerPasskeyForVault('vault1', new ArrayBuffer(32))
      expect(registerResult.success).toBe(true)
      
      // Then check if enabled
      const result = await isPasskeyEnabled('vault1')
      
      expect(result).toBe(true)
    })
  })

  describe('getPasskeyVaultMeta', () => {
    it('should return null for non-existent vault', async () => {
      const result = await getPasskeyVaultMeta('nonexistent-vault')
      
      expect(result).toBe(null)
    })

    it('should return meta for vault with passkey', async () => {
      // First register a passkey
      const mockCredential = {
        ...mockPublicKeyCredential,
        rawId: new ArrayBuffer(32)
      }
      mockNavigator.credentials.create.mockResolvedValue(mockCredential)
      
      const registerResult = await registerPasskeyForVault('vault1', new ArrayBuffer(32))
      expect(registerResult.success).toBe(true)
      
      // Then get meta
      const result = await getPasskeyVaultMeta('vault1')
      
      expect(result).toBeDefined()
      expect(result?.deviceName).toBeDefined()
      expect(result?.createdAt).toBeDefined()
      expect(result?.lastUsed).toBeDefined()
    })
  })
}) 