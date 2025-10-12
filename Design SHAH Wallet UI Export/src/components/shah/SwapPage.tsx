import { ArrowDownUp, Settings, Info, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useState } from 'react';
import shahBlueLogo from 'figma:asset/88d7df6b7125a93f578ca49664988348e076f5d8.png';

export function SwapPage() {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  return (
    <div className="min-h-screen p-8 flex items-center justify-center" style={{ background: '#0A0A0A' }}>
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>Swap</h1>
          <p style={{ color: '#A1A1AA' }}>Trade tokens instantly with the best rates</p>
        </div>

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
              <span className="text-xs" style={{ color: '#A1A1AA' }}>Balance: 2.458 ETH</span>
            </div>
            
            <div className="p-4 rounded-xl" style={{ background: 'rgba(10, 10, 10, 0.5)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="flex items-center justify-between">
                <Input
                  type="text"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="border-0 bg-transparent text-2xl p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ color: '#F1F1F1' }}
                />
                
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-80 transition-all" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <div className="w-6 h-6 rounded-full" style={{ background: '#3B82F6' }} />
                  <span style={{ color: '#F1F1F1' }}>ETH</span>
                  <ChevronDown className="w-4 h-4" style={{ color: '#A1A1AA' }} />
                </button>
              </div>
              
              <div className="mt-2 text-sm" style={{ color: '#A1A1AA' }}>
                ≈ $0.00
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center my-4">
            <button className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: 'rgba(212, 175, 55, 0.2)', border: '2px solid rgba(212, 175, 55, 0.3)' }}>
              <ArrowDownUp className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </button>
          </div>

          {/* To Token */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm" style={{ color: '#A1A1AA' }}>To</label>
              <span className="text-xs" style={{ color: '#A1A1AA' }}>Balance: 12,450 SHAH</span>
            </div>
            
            <div className="p-4 rounded-xl" style={{ background: 'rgba(10, 10, 10, 0.5)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="flex items-center justify-between">
                <Input
                  type="text"
                  placeholder="0.0"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  className="border-0 bg-transparent text-2xl p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ color: '#F1F1F1' }}
                />
                
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-80 transition-all" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <img src={shahBlueLogo} alt="SHAH" className="w-6 h-6 object-contain" />
                  <span style={{ color: '#F1F1F1' }}>SHAH</span>
                  <ChevronDown className="w-4 h-4" style={{ color: '#A1A1AA' }} />
                </button>
              </div>
              
              <div className="mt-2 text-sm" style={{ color: '#A1A1AA' }}>
                ≈ $0.00
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
              <span className="text-sm" style={{ color: '#F1F1F1' }}>1 ETH = 2,845 SHAH</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: '#A1A1AA' }}>Price Impact</span>
              <span className="text-sm" style={{ color: '#10B981' }}>{'< 0.01%'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: '#A1A1AA' }}>Network Fee</span>
              <span className="text-sm" style={{ color: '#F1F1F1' }}>~$2.45</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: '#A1A1AA' }}>Minimum Received</span>
              <span className="text-sm" style={{ color: '#F1F1F1' }}>0 SHAH</span>
            </div>
          </div>

          {/* Swap Button */}
          <Button className="w-full h-14 text-lg" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
            Swap
          </Button>
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
      </div>
    </div>
  );
}
