'use client'

import { useState, useEffect } from 'react'
import { useAccount, useBalance, useContractRead, usePublicClient, useWriteContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ArrowDownUp, Settings, Info, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { getSHAHPrice } from '@/utils/getSHAHPrice'
import { ShahSwapABI } from '@/abi/ShahSwapABI'
import { erc20Abi } from 'viem'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Contract Addresses - Updated for DEX V3
const SHAHSWAP_CONTRACT = (process.env.NEXT_PUBLIC_SHAHSWAP_ROUTER || '0x791c34Df045071eB9896DAfA57e3db46CBEBA11b') as `0x${string}`
const SHAH_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_SHAH || '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8') as `0x${string}`
const WETH_ADDRESS = (process.env.NEXT_PUBLIC_WETH || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2') as `0x${string}`

export default function SwapPage() {
  const { address, isConnected } = useAccount()
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [shahPrice, setShahPrice] = useState<number>(1.72)
  const [ethPriceUsd, setEthPriceUsd] = useState<number>(2000)
  const [slippage, setSlippage] = useState(0.5)
  const [swapDirection, setSwapDirection] = useState<'SHAH_TO_ETH' | 'ETH_TO_SHAH'>('ETH_TO_SHAH')
  const [isApproved, setIsApproved] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isFetchingQuote, setIsFetchingQuote] = useState(false)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)

  const publicClient = usePublicClient()

  // Get SHAH balance
  const { data: shahBalance } = useBalance({
    address,
    token: SHAH_TOKEN_ADDRESS,
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
    args: address ? [address, SHAHSWAP_CONTRACT] : undefined,
  })

  // Fetch SHAH price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const [shahUsd, ethUsd] = await Promise.all([
          getSHAHPrice(),
          fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
            .then((res) => res.json())
            .then((data) => Number(data?.ethereum?.usd || 2000))
            .catch(() => 2000),
        ])

        setShahPrice(shahUsd > 0 ? shahUsd : 1.72)
        setEthPriceUsd(ethUsd > 0 ? ethUsd : 2000)
      } catch (error) {
        console.error('Error fetching SHAH price:', error)
        setShahPrice(1.72)
        setEthPriceUsd(2000)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 30000)
    return () => clearInterval(interval)
  }, [])

  // Check if SHAH is approved
  useEffect(() => {
    if (allowance && fromAmount && swapDirection === 'SHAH_TO_ETH') {
      const requiredAllowance = parseEther(fromAmount)
      setIsApproved(allowance >= requiredAllowance)
    } else {
      setIsApproved(true)
    }
  }, [allowance, fromAmount, swapDirection])

  // Calculate amount out based on current price
  useEffect(() => {
    let cancelled = false

    const fetchQuote = async () => {
      if (!publicClient) return

      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setToAmount('')
        setExchangeRate(null)
        return
      }

      try {
        setIsFetchingQuote(true)
        const amountIn = parseEther(fromAmount)
        const path =
          swapDirection === 'ETH_TO_SHAH'
            ? [WETH_ADDRESS, SHAH_TOKEN_ADDRESS]
            : [SHAH_TOKEN_ADDRESS, WETH_ADDRESS]

        const amounts = (await publicClient.readContract({
          address: SHAHSWAP_CONTRACT,
          abi: ShahSwapABI,
          functionName: 'getAmountsOut',
          args: [amountIn, path],
        })) as bigint[]

        if (cancelled) return

        const amountOut = amounts?.[amounts.length - 1] ?? 0n
        const formattedOut = formatEther(amountOut)
        setToAmount(formattedOut)

        const rate = parseFloat(formattedOut) / parseFloat(fromAmount)
        setExchangeRate(Number.isFinite(rate) ? rate : null)
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch quote:', error)
          setToAmount('')
          setExchangeRate(null)
        }
      } finally {
        if (!cancelled) setIsFetchingQuote(false)
      }
    }

    fetchQuote()

    return () => {
      cancelled = true
    }
  }, [fromAmount, swapDirection, publicClient])

  // Approve SHAH token
  const { writeContract: writeApprove } = useWriteContract()

  const handleApprove = async () => {
    if (!fromAmount) {
      toast.error('Please enter an amount')
      return
    }

    try {
      setIsApproving(true)
      const amount = parseEther(fromAmount)
      
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
  const { writeContract: writeSwap } = useWriteContract()

  const handleSwap = async () => {
    if (!fromAmount || !toAmount) {
      toast.error('Please enter amounts')
      return
    }

    if (swapDirection === 'SHAH_TO_ETH' && !isApproved) {
      toast.error('Please approve SHAH token first')
      return
    }

    try {
      const amountInWei = parseEther(fromAmount)
      const minAmountOut = parseEther((parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6))

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
    setFromAmount('')
    setToAmount('')
  }

  const priceImpact = 0.01 // Placeholder
  const networkFee = 2.45 // Placeholder

  return (
    <div className="min-h-screen p-8 flex items-center justify-center" style={{ background: '#0A0A0A' }}>
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>Swap</h1>
          <p style={{ color: '#A1A1AA' }}>Trade tokens instantly with the best rates</p>
        </div>

        {!isConnected ? (
          <div className="text-center p-12 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <p className="mb-6" style={{ color: '#A1A1AA' }}>Connect your wallet to start swapping</p>
            <ConnectButton />
          </div>
        ) : (
          <>
            {/* Swap Card */}
            <div className="p-6 rounded-2xl relative" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              {/* Settings Button */}
              <button className="absolute top-6 right-6 p-2 rounded-lg hover:bg-opacity-20 transition-all" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                <Settings className="w-5 h-5" style={{ color: '#A1A1AA' }} />
              </button>

              {/* From Token */}
              <div className="mb-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm" style={{ color: '#A1A1AA' }}>From</label>
                  <span className="text-xs" style={{ color: '#A1A1AA' }}>
                    Balance: {swapDirection === 'ETH_TO_SHAH' 
                      ? ethBalance ? formatEther(ethBalance.value) : '0'
                      : shahBalance ? formatEther(shahBalance.value) : '0'
                    } {swapDirection === 'ETH_TO_SHAH' ? 'ETH' : 'SHAH'}
                  </span>
                </div>
                
                <div className="p-4 rounded-xl" style={{ background: 'rgba(10, 10, 10, 0.5)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="0.0"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      className="border-0 bg-transparent text-2xl p-0 h-auto focus:outline-none w-full"
                      style={{ color: '#F1F1F1' }}
                    />
                    
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-80 transition-all ml-4" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                      {swapDirection === 'ETH_TO_SHAH' ? (
                        <>
                          <div className="w-6 h-6 rounded-full" style={{ background: '#3B82F6' }} />
                          <span style={{ color: '#F1F1F1' }}>ETH</span>
                        </>
                      ) : (
                        <>
                          <Image src="/shah-blue-logo.png" alt="SHAH" width={24} height={24} className="object-contain" />
                          <span style={{ color: '#F1F1F1' }}>SHAH</span>
                        </>
                      )}
                      <ChevronDown className="w-4 h-4" style={{ color: '#A1A1AA' }} />
                    </button>
                  </div>
                  
                  <div className="mt-2 text-sm" style={{ color: '#A1A1AA' }}>
                    ≈ $
                    {fromAmount
                      ? (
                          parseFloat(fromAmount) *
                          (swapDirection === 'ETH_TO_SHAH' ? ethPriceUsd : shahPrice)
                        ).toFixed(2)
                      : '0.00'}
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center my-4">
                <button 
                  onClick={switchDirection}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110" 
                  style={{ background: 'rgba(212, 175, 55, 0.2)', border: '2px solid rgba(212, 175, 55, 0.3)' }}
                >
                  <ArrowDownUp className="w-5 h-5" style={{ color: '#D4AF37' }} />
                </button>
              </div>

              {/* To Token */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm" style={{ color: '#A1A1AA' }}>To</label>
                  <span className="text-xs" style={{ color: '#A1A1AA' }}>
                    Balance: {swapDirection === 'SHAH_TO_ETH' 
                      ? ethBalance ? formatEther(ethBalance.value) : '0'
                      : shahBalance ? formatEther(shahBalance.value) : '0'
                    } {swapDirection === 'SHAH_TO_ETH' ? 'ETH' : 'SHAH'}
                  </span>
                </div>
                
                <div className="p-4 rounded-xl" style={{ background: 'rgba(10, 10, 10, 0.5)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="0.0"
                      value={toAmount}
                      disabled
                      className="border-0 bg-transparent text-2xl p-0 h-auto focus:outline-none w-full opacity-70"
                      style={{ color: '#F1F1F1' }}
                    />
                    
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-80 transition-all ml-4" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                      {swapDirection === 'SHAH_TO_ETH' ? (
                        <>
                          <div className="w-6 h-6 rounded-full" style={{ background: '#3B82F6' }} />
                          <span style={{ color: '#F1F1F1' }}>ETH</span>
                        </>
                      ) : (
                        <>
                          <Image src="/shah-blue-logo.png" alt="SHAH" width={24} height={24} className="object-contain" />
                          <span style={{ color: '#F1F1F1' }}>SHAH</span>
                        </>
                      )}
                      <ChevronDown className="w-4 h-4" style={{ color: '#A1A1AA' }} />
                    </button>
                  </div>
                  
                  <div className="mt-2 text-sm" style={{ color: '#A1A1AA' }}>
                    ≈ $
                    {toAmount
                      ? (
                          parseFloat(toAmount) *
                          (swapDirection === 'SHAH_TO_ETH' ? ethPriceUsd : shahPrice)
                        ).toFixed(2)
                      : '0.00'}
                  </div>
                </div>
              </div>

              {/* Exchange Info */}
              <div className="mb-6 p-4 rounded-xl space-y-2" style={{ background: 'rgba(10, 10, 10, 0.3)', border: '1px solid rgba(212, 175, 55, 0.05)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-1" style={{ color: '#A1A1AA' }}>
                    <Info className="w-3 h-3" />
                    Rate
                  </span>
                  <span className="text-sm" style={{ color: '#F1F1F1' }}>
                    1 {swapDirection === 'ETH_TO_SHAH' ? 'ETH' : 'SHAH'} =
                    {' '}
                    {exchangeRate
                      ? (swapDirection === 'ETH_TO_SHAH' ? exchangeRate : 1 / exchangeRate).toFixed(6)
                      : '—'}{' '}
                    {swapDirection === 'ETH_TO_SHAH' ? 'SHAH' : 'ETH'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#A1A1AA' }}>Price Impact</span>
                  <span className="text-sm" style={{ color: '#10B981' }}>{'< 0.01%'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#A1A1AA' }}>Network Fee</span>
                  <span className="text-sm" style={{ color: '#F1F1F1' }}>~${networkFee}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#A1A1AA' }}>Minimum Received</span>
                  <span className="text-sm" style={{ color: '#F1F1F1' }}>
                    {toAmount ? (parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6) : '0'} {swapDirection === 'SHAH_TO_ETH' ? 'ETH' : 'SHAH'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {swapDirection === 'SHAH_TO_ETH' && !isApproved ? (
                <button 
                  onClick={handleApprove}
                  disabled={!fromAmount || isApproving}
                  className="w-full h-14 text-lg rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)', color: '#FFFFFF' }}
                >
                  {isApproving ? 'Approving...' : 'Approve SHAH'}
                </button>
              ) : (
                <button 
                  onClick={handleSwap}
                  disabled={!fromAmount || !isConnected}
                  className="w-full h-14 text-lg rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}
                >
                  Swap
                </button>
              )}
            </div>

            {/* Info Banner */}
            <div className="mt-6 p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <Info className="w-5 h-5 mt-0.5" style={{ color: '#3B82F6' }} />
              <div>
                <div className="text-sm mb-1" style={{ color: '#3B82F6' }}>Best Rate Guarantee</div>
                <div className="text-xs" style={{ color: '#A1A1AA' }}>
                  We automatically find the best exchange rate across multiple DEXs to ensure you get the most tokens for your swap.
                </div>
              </div>
            </div>

            {/* Recent Swaps */}
            <div className="mt-6">
              <h3 className="text-sm mb-3" style={{ color: '#A1A1AA' }}>Recent Swaps</h3>
              <div className="space-y-2">
                {[
                  { from: 'ETH', to: 'SHAH', fromAmount: '0.5', toAmount: '1,422', time: '2 mins ago' },
                  { from: 'SHAH', to: 'USDT', fromAmount: '500', toAmount: '1,820', time: '1 hour ago' },
                  { from: 'ETH', to: 'SHAH', fromAmount: '0.2', toAmount: '569', time: '3 hours ago' },
                ].map((swap, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(17, 17, 17, 0.5)' }}>
                    <div className="flex items-center gap-2">
                      <div className="text-sm" style={{ color: '#F1F1F1' }}>
                        {swap.fromAmount} {swap.from}
                      </div>
                      <ArrowDownUp className="w-3 h-3" style={{ color: '#A1A1AA' }} />
                      <div className="text-sm" style={{ color: '#F1F1F1' }}>
                        {swap.toAmount} {swap.to}
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: '#A1A1AA' }}>{swap.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
