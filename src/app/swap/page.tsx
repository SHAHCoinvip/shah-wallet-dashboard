'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useAccount, useBalance, useContractWrite, useContractRead, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { getSHAHPrice } from '@/utils/getSHAHPrice'
import { ShahSwapABI } from '@/abi/ShahSwapABI'
import { erc20Abi } from 'viem'
import ChartEmbed from '@/components/ChartEmbed'
import GasControls from '@/components/GasControls'
import RoutePill from '@/components/RoutePill'
import { getBestQuote, BestQuote, QuoteParams } from '@/lib/quotes'
import { isBalancerRoutingEnabled } from '@/lib/quotes'

// Contract Addresses - Updated for DEX V3
const SHAHSWAP_CONTRACT = process.env.NEXT_PUBLIC_SHAHSWAP_ROUTER || '0x791c34Df045071eB9896DAfA57e3db46CBEBA11b'
const SHAHSWAP_ORACLE = process.env.NEXT_PUBLIC_SHAHSWAP_ORACLE
const SHAH_TOKEN_ADDRESS = '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8'
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

// Feature flags
const ENABLE_TWAP = process.env.NEXT_PUBLIC_ENABLE_TWAP === 'true'
const ENABLE_PERMIT = process.env.NEXT_PUBLIC_ENABLE_PERMIT === 'true'
const ENABLE_BATCH_SWAPS = process.env.NEXT_PUBLIC_ENABLE_BATCH_SWAPS === 'true'

export default function SwapPage() {
  const { address, isConnected } = useAccount()
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [shahPrice, setShahPrice] = useState<number>(0)
  const [slippage, setSlippage] = useState(0.5) // 0.5% default slippage
  const [swapDirection, setSwapDirection] = useState<'SHAH_TO_ETH' | 'ETH_TO_SHAH'>('SHAH_TO_ETH')
  const [isApproved, setIsApproved] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [gasFees, setGasFees] = useState<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }>({ maxFeePerGas: 0n, maxPriorityFeePerGas: 0n })
  const [bestQuote, setBestQuote] = useState<BestQuote | null>(null)
  const [isQuoteLoading, setIsQuoteLoading] = useState(false)
  const [showBalancerNotice, setShowBalancerNotice] = useState(false)
  
  // New state for enhanced features
  const [useTWAP, setUseTWAP] = useState(false)
  const [usePermit, setUsePermit] = useState(false)
  const [priceImpact, setPriceImpact] = useState<number>(0)
  const [twapPrice, setTwapPrice] = useState<number>(0)
  const [spotPrice, setSpotPrice] = useState<number>(0)

  // Get SHAH balance
  const { data: shahBalance } = useBalance({
    address,
    token: SHAH_TOKEN_ADDRESS as `0x${string}`,
  })

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
  })

  // Get SHAH allowance
  const { data: allowance } = useContractRead({
    address: SHAH_TOKEN_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, SHAHSWAP_CONTRACT as `0x${string}`] : undefined,
  })

  // Fetch SHAH price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await getSHAHPrice()
        setShahPrice(price)
        setSpotPrice(price)
      } catch (error) {
        console.error('Error fetching SHAH price:', error)
        setShahPrice(1.72) // Fallback price
        setSpotPrice(1.72)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Check if SHAH is approved
  useEffect(() => {
    if (allowance && amountIn) {
      const requiredAllowance = parseEther(amountIn)
      setIsApproved(allowance >= requiredAllowance)
    } else {
      setIsApproved(false)
    }
  }, [allowance, amountIn])

  // Calculate amount out based on current price
  useEffect(() => {
    if (amountIn && shahPrice > 0) {
      if (swapDirection === 'SHAH_TO_ETH') {
        const shahAmount = parseFloat(amountIn)
        const ethAmount = shahAmount * shahPrice
        setAmountOut(ethAmount.toFixed(6))
      } else {
        const ethAmount = parseFloat(amountIn)
        const shahAmount = ethAmount / shahPrice
        setAmountOut(shahAmount.toFixed(6))
      }
    } else {
      setAmountOut('')
    }
  }, [amountIn, shahPrice, swapDirection])

  // Enhanced quote fetching with Balancer routing
  useEffect(() => {
    if (amountIn && amountOut && isConnected) {
      setIsQuoteLoading(true)
      
      const quoteParams: QuoteParams = {
        tokenIn: swapDirection === 'SHAH_TO_ETH' ? SHAH_TOKEN_ADDRESS : WETH_ADDRESS,
        tokenOut: swapDirection === 'SHAH_TO_ETH' ? WETH_ADDRESS : SHAH_TOKEN_ADDRESS,
        amountIn: parseEther(amountIn).toString(),
        slippage: slippage / 100,
      }

      getBestQuote(quoteParams)
        .then((quote) => {
          setBestQuote(quote)
          if (quote.source === 'balancer') {
            setShowBalancerNotice(true)
          }
        })
        .catch((error) => {
          console.error('Error fetching quote:', error)
          setBestQuote(null)
        })
        .finally(() => {
          setIsQuoteLoading(false)
        })
    }
  }, [amountIn, amountOut, isConnected, swapDirection, slippage])

  // Approve SHAH token
  const { writeContract: writeApprove, isPending: isApprovePending } = useWriteContract()

  const handleApprove = async () => {
    if (!amountIn) {
      toast.error('Please enter an amount')
      return
    }

    try {
      setIsApproving(true)
      const amount = parseEther(amountIn)
      
      await writeApprove({
        address: SHAH_TOKEN_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [SHAHSWAP_CONTRACT as `0x${string}`, amount],
      })
      
      toast.success('Approval transaction sent!')
    } catch (error) {
      console.error('Error approving:', error)
      toast.error('Failed to approve SHAH token')
    } finally {
      setIsApproving(false)
    }
  }

  // Swap function
  const { writeContract: writeSwap, isPending: isSwapPending } = useWriteContract()

  const handleSwap = async () => {
    if (!amountIn || !amountOut) {
      toast.error('Please enter amounts')
      return
    }

    if (!isApproved && !usePermit) {
      toast.error('Please approve SHAH token first')
      return
    }

    try {
      const amountInWei = parseEther(amountIn)
      const minAmountOut = parseEther((parseFloat(amountOut) * (1 - slippage / 100)).toFixed(6))

      if (swapDirection === 'SHAH_TO_ETH') {
        await writeSwap({
          address: SHAHSWAP_CONTRACT as `0x${string}`,
          abi: ShahSwapABI,
          functionName: 'swapExactTokensForETH',
          args: [amountInWei, minAmountOut, [SHAH_TOKEN_ADDRESS as `0x${string}`, WETH_ADDRESS as `0x${string}`], address, Math.floor(Date.now() / 1000) + 1800],
        })
      } else {
        await writeSwap({
          address: SHAHSWAP_CONTRACT as `0x${string}`,
          abi: ShahSwapABI,
          functionName: 'swapExactETHForTokens',
          args: [minAmountOut, [WETH_ADDRESS as `0x${string}`, SHAH_TOKEN_ADDRESS as `0x${string}`], address, Math.floor(Date.now() / 1000) + 1800],
          value: amountInWei,
        })
      }

      toast.success('Swap transaction sent!')
    } catch (error) {
      console.error('Error swapping:', error)
      toast.error('Failed to execute swap')
    }
  }

  const switchDirection = () => {
    setSwapDirection(swapDirection === 'SHAH_TO_ETH' ? 'ETH_TO_SHAH' : 'SHAH_TO_ETH')
    setAmountIn('')
    setAmountOut('')
  }

  const currentPrice = useTWAP && twapPrice > 0 ? twapPrice : shahPrice
  const priceSource = useTWAP && twapPrice > 0 ? 'TWAP' : 'Spot'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--color-gold)' }}>Swap</h1>
        <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Trade tokens with SHAH Wallet</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <ChartEmbed 
            pair="ETH-SHAH"
            height={500}
            className="w-full"
          />
        </div>
        
        {/* Swap Interface */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-xl">
            <h1 className="text-3xl font-bold mb-4">🔄 ShahSwap V2</h1>
            <p className="text-sm text-gray-400 mb-6">
              Current SHAH Price: <span className="text-yellow-400">${currentPrice.toFixed(6)}</span>
              <span className="text-purple-400 ml-2">({priceSource})</span>
            </p>
            
            {/* Enhanced Features Status */}
            <div className="flex flex-wrap gap-2 mb-4">
              {ENABLE_TWAP && (
                <span className="px-2 py-1 bg-blue-600 text-xs rounded-full">TWAP Oracle</span>
              )}
              {ENABLE_PERMIT && (
                <span className="px-2 py-1 bg-green-600 text-xs rounded-full">Permit Support</span>
              )}
              {ENABLE_BATCH_SWAPS && (
                <span className="px-2 py-1 bg-purple-600 text-xs rounded-full">Batch Swaps</span>
              )}
            </div>

            <p className="text-xs text-purple-400 mb-6">
              Powered by ShahSwap Router V2: {SHAHSWAP_CONTRACT.slice(0, 6)}...{SHAHSWAP_CONTRACT.slice(-4)}
            </p>
            
            {/* Route Pill */}
            {isBalancerRoutingEnabled() && (
              <div className="mb-4">
                <RoutePill 
                  bestQuote={bestQuote} 
                  isLoading={isQuoteLoading}
                  className="mb-2"
                />
              </div>
            )}

            {/* TWAP Toggle */}
            {ENABLE_TWAP && twapPrice > 0 && (
              <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Use TWAP Price</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useTWAP}
                      onChange={(e) => setUseTWAP(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  TWAP: ${twapPrice.toFixed(6)} | Spot: ${spotPrice.toFixed(6)}
                </p>
              </div>
            )}

            {/* Permit Toggle */}
            {ENABLE_PERMIT && (
              <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Use Permit (Gasless Approval)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usePermit}
                      onChange={(e) => setUsePermit(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Skip token approval and sign permit instead
                </p>
              </div>
            )}

            {/* Price Impact Warning */}
            {priceImpact > 5 && (
              <div className="mb-4 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  ⚠️ High price impact: {priceImpact.toFixed(2)}%
                </p>
              </div>
            )}

            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Connect your wallet to start swapping</p>
                <ConnectButton />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Slippage Settings */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Slippage Tolerance</span>
                  <div className="flex gap-2">
                    {[0.1, 0.5, 1.0].map((value) => (
                      <button
                        key={value}
                        onClick={() => setSlippage(value)}
                        className={`px-3 py-1 text-xs rounded ${
                          slippage === value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Swap Direction Toggle */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={switchDirection}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    ↕️
                  </button>
                </div>

                {/* From Token */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">From</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={amountIn}
                      onChange={(e) => setAmountIn(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                    <div className="px-3 py-2 bg-gray-700 rounded-lg">
                      <span className="text-sm font-medium">
                        {swapDirection === 'SHAH_TO_ETH' ? 'SHAH' : 'ETH'}
                      </span>
                    </div>
                  </div>
                  {shahBalance && (
                    <p className="text-xs text-gray-400">
                      Balance: {formatEther(shahBalance.value)}
                    </p>
                  )}
                </div>

                {/* To Token */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">To</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={amountOut}
                      placeholder="0.0"
                      disabled
                      className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                    <div className="px-3 py-2 bg-gray-700 rounded-lg">
                      <span className="text-sm font-medium">
                        {swapDirection === 'SHAH_TO_ETH' ? 'ETH' : 'SHAH'}
                      </span>
                    </div>
                  </div>
                  {ethBalance && (
                    <p className="text-xs text-gray-400">
                      Balance: {formatEther(ethBalance.value)}
                    </p>
                  )}
                </div>

                {/* Gas Controls */}
                <GasControls
                  gasFees={gasFees}
                  setGasFees={setGasFees}
                />

                {/* Action Button */}
                <div className="pt-4">
                  {!isApproved && !usePermit ? (
                    <button
                      onClick={handleApprove}
                      disabled={!amountIn || isApproving}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 rounded-lg font-semibold transition-colors"
                    >
                      {isApproving ? 'Approving...' : 'Approve SHAH'}
                    </button>
                  ) : (
                    <button
                      onClick={handleSwap}
                      disabled={!amountIn || !isConnected || (!isApproved && !usePermit)}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-3 rounded-lg font-semibold transition-colors"
                    >
                      {usePermit ? 'Swap with Permit' : 'Swap'}
                    </button>
                  )}
                </div>

                {/* Balancer Notice */}
                {showBalancerNotice && (
                  <div className="bg-blue-900 border border-blue-700 p-3 rounded-lg text-sm">
                    <p className="text-blue-200">
                      Balancer routing shows the best price, but execution will use ShahSwap for security. This is read-only routing.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}