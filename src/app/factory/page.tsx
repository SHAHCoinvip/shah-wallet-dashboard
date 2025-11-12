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
  PRICING,
} from '@/lib/factory'
import { SHAHFactoryABI } from '@/abi/SHAHFactory'
import { SHAHPriceOracleABI } from '@/abi/SHAHPriceOracle'
import { ERC20ABI } from '@/abi/ERC20'

export const dynamic = 'force-dynamic'

type PaymentMethod = 'shah' | 'card'
type CreateStep = 'idle' | 'approving' | 'creating' | 'success'

const steps = [
  { number: 1, title: 'Token Details', description: 'Basic information' },
  { number: 2, title: 'Tokenomics', description: 'Supply & features' },
  { number: 3, title: 'Confirm', description: 'Review & deploy' },
]

export default function FactoryPage() {
  const { address, isConnected } = useAccount()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 18,
    initialSupply: '',
    owner: address || '',
    maxSupply: '',
  })

  const [features, setFeatures] = useState<TokenFeatures>({
    basic: true,
    burnable: false,
    pausable: false,
    capped: false,
    ownable: true,
    upgradeable: false,
  })

  const [paymentMethod] = useState<PaymentMethod>('shah')
  const [createStep, setCreateStep] = useState<CreateStep>('idle')
  const [createdTokenAddress, setCreatedTokenAddress] = useState<`0x${string}` | null>(null)
  const [requiredShahAmount, setRequiredShahAmount] = useState<string>('0')

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
    query: { enabled: !!address },
  })

  const { data: shahAllowance } = useReadContract({
    address: CONTRACTS.SHAH_TOKEN,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [address!, CONTRACTS.SHAH_FACTORY],
    query: { enabled: !!address },
  })

  const { writeContract: approveShah, data: approveHash } = useWriteContract()
  const { writeContract: createToken, data: createHash } = useWriteContract()

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
    },
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
    },
  })

  useEffect(() => {
    if (address && !formData.owner) {
      setFormData((prev) => ({ ...prev, owner: address }))
    }
  }, [address, formData.owner])

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
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFeatureChange = (feature: keyof TokenFeatures, checked: boolean) => {
    setFeatures((prev) => ({ ...prev, [feature]: checked }))
  }

  const isFormValid = () => {
    const errors = validateTokenParams({
      ...formData,
      owner: formData.owner as `0x${string}`,
      features: getFeatureBitmap(features),
      maxSupply: features.capped ? formData.maxSupply : '0',
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
        args: [CONTRACTS.SHAH_FACTORY, BigInt(requiredShahAmount)],
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
        maxSupply: features.capped ? parseUnits(formData.maxSupply, formData.decimals).toString() : '0',
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
          BigInt(tokenArgs.maxSupply),
        ],
      })
    } catch (error) {
      console.error('Create token error:', error)
      setCreateStep('idle')
      toast.error('❌ Failed to create token')
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Token Factory</h1>
          <p className="page-subtitle">Craft custom ERC-20 tokens with premium tooling</p>
        </div>
        <div className="hidden md:block">
          <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
        </div>
      </div>

      {!isConnected ? (
        <section className="card card-glass text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.18)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <Factory className="w-8 h-8" color="var(--gold)" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Connect Your Wallet</h2>
          <p className="page-subtitle" style={{ marginBottom: '1.75rem' }}>
            Connect your wallet to create and deploy SHAH-powered tokens
          </p>
          <ConnectButton />
        </section>
      ) : (
        <div className="space-y-8">
          <section className="card card-glass">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              {steps.map((step, index) => {
                const isActive = currentStep === step.number
                const isComplete = currentStep > step.number

                return (
                  <div key={step.number} className="flex items-center gap-4">
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: '3rem',
                        height: '3rem',
                        background: isActive || isComplete ? 'var(--gold-gradient)' : 'rgba(255,255,255,0.05)',
                        color: isActive ? '#0A0A0A' : 'var(--text-secondary)',
                        border: isComplete ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {isComplete ? <CheckCircle2 className="w-6 h-6" /> : step.number}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: isActive || isComplete ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {step.title}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {step.description}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className="hidden md:block"
                        style={{
                          height: '1px',
                          width: '3rem',
                          background: isComplete ? 'rgba(212, 175, 55, 0.6)' : 'rgba(255,255,255,0.08)',
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="card card-glass space-y-6">
            {currentStep === 1 && (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="col-span-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Token Name
                  </label>
                  <input
                    className="input-dark mt-2"
                    placeholder="e.g. Royal Gold Token"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Symbol
                  </label>
                  <input
                    className="input-dark mt-2"
                    placeholder="RGT"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Decimals
                  </label>
                  <input
                    className="input-dark mt-2"
                    type="number"
                    value={formData.decimals}
                    onChange={(e) => handleInputChange('decimals', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Initial Supply
                    </label>
                    <input
                      className="input-dark mt-2"
                      placeholder="e.g. 1,000,000"
                      value={formData.initialSupply}
                      onChange={(e) => handleInputChange('initialSupply', e.target.value)}
                    />
                  </div>

                  {features.capped && (
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Max Supply
                      </label>
                      <input
                        className="input-dark mt-2"
                        placeholder="Leave blank for uncapped"
                        value={formData.maxSupply}
                        onChange={(e) => handleInputChange('maxSupply', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(features)
                    .filter(([key]) => key !== 'basic' && key !== 'ownable')
                    .map(([key, value]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm capitalize transition"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleFeatureChange(key as keyof TokenFeatures, e.target.checked)}
                          className="h-5 w-5 rounded border border-[rgba(255,255,255,0.12)]"
                        />
                        {key}
                      </label>
                    ))}
                </div>

                <div className="rounded-xl border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.12)] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--accent-blue)' }}>
                    <Info className="h-4 w-4" />
                    Feature guidance
                  </div>
                  <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Combine advanced features like pausable or upgradeable contracts for enterprise-grade deployments. Some features require additional configuration.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#101010] p-5">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Token Summary
                  </h3>
                  <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex justify-between"><span>Name</span><span>{formData.name}</span></div>
                    <div className="flex justify-between"><span>Symbol</span><span>{formData.symbol}</span></div>
                    <div className="flex justify-between"><span>Initial Supply</span><span>{formData.initialSupply}</span></div>
                    <div className="flex justify-between"><span>Decimals</span><span>{formData.decimals}</span></div>
                  </div>
                </div>

                <div className="rounded-xl border border-[rgba(212,175,55,0.25)] bg-[rgba(212,175,55,0.12)] p-5">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold)' }}>
                    Deployment Fees
                  </h3>
                  <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex justify-between">
                      <span>Contract Deployment</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {requiredShahAmount ? `${formatUnits(BigInt(requiredShahAmount), 18)} SHAH` : 'Calculating...'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas Fee (estimate)</span>
                      <span style={{ color: 'var(--text-primary)' }}>~0.008 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee</span>
                      <span style={{ color: 'var(--success-green)' }}>Included</span>
                    </div>
                  </div>
                  <p className="mt-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Review carefully before deployment. Token parameters cannot be changed after launch.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)] md:flex-row md:items-center md:justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1 || createStep !== 'idle'}
                className="btn-outline"
                style={{ opacity: currentStep === 1 || createStep !== 'idle' ? 0.5 : 1 }}
              >
                Back
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                  disabled={currentStep === 1 && (!formData.name || !formData.symbol)}
                  className="btn-gold"
                  style={{ opacity: currentStep === 1 && (!formData.name || !formData.symbol) ? 0.5 : 1 }}
                >
                  Continue
                </button>
              ) : needsApproval() ? (
                <button
                  onClick={handleApproveShah}
                  disabled={!hasEnoughShah() || createStep !== 'idle'}
                  className="btn-secondary"
                  style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#DDE9FF', opacity: !hasEnoughShah() || createStep !== 'idle' ? 0.6 : 1 }}
                >
                  {isApproving ? 'Approving...' : 'Approve SHAH'}
                </button>
              ) : (
                <button
                  onClick={handleCreateToken}
                  disabled={!isFormValid() || createStep !== 'idle'}
                  className="btn-gold"
                  style={{ opacity: !isFormValid() || createStep !== 'idle' ? 0.5 : 1 }}
                >
                  {isCreating ? 'Creating...' : 'Deploy Token'}
                </button>
              )}
            </div>
          </section>

          {createStep === 'success' && createdTokenAddress && (
            <section className="card card-glass">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--success-green)' }}>
                    🎉 Token Created Successfully!
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Token Address: <span style={{ color: 'var(--text-primary)' }}>{createdTokenAddress}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`https://etherscan.io/address/${createdTokenAddress}`}
                    target="_blank"
                    className="btn-gold"
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
                        maxSupply: '',
                      })
                    }}
                    className="btn-outline"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-3">
            <div className="card card-glass text-center">
              <div className="text-2xl font-semibold" style={{ color: 'var(--gold)' }}>5 mins</div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Average deployment time</p>
            </div>
            <div className="card card-glass text-center">
              <div className="text-2xl font-semibold" style={{ color: 'var(--gold)' }}>2,500+</div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tokens created with SHAH</p>
            </div>
            <div className="card card-glass text-center">
              <div className="text-2xl font-semibold" style={{ color: 'var(--success-green)' }}>Audited</div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Secure & reviewed contracts</p>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

