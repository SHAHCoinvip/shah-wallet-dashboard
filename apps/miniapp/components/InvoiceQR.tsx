'use client'

import { useState, useEffect } from 'react'
import { Download, Copy, ExternalLink } from 'lucide-react'
import { triggerHapticFeedback } from '@/lib/telegram'

interface InvoiceQRProps {
  invoiceId: string
  amountUsd: number
  amountShah: string
  merchantName: string
  paymentProvider: 'telegram' | 'stripe' | 'onchain'
  paymentPayload?: any
}

export default function InvoiceQR({ 
  invoiceId, 
  amountUsd, 
  amountShah, 
  merchantName, 
  paymentProvider,
  paymentPayload 
}: InvoiceQRProps) {
  const [qrCode, setQrCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState('')

  useEffect(() => {
    generateQRCode()
  }, [invoiceId, paymentProvider, paymentPayload])

  const generateQRCode = () => {
    let qrData = ''
    let url = ''

    if (paymentProvider === 'telegram') {
      // For Telegram Pay, we show the invoice details
      qrData = `Invoice: ${invoiceId}\nAmount: $${amountUsd}\nSHAH: ${amountShah}\nMerchant: ${merchantName}`
      url = paymentPayload?.start_parameter ? 
        `https://t.me/YourShahBot?start=${paymentPayload.start_parameter}` : ''
    } else if (paymentProvider === 'stripe') {
      // For Stripe, show the checkout URL
      url = paymentPayload?.url || ''
      qrData = url
    } else if (paymentProvider === 'onchain') {
      // For on-chain SHAH payment
      const shahAmount = BigInt(amountShah)
      const gasLimit = paymentPayload?.gas || '21000'
      qrData = `ethereum:${paymentPayload.to}?value=${shahAmount}&gas=${gasLimit}&data=0x`
      url = qrData
    }

    setPaymentUrl(url)
    
    // Generate QR code using a simple library or service
    // For now, we'll use a placeholder approach
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
    setQrCode(qrApiUrl)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paymentUrl || qrCode)
      setCopied(true)
      triggerHapticFeedback('light')
      
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadQR = () => {
    if (qrCode) {
      const link = document.createElement('a')
      link.href = qrCode
      link.download = `invoice-${invoiceId}-qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      triggerHapticFeedback('light')
    }
  }

  const openPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank')
      triggerHapticFeedback('light')
    }
  }

  return (
    <div className="mini-card">
      <div className="text-center">
        <h3 className="font-semibold text-gray-800 mb-3">Payment QR Code</h3>
        
        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg border mb-4 inline-block">
          {qrCode ? (
            <img 
              src={qrCode} 
              alt="Payment QR Code" 
              className="w-48 h-48 mx-auto"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
              <div className="text-gray-400">Loading QR...</div>
            </div>
          )}
        </div>

        {/* Invoice Details */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-left">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Invoice ID:</div>
            <div className="font-mono">{invoiceId}</div>
            
            <div className="text-gray-600">Amount USD:</div>
            <div className="font-semibold">${amountUsd.toFixed(2)}</div>
            
            <div className="text-gray-600">Amount SHAH:</div>
            <div className="font-mono text-xs">
              {(BigInt(amountShah) / BigInt(10 ** 18)).toString()} SHAH
            </div>
            
            <div className="text-gray-600">Merchant:</div>
            <div>{merchantName}</div>
            
            <div className="text-gray-600">Provider:</div>
            <div className="capitalize">{paymentProvider}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
          {paymentUrl && (
            <button
              onClick={openPayment}
              className="mini-button bg-blue-500 hover:bg-blue-600 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Pay Now
            </button>
          )}
          
          <button
            onClick={copyToClipboard}
            className="mini-button bg-gray-500 hover:bg-gray-600 text-white"
          >
            <Copy className="w-4 h-4 mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          
          <button
            onClick={downloadQR}
            className="mini-button bg-green-500 hover:bg-green-600 text-white"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </button>
        </div>

        {/* Payment Instructions */}
        <div className="mt-4 text-xs text-gray-600">
          {paymentProvider === 'telegram' && (
            <p>Scan QR code or tap "Pay Now" to complete payment via Telegram</p>
          )}
          {paymentProvider === 'stripe' && (
            <p>Scan QR code or tap "Pay Now" to complete payment via Stripe</p>
          )}
          {paymentProvider === 'onchain' && (
            <p>Scan QR code with your wallet app to send SHAH directly</p>
          )}
        </div>
      </div>
    </div>
  )
} 