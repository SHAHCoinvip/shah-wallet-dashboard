import crypto from 'crypto'

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          query_id?: string
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
            is_premium?: boolean
            photo_url?: string
            added_to_attachment_menu?: boolean
            allows_write_to_pm?: boolean
          }
          receiver?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            type: 'user' | 'group' | 'supergroup' | 'channel'
            photo_url?: string
          }
          chat?: {
            id: number
            type: 'group' | 'supergroup' | 'channel'
            title: string
            photo_url?: string
          }
          chat_type?: 'sender' | 'private' | 'group' | 'supergroup' | 'channel'
          chat_instance?: string
          start_param?: string
          can_send_after?: number
          auth_date: number
          hash: string
        }
        colorScheme: 'light' | 'dark'
        themeParams: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
          secondary_bg_color?: string
        }
        viewportHeight: number
        viewportStableHeight: number
        platform: 'android' | 'ios' | 'web' | 'macos' | 'tdesktop' | 'weba' | 'unigram' | 'unknown'
        isExpanded: boolean
        ready(): void
        expand(): void
        close(): void
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          isProgressVisible: boolean
          setText(text: string): void
          onClick(callback: () => void): void
          show(): void
          hide(): void
          enable(): void
          disable(): void
          showProgress(leaveActive?: boolean): void
          hideProgress(): void
        }
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
          notificationOccurred(type: 'error' | 'success' | 'warning'): void
          selectionChanged(): void
        }
        BackButton: {
          isVisible: boolean
          onClick(callback: () => void): void
          show(): void
          hide(): void
        }
      }
    }
  }
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
  added_to_attachment_menu?: boolean
  allows_write_to_pm?: boolean
}

export interface TelegramInitData {
  user?: TelegramUser
  query_id?: string
  start_param?: string
  auth_date: number
  hash: string
}

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp || null
}

export function validateInitData(initData: string, botToken: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    if (!hash) return false

    // Remove hash from data to check
    urlParams.delete('hash')
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    // Create secret key from bot token
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
    
    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    return calculatedHash === hash
  } catch (error) {
    console.error('Error validating initData:', error)
    return false
  }
}

export function parseInitData(initData: string): TelegramInitData | null {
  try {
    const urlParams = new URLSearchParams(initData)
    const userStr = urlParams.get('user')
    const user = userStr ? JSON.parse(userStr) : undefined
    
    return {
      user,
      query_id: urlParams.get('query_id') || undefined,
      start_param: urlParams.get('start_param') || undefined,
      auth_date: parseInt(urlParams.get('auth_date') || '0'),
      hash: urlParams.get('hash') || '',
    }
  } catch (error) {
    console.error('Error parsing initData:', error)
    return null
  }
}

export function getTelegramTheme() {
  const webApp = getTelegramWebApp()
  if (!webApp) return 'dark'

  return webApp.colorScheme || 'dark'
}

export function applyTelegramTheme() {
  const webApp = getTelegramWebApp()
  if (!webApp) return

  const theme = webApp.colorScheme || 'dark'
  const themeParams = webApp.themeParams

  // Apply theme to document
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)

  // Apply custom CSS variables from themeParams
  if (themeParams) {
    const root = document.documentElement
    if (themeParams.bg_color) root.style.setProperty('--tg-bg-color', themeParams.bg_color)
    if (themeParams.text_color) root.style.setProperty('--tg-text-color', themeParams.text_color)
    if (themeParams.hint_color) root.style.setProperty('--tg-hint-color', themeParams.hint_color)
    if (themeParams.link_color) root.style.setProperty('--tg-link-color', themeParams.link_color)
    if (themeParams.button_color) root.style.setProperty('--tg-button-color', themeParams.button_color)
    if (themeParams.button_text_color) root.style.setProperty('--tg-button-text-color', themeParams.button_text_color)
    if (themeParams.secondary_bg_color) root.style.setProperty('--tg-secondary-bg-color', themeParams.secondary_bg_color)
  }
}

export function initializeTelegramWebApp() {
  const webApp = getTelegramWebApp()
  if (!webApp) {
    console.warn('Telegram WebApp not available')
    return null
  }

  // Apply theme
  applyTelegramTheme()

  // Tell Telegram we're ready
  webApp.ready()

  // Expand to full height
  webApp.expand()

  // Set up haptic feedback
  const hapticFeedback = webApp.HapticFeedback

  return {
    webApp,
    hapticFeedback,
    user: webApp.initDataUnsafe.user,
    theme: webApp.colorScheme,
    platform: webApp.platform,
    viewportHeight: webApp.viewportHeight,
  }
}

export function triggerHapticFeedback(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
  const webApp = getTelegramWebApp()
  if (webApp?.HapticFeedback) {
    webApp.HapticFeedback.impactOccurred(style)
  }
}

export function showNotification(type: 'error' | 'success' | 'warning' = 'success') {
  const webApp = getTelegramWebApp()
  if (webApp?.HapticFeedback) {
    webApp.HapticFeedback.notificationOccurred(type)
  }
} 