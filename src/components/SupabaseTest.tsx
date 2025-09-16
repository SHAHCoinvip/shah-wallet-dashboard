'use client'

import { useState } from 'react'
import { saveWalletAddress, getUserProfile, logUserAction } from '@/lib/supabaseUtils'

export default function SupabaseTest() {
  const [walletAddress, setWalletAddress] = useState('')
  const [userId, setUserId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testFrontendOperations = async () => {
    setLoading(true)
    try {
      // Test 1: Save wallet address
      const wallet = await saveWalletAddress(userId, walletAddress)
      
      // Test 2: Get user profile
      const profile = await getUserProfile(walletAddress)
      
      // Test 3: Log user action
      await logUserAction(userId, 'test_frontend_operations', { walletAddress })
      
      setResult({
        wallet,
        profile,
        message: 'Frontend operations completed successfully'
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testBackendAPI = async () => {
    setLoading(true)
    try {
      // Test backend API
      const response = await fetch('/api/supabase-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_profile',
          walletAddress,
          userId,
          amount: 100
        })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testHealthCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/supabase-test')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-yellow-400">Supabase Integration Test</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">User ID:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Wallet Address:</label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
      </div>

      <div className="space-x-4 mb-6">
        <button
          onClick={testFrontendOperations}
          disabled={loading || !userId || !walletAddress}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Frontend
        </button>
        
        <button
          onClick={testBackendAPI}
          disabled={loading || !userId || !walletAddress}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Backend API
        </button>
        
        <button
          onClick={testHealthCheck}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Health Check
        </button>
      </div>

      {loading && (
        <div className="text-yellow-400 mb-4">Loading...</div>
      )}

      {result && (
        <div className="bg-gray-700 p-4 rounded">
          <h3 className="font-medium mb-2">Result:</h3>
          <pre className="text-sm text-gray-300 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
