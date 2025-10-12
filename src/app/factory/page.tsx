'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { toast } from 'react-hot-toast'
import { Factory, CheckCircle2, Info } from 'lucide-react'
import Link from 'next/link'
import { 
  CONTRACTS, 
  TokenFeatures, 
  TokenCreationArgs,
  getFeatureBitmap,
  validateTokenParams,
  decodeTokenCreated,
  formatShahPrice,
  calcShahForUsd,
  PRICING
} from '@/lib/factory'
import { SHAHFactoryABI } from '@/abi/SHAHFactory'
import { SHAHPriceOracleABI } from '@/abi/SHAHPriceOracle'
import { ERC20ABI } from '@/abi/ERC20'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

type PaymentMethod = 'shah' | 'card'
type CreateStep = 'idle' | 'approving' | 'creating' | 'success'

export default function FactoryPage() {
  const { address, isConnected } = useAccount()
  
  const [currentStep, setCurrentStep] = useState(1)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 18,
    initialSupply: '',
    owner: address || '',
    maxSupply: ''
  })
  
  const [features, setFeatures] = useState<TokenFeatures>({
    basic: true,
    burnable: false,
    pausable: false,
    capped: false,
    ownable: true,
    upgradeable: false
  })
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('shah')
  const [createStep, setCreateStep] = useState<CreateStep>('idle')
  const [createdTokenAddress, setCreatedTokenAddress] = useState<`0x${string}` | null>(null)
  const [requiredShahAmount, setRequiredShahAmount] = useState<string>('0')
  
  // Contract reads
  const { data: shahPriceData } = useReadContract({
    address: CONTRACTS.SHAH_PRICE_ORACLE,
    abi: SHAHPriceOracleABI,
    functionName: 'getPriceInUSD',
  })
  
  const shahPrice = formatShahPrice(shahPriceData)
  
  const { data: shahBalance } = useReadContract({
    address: CONTRACTS.SHAH_TOKEN,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  })
  
  const { data: shahAllowance } = useReadContract({
    address: CONTRACTS.SHAH_TOKEN,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [address!, CONTRACTS.SHAH_FACTORY],
    query: { enabled: !!address }
  })
  
  // Contract writes
  const { writeContract: approveShah, data: approveHash } = useWriteContract()
  const { writeContract: createToken, data: createHash } = useWriteContract()
  
  // Transaction receipts
  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: approveHash,
    onSuccess: () => {
      toast.success('✅ SHAH approved successfully!')
      setCreateStep('creating')
      handleCreateToken()
    },
    onError: () => {
      toast.error('❌ SHAH approval failed')
      setCreateStep('idle')
    }
  })
  
  const { isLoading: isCreating } = useWaitForTransactionReceipt({
    hash: createHash,
    onSuccess: (receipt) => {
      const tokenAddress = decodeTokenCreated(receipt.logs)
      if (tokenAddress) {
        setCreatedTokenAddress(tokenAddress)
        setCreateStep('success')
        toast.success('🎉 Token created successfully!')
      } else {
        toast.error('❌ Failed to get token address from transaction')
        setCreateStep('idle')
      }
    },
    onError: () => {
      toast.error('❌ Token creation failed')
      setCreateStep('idle')
    }
  })
  
  // Update owner when wallet connects
  useEffect(() => {
    if (address && !formData.owner) {
      setFormData(prev => ({ ...prev, owner: address }))
    }
  }, [address, formData.owner])
  
  // Calculate required SHAH amount
  useEffect(() => {
    if (shahPrice && paymentMethod === 'shah') {
      try {
        const usdAmount = PRICING.SHAH_USD
        const shahAmountWei = calcShahForUsd(usdAmount, shahPrice)
        setRequiredShahAmount(shahAmountWei)
      } catch (error) {
        console.error('Error calculating SHAH amount:', error)
      }
    }
  }, [shahPrice, paymentMethod])
  
  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleFeatureChange = (feature: keyof TokenFeatures, checked: boolean) => {
    setFeatures(prev => ({ ...prev, [feature]: checked }))
  }
  
  const isFormValid = () => {
    const errors = validateTokenParams({
      ...formData,
      owner: formData.owner as `0x${string}`,
      features: getFeatureBitmap(features),
      maxSupply: features.capped ? formData.maxSupply : '0'
    })
    return errors.length === 0
  }
  
  const needsApproval = () => {
    if (paymentMethod !== 'shah' || !shahAllowance || !requiredShahAmount) return false
    return BigInt(shahAllowance.toString()) < BigInt(requiredShahAmount)
  }
  
  const hasEnoughShah = () => {
    if (paymentMethod !== 'shah' || !shahBalance || !requiredShahAmount) return true
    return BigInt(shahBalance.toString()) >= BigInt(requiredShahAmount)
  }
  
  const handleApproveShah = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }
    
    try {
      setCreateStep('approving')
      await approveShah({
        address: CONTRACTS.SHAH_TOKEN,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [CONTRACTS.SHAH_FACTORY, BigInt(requiredShahAmount)]
      })
    } catch (error) {
      console.error('Approval error:', error)
      setCreateStep('idle')
      toast.error('❌ Failed to approve SHAH')
    }
  }
  
  const handleCreateToken = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }
    
    if (!isFormValid()) {
      toast.error('Please check all form fields')
      return
    }
    
    try {
      setCreateStep('creating')
      
      const tokenArgs: TokenCreationArgs = {
        name: formData.name,
        symbol: formData.symbol,
        decimals: formData.decimals,
        initialSupply: parseUnits(formData.initialSupply, formData.decimals).toString(),
        owner: formData.owner as `0x${string}`,
        features: getFeatureBitmap(features),
        maxSupply: features.capped ? parseUnits(formData.maxSupply, formData.decimals).toString() : '0'
      }
      
      await createToken({
        address: CONTRACTS.SHAH_FACTORY,
        abi: SHAHFactoryABI,
        functionName: 'createToken',
        args: [
          tokenArgs.name,
          tokenArgs.symbol,
          tokenArgs.decimals,
          BigInt(tokenArgs.initialSupply),
          tokenArgs.owner,
          tokenArgs.features,
          BigInt(tokenArgs.maxSupply)
        ]
      })
    } catch (error) {
      console.error('Create token error:', error)
      setCreateStep('idle')
      toast.error('❌ Failed to create token')
    }
  }

  const steps = [
    { number: 1, title: 'Token Details', description: 'Basic information' },
    { number: 2, title: 'Tokenomics', description: 'Supply & fees' },
    { number: 3, title: 'Confirm', description: 'Review & deploy' },
  ]

  return (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>Token Factory</h1>
        <p style={{ color: '#A1A1AA' }}>Create your own custom token in minutes</p>
      </div>

      {!isConnected ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-12 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <Factory className="w-10 h-10" style={{ color: '#D4AF37' }} />
            </div>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: '#F1F1F1' }}>Connect Your Wallet</h2>
            <p className="mb-8" style={{ color: '#A1A1AA' }}>Connect your wallet to create tokens</p>
            <ConnectButton />
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Stepper */}
          <div className="mb-8 flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      currentStep >= step.number
                        ? 'gold-gradient'
                        : 'bg-[#111111] border border-[rgba(212,175,55,0.2)]'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-6 h-6 text-black" />
                    ) : (
                      <span className={currentStep === step.number ? 'text-black' : ''} style={{ color: currentStep === step.number ? '#0A0A0A' : '#A1A1AA' }}>
                        {step.number}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-sm mb-1" style={{ color: currentStep >= step.number ? '#F1F1F1' : '#A1A1AA' }}>
                      {step.title}
                    </div>
                    <div className="text-xs" style={{ color: '#A1A1AA' }}>{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 mt-[-24px]" style={{ background: currentStep > step.number ? '#D4AF37' : 'rgba(212, 175, 55, 0.1)' }} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="p-8 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            {/* Step 1: Token Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="tokenName" className="block mb-2" style={{ color: '#F1F1F1' }}>Token Name</label>
                  <input
                    id="tokenName"
                    placeholder="e.g., My Awesome Token"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl focus:outline-none"
                    style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                  />
                </div>

                <div>
                  <label htmlFor="tokenSymbol" className="block mb-2" style={{ color: '#F1F1F1' }}>Token Symbol</label>
                  <input
                    id="tokenSymbol"
                    placeholder="e.g., MAT"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl focus:outline-none"
                    style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                  />
                </div>

                <div>
                  <label htmlFor="decimals" className="block mb-2" style={{ color: '#F1F1F1' }}>Decimals</label>
                  <input
                    id="decimals"
                    type="number"
                    value={formData.decimals}
                    onChange={(e) => handleInputChange('decimals', parseInt(e.target.value))}
                    className="w-full h-12 px-4 rounded-xl focus:outline-none"
                    style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Tokenomics */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="totalSupply" className="block mb-2" style={{ color: '#F1F1F1' }}>Initial Supply</label>
                  <input
                    id="totalSupply"
                    placeholder="e.g., 1000000"
                    value={formData.initialSupply}
                    onChange={(e) => handleInputChange('initialSupply', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl focus:outline-none"
                    style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                  />
                </div>

                {features.capped && (
                  <div>
                    <label htmlFor="maxSupply" className="block mb-2" style={{ color: '#F1F1F1' }}>Max Supply</label>
                    <input
                      id="maxSupply"
                      placeholder="Leave empty for no limit"
                      value={formData.maxSupply}
                      onChange={(e) => handleInputChange('maxSupply', e.target.value)}
                      className="w-full h-12 px-4 rounded-xl focus:outline-none"
                      style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block mb-2" style={{ color: '#F1F1F1' }}>Token Features</label>
                  {Object.entries(features).filter(([key]) => key !== 'basic' && key !== 'ownable').map(([key, value]) => (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleFeatureChange(key as keyof TokenFeatures, e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="capitalize" style={{ color: '#F1F1F1' }}>{key}</span>
                    </label>
                  ))}
                </div>

                <div className="p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div className="text-sm mb-2 flex items-center gap-2" style={{ color: '#3B82F6' }}>
                    <Info className="w-4 h-4" />
                    Pro Tip
                  </div>
                  <div className="text-xs" style={{ color: '#A1A1AA' }}>
                    Choose features carefully. Some features like pausable and upgradeable require additional setup.
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="p-6 rounded-xl" style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                  <h3 className="text-lg mb-4" style={{ color: '#F1F1F1' }}>Token Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span style={{ color: '#A1A1AA' }}>Token Name</span>
                      <span style={{ color: '#F1F1F1' }}>{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#A1A1AA' }}>Symbol</span>
                      <span style={{ color: '#F1F1F1' }}>{formData.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#A1A1AA' }}>Initial Supply</span>
                      <span style={{ color: '#F1F1F1' }}>{formData.initialSupply}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#A1A1AA' }}>Decimals</span>
                      <span style={{ color: '#F1F1F1' }}>{formData.decimals}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <h3 className="text-lg mb-4" style={{ color: '#D4AF37' }}>Deployment Fees</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span style={{ color: '#A1A1AA' }}>Contract Deployment</span>
                      <span style={{ color: '#F1F1F1' }}>
                        {requiredShahAmount ? `${formatUnits(BigInt(requiredShahAmount), 18)} SHAH` : '0.05 ETH'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#A1A1AA' }}>Gas Fee (Estimated)</span>
                      <span style={{ color: '#F1F1F1' }}>~0.008 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#A1A1AA' }}>SHAH Platform Fee</span>
                      <span style={{ color: '#10B981' }}>Free</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div className="text-sm mb-2" style={{ color: '#EF4444' }}>⚠️ Important</div>
                  <div className="text-xs" style={{ color: '#A1A1AA' }}>
                    Please review all details carefully. Once deployed, token parameters cannot be changed.
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6" style={{ borderTop: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1 || createStep !== 'idle'}
                className="px-6 py-2 rounded-lg font-medium transition-all hover:opacity-80 disabled:opacity-50"
                style={{ borderWidth: '1px', borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37', background: 'transparent' }}
              >
                Back
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                  disabled={currentStep === 1 && (!formData.name || !formData.symbol)}
                  className="px-8 py-2 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}
                >
                  Continue
                </button>
              ) : (
                <>
                  {needsApproval() ? (
                    <button 
                      onClick={handleApproveShah}
                      disabled={!hasEnoughShah() || createStep !== 'idle'}
                      className="px-8 py-2 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)', color: '#FFFFFF' }}
                    >
                      {isApproving ? 'Approving...' : 'Approve SHAH'}
                    </button>
                  ) : (
                    <button 
                      onClick={handleCreateToken}
                      disabled={!isFormValid() || createStep !== 'idle'}
                      className="px-8 py-2 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}
                    >
                      {isCreating ? 'Creating...' : 'Deploy Token'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Success Message */}
          {createStep === 'success' && createdTokenAddress && (
            <div className="mt-6 p-6 rounded-2xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="text-lg mb-2" style={{ color: '#10B981' }}>🎉 Token Created Successfully!</div>
              <div className="text-sm mb-4" style={{ color: '#A1A1AA' }}>
                Token Address: <span style={{ color: '#F1F1F1' }}>{createdTokenAddress}</span>
              </div>
              <div className="flex gap-3">
                <Link 
                  href={`https://etherscan.io/address/${createdTokenAddress}`}
                  target="_blank"
                  className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}
                >
                  View on Etherscan
                </Link>
                <button
                  onClick={() => {
                    setCreateStep('idle')
                    setCreatedTokenAddress(null)
                    setCurrentStep(1)
                    setFormData({
                      name: '',
                      symbol: '',
                      decimals: 18,
                      initialSupply: '',
                      owner: address || '',
                      maxSupply: ''
                    })
                  }}
                  className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                  style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}
                >
                  Create Another
                </button>
              </div>
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="text-2xl mb-2" style={{ color: '#D4AF37' }}>5 mins</div>
              <div className="text-sm" style={{ color: '#A1A1AA' }}>Average deployment time</div>
            </div>

            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="text-2xl mb-2" style={{ color: '#D4AF37' }}>2,500+</div>
              <div className="text-sm" style={{ color: '#A1A1AA' }}>Tokens created</div>
            </div>

            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="text-2xl mb-2" style={{ color: '#10B981' }}>Audited</div>
              <div className="text-sm" style={{ color: '#A1A1AA' }}>Smart contracts</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
