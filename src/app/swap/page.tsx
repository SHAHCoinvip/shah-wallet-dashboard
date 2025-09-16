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
  const [gasEstimate, setGasEstimate] = useState<number>(0)
  const [swapTx, setSwapTx] = useState<`0x${string}` | undefined>()

  // Get SHAH token balance
  const { data: shahBalance } = useBalance({
    address,
    token: SHAH_TOKEN_ADDRESS as `0x${string}`,
  })

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
  })

  // Check SHAH token allowance
  const { data: allowance } = useContractRead({
    address: SHAH_TOKEN_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, SHAHSWAP_CONTRACT as `0x${string}`],
  })

  // Get TWAP price from oracle
  const { data: twapPriceData } = useContractRead({
    address: SHAHSWAP_ORACLE as `0x${string}`,
    abi: [
      {
        inputs: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "period", type: "uint32" }
        ],
        name: "consult",
        outputs: [
          { name: "amountOut", type: "uint256" },
          { name: "priceTWAP", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: 'consult',
    args: [
      SHAH_TOKEN_ADDRESS as `0x${string}`,
      WETH_ADDRESS as `0x${string}`,
      parseEther('1'),
      1800 // 30 minutes TWAP
    ],
  })

  // Get spot price from oracle
  const { data: spotPriceData } = useContractRead({
    address: SHAHSWAP_ORACLE as `0x${string}`,
    abi: [
      {
        inputs: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" }
        ],
        name: "getSpotPrice",
        outputs: [
          { name: "amountOut", type: "uint256" },
          { name: "priceSpot", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: 'getSpotPrice',
    args: [
      SHAH_TOKEN_ADDRESS as `0x${string}`,
      WETH_ADDRESS as `0x${string}`,
      parseEther('1')
    ],
  })

  // Get price impact
  const { data: priceImpactData } = useContractRead({
    address: SHAHSWAP_ORACLE as `0x${string}`,
    abi: [
      {
        inputs: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" }
        ],
        name: "getPriceImpact",
        outputs: [{ name: "priceImpact", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: 'getPriceImpact',
    args: [
      SHAH_TOKEN_ADDRESS as `0x${string}`,
      WETH_ADDRESS as `0x${string}`,
      parseEther(amountIn || '0')
    ],
  })

  // Contract write hooks
  const { writeContract: writeContract, data: approvalTx } = useWriteContract()

  // Swap transaction function
  const handleSwap = async () => {
    if (!amountIn || !isConnected || (!isApproved && !usePermit)) return

    if (usePermit) {
      // For permit swaps, the wallet will handle the signature
      toast.info('🔐 Using permit for gasless approval...')
    }

    try {
      const swapArgs = usePermit ? [
        {
          amountIn: parseEther(amountIn),
          amountOutMin: 0, // Will be calculated based on slippage
          path: [SHAH_TOKEN_ADDRESS as `0x${string}`, WETH_ADDRESS as `0x${string}`],
          to: address!,
          deadline: Math.floor(Date.now() / 1000) + 1200
        },
        Math.floor(Date.now() / 1000) + 1200,
        0, // v - will be provided by wallet
        '0x0000000000000000000000000000000000000000000000000000000000000000', // r
        '0x0000000000000000000000000000000000000000000000000000000000000000'  // s
      ] : [
        parseEther(amountIn),
        0, // amountOutMin - will be calculated based on slippage
        [SHAH_TOKEN_ADDRESS as `0x${string}`, WETH_ADDRESS as `0x${string}`],
        address!,
        Math.floor(Date.now() / 1000) + 1200, // 20 minutes deadline
      ]

      const hash = await writeContract({
        address: SHAHSWAP_CONTRACT as `0x${string}`,
        abi: ShahSwapABI,
        functionName: usePermit ? 'swapExactTokensForTokensWithPermit' : 'swapExactTokensForTokens',
        args: swapArgs,
        ...(gasFees.maxFeePerGas > 0n && {
          maxFeePerGas: gasFees.maxFeePerGas,
          maxPriorityFeePerGas: gasFees.maxPriorityFeePerGas,
        }),
      })
      
      // Set the transaction hash for the waiting logic
      setSwapTx(hash)
    } catch (error) {
      console.error('Swap failed:', error)
      toast.error('Swap failed')
    }
  }

  // Wait for approval transaction
  useWaitForTransactionReceipt({
    hash: approvalTx,
    onSuccess() {
      toast.success('✅ Token approval successful!')
      setIsApproved(true)
      setIsApproving(false)
    },
    onError() {
      toast.error('❌ Token approval failed')
      setIsApproving(false)
    },
  })

  // Wait for swap transaction
  useWaitForTransactionReceipt({
    hash: swapTx,
    onSuccess() {
      toast.success('✅ Swap completed successfully!')
      setAmountIn('')
      setAmountOut('')
    },
    onError() {
      toast.error('❌ Swap failed')
    },
  })

  // Fetch SHAH price and update prices
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await getSHAHPrice()
        setShahPrice(price)
        setSpotPrice(price)
        
        // Update TWAP price if available
        if (twapPriceData && twapPriceData[1]) {
          const twapPriceValue = Number(formatEther(twapPriceData[1])) * 1e12 // Convert from Q112.112
          setTwapPrice(twapPriceValue)
        }
        
        // Update price impact if available
        if (priceImpactData) {
          setPriceImpact(Number(priceImpactData) / 100) // Convert from basis points to percentage
        }
      } catch (error) {
        console.error('Failed to fetch SHAH price:', error)
      }
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [twapPriceData, priceImpactData])

  // Calculate output amount
  useEffect(() => {
    if (amountIn && shahPrice) {
      const inputAmount = parseFloat(amountIn)
      const currentPrice = useTWAP && twapPrice > 0 ? twapPrice : shahPrice
      const outputAmount = inputAmount * currentPrice
      setAmountOut(outputAmount.toFixed(6))
    } else {
      setAmountOut('')
    }
  }, [amountIn, shahPrice, twapPrice, useTWAP])

  // Check if user has sufficient allowance
  useEffect(() => {
    if (allowance && amountIn) {
      const requiredAmount = parseEther(amountIn)
      setIsApproved(allowance >= requiredAmount)
    }
  }, [allowance, amountIn])

  // Get best quote when amount changes
  useEffect(() => {
    if (amountIn && isBalancerRoutingEnabled()) {
      setIsQuoteLoading(true)
      const fetchQuote = async () => {
        try {
          const params: QuoteParams = {
            amountIn: parseFloat(amountIn),
            tokenIn: SHAH_TOKEN_ADDRESS,
            tokenOut: WETH_ADDRESS,
            slippage: slippage / 100
          }
          const quote = await getBestQuote(params)
          setBestQuote(quote)
        } catch (error) {
          console.error('Failed to get quote:', error)
        } finally {
          setIsQuoteLoading(false)
        }
      }
      fetchQuote()
    }
  }, [amountIn, slippage])

  const handleApprove = () => {
    if (!approve) return
    setIsApproving(true)
    approve()
  }


  const switchDirection = () => {
    setSwapDirection(swapDirection === 'SHAH_TO_ETH' ? 'ETH_TO_SHAH' : 'SHAH_TO_ETH')
    setAmountIn('')
    setAmountOut('')
  }

  const currentPrice = useTWAP && twapPrice > 0 ? twapPrice : shahPrice
  const priceSource = useTWAP && twapPrice > 0 ? 'TWAP' : 'Spot'

  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto mt-10">
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
                    <span className="text-sm">Use TWAP Price (30min avg)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useTWAP}
                        onChange={(e) => setUseTWAP(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    TWAP: ${twapPrice.toFixed(6)} | Spot: ${spotPrice.toFixed(6)}
                  </div>
                </div>
              )}

              {/* Permit Toggle */}
              {ENABLE_PERMIT && (
                <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Use Permit (Gasless Approval)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePermit}
                        onChange={(e) => setUsePermit(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Skip approval transaction, save gas
                  </div>
                </div>
              )}

              {!isConnected ? (
                <ConnectButton />
              ) : (
                <div className="space-y-4">
                  {/* Input Amount */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">You Pay</span>
                      <span className="text-sm text-gray-400">
                        Balance: {formatEther(shahBalance?.value || 0n)} SHAH
                      </span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={amountIn}
                        onChange={(e) => setAmountIn(e.target.value)}
                        placeholder="0.0"
                        className="flex-1 bg-transparent text-2xl font-bold outline-none"
                      />
                      <button
                        onClick={switchDirection}
                        className="ml-2 p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        🔄
                      </button>
                    </div>
                    <div className="text-sm text-gray-400">SHAH</div>
                  </div>

                  {/* Output Amount */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">You Receive</span>
                      <span className="text-sm text-gray-400">
                        Balance: {formatEther(ethBalance?.value || 0n)} ETH
                      </span>
                    </div>
                    <div className="text-2xl font-bold">{amountOut || '0.0'}</div>
                    <div className="text-sm text-gray-400">ETH</div>
                  </div>

                  {/* Price Impact */}
                  {priceImpact > 0 && (
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Price Impact</span>
                        <span className={`text-sm ${priceImpact > 2 ? 'text-red-400' : priceImpact > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {priceImpact.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Slippage Settings */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Slippage Tolerance</span>
                    </div>
                    <div className="flex gap-2">
                      {[0.1, 0.5, 1.0].map((value) => (
                        <button
                          key={value}
                          onClick={() => setSlippage(value)}
                          className={`px-3 py-1 rounded text-sm ${
                            slippage === value ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          {value}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gas Controls */}
                  <GasControls onGasFeesChange={setGasFees} />

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {!isApproved && !usePermit ? (
                      <button
                        onClick={handleApprove}
                        disabled={!approve || isApproving}
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
    </main>
  )
}

