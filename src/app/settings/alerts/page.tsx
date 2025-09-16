'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { getUserSubscription, upsertUserSubscription, UserSubscription } from '@/lib/notifs'
import { 
  getUserTokenSubscriptions, 
  addTokenSubscription, 
  removeTokenSubscription,
  getTokenSymbol,
  getTokenName,
  TokenSubscription 
} from '@/lib/tokenAlerts'

export default function AlertSettingsPage() {
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [subscription, setSubscription] = useState<Partial<UserSubscription>>({
    wants_price: true,
    wants_new_tokens: true,
    wants_verifications: true,
    price_threshold_pct: 5
  })

  // Token subscription states
  const [tokenSubscriptions, setTokenSubscriptions] = useState<TokenSubscription[]>([])
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [newTokenAlertTypes, setNewTokenAlertTypes] = useState<string[]>(['large_transfer'])
  const [newTokenMinAmount, setNewTokenMinAmount] = useState('')
  const [addingToken, setAddingToken] = useState(false)

  // Load existing subscription
  useEffect(() => {
    if (address) {
      loadSubscription()
    }
  }, [address])

  const loadSubscription = async () => {
    if (!address) return

    try {
      setLoading(true)
      
      const [existing, tokenSubs] = await Promise.all([
        getUserSubscription(address),
        getUserTokenSubscriptions(address)
      ])
      
      if (existing) {
        setSubscription(existing)
      } else {
        // Set default values for new subscription
        setSubscription({
          wallet_address: address.toLowerCase(),
          wants_price: true,
          wants_new_tokens: true,
          wants_verifications: true,
          price_threshold_pct: 5
        })
      }
      
      setTokenSubscriptions(tokenSubs)
    } catch (error) {
      console.error('Failed to load subscription:', error)
      toast.error('Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!address) return

    try {
      setSaving(true)
      
      const success = await upsertUserSubscription({
        ...subscription,
        wallet_address: address.toLowerCase()
      })

      if (success) {
        toast.success('Notification settings saved!')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save subscription:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleLinkTelegram = async () => {
    if (!address) return

    try {
      setLinking(true)
      
      const response = await fetch('/api/telegram/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet: address }),
      })

      const data = await response.json()

      if (data.success) {
        // Open Telegram deep link
        window.open(data.deepLink, '_blank')
        toast.success('Telegram link created! Check your browser for the Telegram app.')
      } else {
        toast.error(data.error || 'Failed to create Telegram link')
      }
    } catch (error) {
      console.error('Failed to create Telegram link:', error)
      toast.error('Failed to create Telegram link')
    } finally {
      setLinking(false)
    }
  }

  const handleAddToken = async () => {
    if (!address || !newTokenAddress) return

    // Validate token address
    if (!/^0x[a-fA-F0-9]{40}$/.test(newTokenAddress)) {
      toast.error('Invalid token address format')
      return
    }

    try {
      setAddingToken(true)
      
      // Check if already subscribed
      const existing = tokenSubscriptions.find(
        sub => sub.token_address.toLowerCase() === newTokenAddress.toLowerCase()
      )
      
      if (existing) {
        toast.error('Already subscribed to this token')
        return
      }

      // Convert min amount to wei (assume 18 decimals for now)
      let minAmountWei = '0'
      if (newTokenMinAmount) {
        try {
          minAmountWei = (parseFloat(newTokenMinAmount) * 1e18).toString()
        } catch {
          toast.error('Invalid minimum amount')
          return
        }
      }

      const success = await addTokenSubscription(
        address,
        newTokenAddress,
        newTokenAlertTypes,
        minAmountWei
      )

      if (success) {
        toast.success('Token subscription added!')
        // Reload subscriptions
        const updated = await getUserTokenSubscriptions(address)
        setTokenSubscriptions(updated)
        
        // Reset form
        setNewTokenAddress('')
        setNewTokenAlertTypes(['large_transfer'])
        setNewTokenMinAmount('')
      } else {
        toast.error('Failed to add token subscription')
      }
    } catch (error) {
      console.error('Failed to add token subscription:', error)
      toast.error('Failed to add token subscription')
    } finally {
      setAddingToken(false)
    }
  }

  const handleRemoveToken = async (tokenAddress: string) => {
    if (!address) return

    try {
      const success = await removeTokenSubscription(address, tokenAddress)
      
      if (success) {
        toast.success('Token subscription removed')
        setTokenSubscriptions(prev => 
          prev.filter(sub => sub.token_address.toLowerCase() !== tokenAddress.toLowerCase())
        )
      } else {
        toast.error('Failed to remove subscription')
      }
    } catch (error) {
      console.error('Failed to remove token subscription:', error)
      toast.error('Failed to remove subscription')
    }
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold mb-6">🔔 Notification Settings</h1>
            <p className="text-gray-300 mb-8">Connect your wallet to manage notification preferences</p>
            
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
              <ConnectButton />
            </div>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">🔔 Notification Settings</h1>
          <p className="text-gray-300">Configure your SHAH wallet alerts and notifications</p>
        </motion.div>

        {loading ? (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              <div className="h-20 bg-gray-700 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Telegram Connection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
              >
                <h2 className="text-2xl font-bold mb-4">📱 Telegram Notifications</h2>
                <p className="text-gray-300 mb-4">
                  Link your Telegram account to receive instant notifications
                </p>
                
                {subscription.telegram_user_id ? (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-400 font-medium">✅ Telegram Connected</p>
                        <p className="text-gray-400 text-sm">User ID: {subscription.telegram_user_id}</p>
                      </div>
                      <button
                        onClick={handleLinkTelegram}
                        disabled={linking}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
                      >
                        {linking ? 'Creating Link...' : 'Relink'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-400 font-medium">📱 Connect Telegram</p>
                        <p className="text-gray-400 text-sm">Get instant alerts in Telegram</p>
                      </div>
                      <button
                        onClick={handleLinkTelegram}
                        disabled={linking}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
                      >
                        {linking ? 'Creating Link...' : 'Link Telegram'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Email Notifications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
              >
                <h2 className="text-2xl font-bold mb-4">📧 Email Notifications</h2>
                <p className="text-gray-300 mb-4">
                  Optional: Add your email for backup notifications
                </p>
                
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={subscription.email || ''}
                  onChange={(e) => setSubscription(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </motion.div>

              {/* Alert Types */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
              >
                <h2 className="text-2xl font-bold mb-4">🔔 Alert Types</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                    <div>
                      <div className="font-medium">📈 Price Alerts</div>
                      <div className="text-sm text-gray-400">Get notified of significant SHAH price changes</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={subscription.wants_price}
                      onChange={(e) => setSubscription(prev => ({ ...prev, wants_price: e.target.checked }))}
                      className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                    <div>
                      <div className="font-medium">🏭 New Token Alerts</div>
                      <div className="text-sm text-gray-400">Get notified when new tokens are created via SHAH Factory</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={subscription.wants_new_tokens}
                      onChange={(e) => setSubscription(prev => ({ ...prev, wants_new_tokens: e.target.checked }))}
                      className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                    <div>
                      <div className="font-medium">✅ Verification Alerts</div>
                      <div className="text-sm text-gray-400">Get notified of token verification status changes</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={subscription.wants_verifications}
                      onChange={(e) => setSubscription(prev => ({ ...prev, wants_verifications: e.target.checked }))}
                      className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </motion.div>

              {/* Price Threshold */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
              >
                <h2 className="text-2xl font-bold mb-4">🎯 Price Alert Threshold</h2>
                <p className="text-gray-300 mb-4">
                  Minimum percentage change to trigger price alerts
                </p>
                
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={subscription.price_threshold_pct || 5}
                    onChange={(e) => setSubscription(prev => ({ ...prev, price_threshold_pct: Number(e.target.value) }))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="bg-gray-700 px-3 py-2 rounded-lg min-w-[80px] text-center">
                    {subscription.price_threshold_pct || 5}%
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Current setting: Alert me when SHAH price changes by {subscription.price_threshold_pct || 5}% or more
                </p>
              </motion.div>

              {/* Custom Token Alerts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
              >
                <h2 className="text-2xl font-bold mb-4">🪙 Custom Token Alerts</h2>
                <p className="text-gray-300 mb-6">
                  Get notified about specific tokens' large transfers and volume spikes
                </p>
                
                {/* Add New Token */}
                <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
                  <h3 className="font-medium mb-4">Add Token Subscription</h3>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Token address (0x...)"
                      value={newTokenAddress}
                      onChange={(e) => setNewTokenAddress(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Alert Types</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={newTokenAlertTypes.includes('large_transfer')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTokenAlertTypes(prev => [...prev, 'large_transfer'])
                              } else {
                                setNewTokenAlertTypes(prev => prev.filter(t => t !== 'large_transfer'))
                              }
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm">Large Transfers</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={newTokenAlertTypes.includes('volume_spike')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTokenAlertTypes(prev => [...prev, 'volume_spike'])
                              } else {
                                setNewTokenAlertTypes(prev => prev.filter(t => t !== 'volume_spike'))
                              }
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm">Volume Spikes</span>
                        </label>
                      </div>
                    </div>
                    
                    {newTokenAlertTypes.includes('large_transfer') && (
                      <input
                        type="number"
                        placeholder="Minimum transfer amount (in token units)"
                        value={newTokenMinAmount}
                        onChange={(e) => setNewTokenMinAmount(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    )}
                    
                    <button
                      onClick={handleAddToken}
                      disabled={addingToken || !newTokenAddress || newTokenAlertTypes.length === 0}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {addingToken ? 'Adding...' : 'Add Token'}
                    </button>
                  </div>
                </div>

                {/* Current Subscriptions */}
                {tokenSubscriptions.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-4">Your Token Subscriptions</h3>
                    <div className="space-y-3">
                      {tokenSubscriptions.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                          <div>
                            <div className="font-medium">
                              {sub.token_address.slice(0, 6)}...{sub.token_address.slice(-4)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {sub.alert_types.join(', ')}
                              {sub.min_amount_wei !== '0' && ` • Min: ${parseFloat(sub.min_amount_wei) / 1e18}`}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveToken(sub.token_address)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </motion.div>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold mb-4">📋 How It Works</h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li>• Link your Telegram for instant notifications</li>
                  <li>• Set your price alert threshold</li>
                  <li>• Choose which events to track</li>
                  <li>• Receive real-time updates</li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold mb-4">🔒 Privacy</h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li>• Your data is encrypted and secure</li>
                  <li>• We only send alerts you've chosen</li>
                  <li>• Unsubscribe anytime</li>
                  <li>• No spam, ever</li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold mb-4">💡 Pro Tips</h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li>• Use 5-10% threshold for major moves</li>
                  <li>• Enable all alerts for full coverage</li>
                  <li>• Link both Telegram and email</li>
                  <li>• Test with a small price change</li>
                </ul>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}