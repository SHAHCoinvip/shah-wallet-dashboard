'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { initializeTelegramWebApp } from '@/lib/telegram'
import InvoiceQR from '@/components/InvoiceQR'
import StatusBadge from '@/components/StatusBadge'
import { Store, Plus, Receipt, QrCode, Copy, Eye } from 'lucide-react'

interface Merchant {
  id: number
  name: string
  slug: string
  preferred_currency: string
  created_at: string
}

interface Invoice {
  id: number
  invoice_id: string
  amount_usd: number
  amount_shah: string
  status: 'pending' | 'paid' | 'expired' | 'refunded'
  provider: string
  created_at: string
  paid_at?: string
}

export default function MerchantPage() {
  const { address } = useAccount()
  const [initData, setInitData] = useState('')
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  
  // Form states
  const [merchantName, setMerchantName] = useState('')
  const [merchantSlug, setMerchantSlug] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceDescription, setInvoiceDescription] = useState('')
  const [refCode, setRefCode] = useState('')

  useEffect(() => {
    initializeTelegramWebApp()
    const urlParams = new URLSearchParams(window.location.search)
    const tgInitData = urlParams.get('tgWebAppData') || ''
    setInitData(tgInitData)
    
    // Load mock data
    loadMerchantData()
  }, [])

  const loadMerchantData = () => {
    // Mock merchant data
    const mockMerchant: Merchant = {
      id: 1,
      name: 'SHAH Coffee Shop',
      slug: 'shah-coffee',
      preferred_currency: 'USD',
      created_at: '2024-01-15T10:30:00Z'
    }
    
    const mockInvoices: Invoice[] = [
      {
        id: 1,
        invoice_id: 'INV-ABC123',
        amount_usd: 25.50,
        amount_shah: '2550000000000000000000',
        status: 'paid',
        provider: 'telegram',
        created_at: '2024-01-20T14:30:00Z',
        paid_at: '2024-01-20T14:35:00Z'
      },
      {
        id: 2,
        invoice_id: 'INV-DEF456',
        amount_usd: 12.75,
        amount_shah: '1275000000000000000000',
        status: 'pending',
        provider: 'stripe',
        created_at: '2024-01-21T09:15:00Z'
      }
    ]
    
    setMerchant(mockMerchant)
    setInvoices(mockInvoices)
    setLoading(false)
  }

  const createMerchant = async () => {
    if (!merchantName.trim() || !merchantSlug.trim()) {
      alert('Please fill in all fields')
      return
    }

    // Mock API call
    const newMerchant: Merchant = {
      id: Date.now(),
      name: merchantName,
      slug: merchantSlug,
      preferred_currency: 'USD',
      created_at: new Date().toISOString()
    }
    
    setMerchant(newMerchant)
    setShowCreateForm(false)
    setMerchantName('')
    setMerchantSlug('')
  }

  const createInvoice = async () => {
    if (!invoiceAmount || !invoiceDescription.trim()) {
      alert('Please fill in all fields')
      return
    }

    const amount = parseFloat(invoiceAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    // Mock API call
    const newInvoice: Invoice = {
      id: Date.now(),
      invoice_id: `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      amount_usd: amount,
      amount_shah: (amount * 100 * 1e18).toString(), // Mock conversion
      status: 'pending',
      provider: 'telegram',
      created_at: new Date().toISOString()
    }
    
    setInvoices([newInvoice, ...invoices])
    setShowInvoiceForm(false)
    setInvoiceAmount('')
    setInvoiceDescription('')
    setRefCode('')
  }

  const copyInvoiceId = async (invoiceId: string) => {
    try {
      await navigator.clipboard.writeText(invoiceId)
      // Show success feedback
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!address) {
    return (
      <div className="mini-app-container">
        <div className="mini-card">
          <div className="text-center text-gray-500">
            Please connect your wallet to access merchant features
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mini-app-container">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Merchant</h1>
        <p className="text-sm text-gray-600">
          Create invoices and accept payments in SHAH
        </p>
      </div>

      {loading ? (
        <div className="mini-card animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      ) : !merchant ? (
        // Create Merchant Form
        <div className="mini-card">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800">Create Merchant Profile</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., SHAH Coffee Shop"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL identifier)
              </label>
              <input
                type="text"
                value={merchantSlug}
                onChange={(e) => setMerchantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., shah-coffee"
              />
            </div>
            
            <button
              onClick={createMerchant}
              className="w-full mini-button bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Store className="w-4 h-4 mr-2" />
              Create Merchant Profile
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Merchant Info */}
          <div className="mini-card mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-800">{merchant.name}</h3>
              </div>
              <StatusBadge status="paid" size="sm" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Slug</div>
                <div className="font-mono text-gray-800">{merchant.slug}</div>
              </div>
              <div>
                <div className="text-gray-600">Currency</div>
                <div className="text-gray-800">{merchant.preferred_currency}</div>
              </div>
            </div>
          </div>

          {/* Create Invoice Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowInvoiceForm(true)}
              className="w-full mini-button bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Invoice
            </button>
          </div>

          {/* Create Invoice Form */}
          {showInvoiceForm && (
            <div className="mini-card mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Create Invoice</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={invoiceDescription}
                    onChange={(e) => setInvoiceDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Coffee and pastry"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referral Code (optional)
                  </label>
                  <input
                    type="text"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ABC123"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={createInvoice}
                    className="flex-1 mini-button bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Create Invoice
                  </button>
                  <button
                    onClick={() => setShowInvoiceForm(false)}
                    className="flex-1 mini-button bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Invoices List */}
          <div className="mini-card">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Recent Invoices</h3>
            </div>
            
            {invoices.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No invoices yet. Create your first invoice above.
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm text-gray-800">
                          {invoice.invoice_id}
                        </div>
                        <button
                          onClick={() => copyInvoiceId(invoice.invoice_id)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Copy className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                      <StatusBadge status={invoice.status} size="sm" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <div className="text-gray-600">Amount</div>
                        <div className="font-semibold text-gray-800">
                          ${invoice.amount_usd.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Provider</div>
                        <div className="text-gray-800 capitalize">{invoice.provider}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="flex-1 mini-button bg-blue-500 hover:bg-blue-600 text-white text-sm"
                      >
                        <QrCode className="w-3 h-3 mr-1" />
                        View QR
                      </button>
                      <button
                        onClick={() => {/* View details */}}
                        className="flex-1 mini-button bg-gray-500 hover:bg-gray-600 text-white text-sm"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Invoice QR Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Payment QR Code</h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <InvoiceQR
                invoiceId={selectedInvoice.invoice_id}
                amountUsd={selectedInvoice.amount_usd}
                amountShah={selectedInvoice.amount_shah}
                merchantName={merchant?.name || ''}
                paymentProvider={selectedInvoice.provider as 'telegram' | 'stripe' | 'onchain'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 