import { Factory, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';

export function FactoryPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { number: 1, title: 'Token Details', description: 'Basic information' },
    { number: 2, title: 'Tokenomics', description: 'Supply & fees' },
    { number: 3, title: 'Confirm', description: 'Review & deploy' },
  ];

  return (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>Token Factory</h1>
        <p style={{ color: '#A1A1AA' }}>Create your own custom token in minutes</p>
      </div>

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
                <Label htmlFor="tokenName" style={{ color: '#F1F1F1' }}>Token Name</Label>
                <Input
                  id="tokenName"
                  placeholder="e.g., My Awesome Token"
                  className="mt-2 h-12"
                  style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                />
              </div>

              <div>
                <Label htmlFor="tokenSymbol" style={{ color: '#F1F1F1' }}>Token Symbol</Label>
                <Input
                  id="tokenSymbol"
                  placeholder="e.g., MAT"
                  className="mt-2 h-12"
                  style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                />
              </div>

              <div>
                <Label htmlFor="decimals" style={{ color: '#F1F1F1' }}>Decimals</Label>
                <Input
                  id="decimals"
                  type="number"
                  defaultValue="18"
                  className="mt-2 h-12"
                  style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                />
              </div>

              <div>
                <Label htmlFor="description" style={{ color: '#F1F1F1' }}>Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your token..."
                  className="mt-2"
                  rows={4}
                  style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Tokenomics */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="totalSupply" style={{ color: '#F1F1F1' }}>Total Supply</Label>
                <Input
                  id="totalSupply"
                  placeholder="e.g., 1000000"
                  className="mt-2 h-12"
                  style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxFee" style={{ color: '#F1F1F1' }}>Transaction Fee (%)</Label>
                  <Input
                    id="taxFee"
                    type="number"
                    defaultValue="0"
                    className="mt-2 h-12"
                    style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                  />
                </div>

                <div>
                  <Label htmlFor="liquidityFee" style={{ color: '#F1F1F1' }}>Liquidity Fee (%)</Label>
                  <Input
                    id="liquidityFee"
                    type="number"
                    defaultValue="0"
                    className="mt-2 h-12"
                    style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxTransaction" style={{ color: '#F1F1F1' }}>Max Transaction Amount</Label>
                <Input
                  id="maxTransaction"
                  placeholder="Leave empty for no limit"
                  className="mt-2 h-12"
                  style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
                />
              </div>

              <div className="p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div className="text-sm mb-2" style={{ color: '#3B82F6' }}>💡 Pro Tip</div>
                <div className="text-xs" style={{ color: '#A1A1AA' }}>
                  Keep transaction fees low (0-5%) for better adoption. High fees may discourage trading.
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
                    <span style={{ color: '#F1F1F1' }}>My Awesome Token</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#A1A1AA' }}>Symbol</span>
                    <span style={{ color: '#F1F1F1' }}>MAT</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#A1A1AA' }}>Total Supply</span>
                    <span style={{ color: '#F1F1F1' }}>1,000,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#A1A1AA' }}>Decimals</span>
                    <span style={{ color: '#F1F1F1' }}>18</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#A1A1AA' }}>Transaction Fee</span>
                    <span style={{ color: '#F1F1F1' }}>0%</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <h3 className="text-lg mb-4" style={{ color: '#D4AF37' }}>Deployment Fees</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span style={{ color: '#A1A1AA' }}>Contract Deployment</span>
                    <span style={{ color: '#F1F1F1' }}>0.05 ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#A1A1AA' }}>Gas Fee (Estimated)</span>
                    <span style={{ color: '#F1F1F1' }}>~0.008 ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#A1A1AA' }}>SHAH Platform Fee</span>
                    <span style={{ color: '#10B981' }}>Free</span>
                  </div>
                  <div className="h-px" style={{ background: 'rgba(212, 175, 55, 0.2)' }} />
                  <div className="flex justify-between">
                    <span style={{ color: '#D4AF37' }}>Total</span>
                    <span style={{ color: '#D4AF37' }}>~0.058 ETH</span>
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
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}
            >
              Back
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                className="px-8"
                style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}
              >
                Continue
              </Button>
            ) : (
              <Button className="px-8" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                Deploy Token
              </Button>
            )}
          </div>
        </div>

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
    </div>
  );
}
