import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Copy, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import shahBlueLogo from 'figma:asset/88d7df6b7125a93f578ca49664988348e076f5d8.png';

const chartData = [
  { time: '00:00', price: 2.4 },
  { time: '04:00', price: 2.7 },
  { time: '08:00', price: 2.5 },
  { time: '12:00', price: 3.1 },
  { time: '16:00', price: 2.9 },
  { time: '20:00', price: 3.4 },
  { time: '24:00', price: 3.6 },
];

const recentActivity = [
  { type: 'Received', amount: '+0.5 ETH', from: '0x7a2...4f9c', time: '2 mins ago', status: 'success' },
  { type: 'Staked', amount: '1,000 SHAH', from: 'Gold Pool', time: '1 hour ago', status: 'success' },
  { type: 'Swapped', amount: '0.2 ETH → 500 SHAH', from: 'DEX', time: '3 hours ago', status: 'success' },
  { type: 'Sent', amount: '-0.1 ETH', from: '0x9b4...3a1d', time: '5 hours ago', status: 'pending' },
];

export function DashboardPage() {
  return (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>Dashboard</h1>
          <p style={{ color: '#A1A1AA' }}>Welcome back to your SHAH Wallet</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge className="px-4 py-2" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            Ethereum Mainnet
          </Badge>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: '#111111', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <Wallet className="w-4 h-4" style={{ color: '#D4AF37' }} />
            <span className="text-sm" style={{ color: '#F1F1F1' }}>0x7a25...4f9c</span>
            <button className="hover:opacity-70 transition-opacity">
              <Copy className="w-4 h-4" style={{ color: '#A1A1AA' }} />
            </button>
          </div>
          
          <Button className="px-6" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
            Connect Wallet
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* ETH Balance */}
        <div className="p-6 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>ETH Balance</div>
            <div className="text-3xl mb-1" style={{ color: '#F1F1F1' }}>2.458</div>
            <div className="text-sm flex items-center gap-1" style={{ color: '#3B82F6' }}>
              <TrendingUp className="w-4 h-4" />
              <span>$4,852.34</span>
            </div>
          </div>
        </div>

        {/* SHAH Token */}
        <div className="p-6 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(59, 130, 246, 0.2)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)' }} />
          <div className="absolute top-4 right-4 w-12 h-12 opacity-20">
            <img src={shahBlueLogo} alt="SHAH" className="w-full h-full object-contain" />
          </div>
          <div className="relative">
            <div className="text-sm mb-2 flex items-center gap-2" style={{ color: '#A1A1AA' }}>
              <img src={shahBlueLogo} alt="SHAH" className="w-5 h-5 object-contain" />
              SHAH Token
            </div>
            <div className="text-3xl mb-1" style={{ color: '#3B82F6' }}>12,450</div>
            <div className="text-sm flex items-center gap-1" style={{ color: '#10B981' }}>
              <ArrowUpRight className="w-4 h-4" />
              <span>+12.5%</span>
            </div>
          </div>
        </div>

        {/* Total Portfolio */}
        <div className="p-6 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Total Portfolio</div>
            <div className="text-3xl mb-1" style={{ color: '#F1F1F1' }}>$49,322</div>
            <div className="text-sm flex items-center gap-1" style={{ color: '#10B981' }}>
              <ArrowUpRight className="w-4 h-4" />
              <span>+8.2% (24h)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Button className="h-14" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
          Swap
        </Button>
        <Button className="h-14" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
          Stake
        </Button>
        <Button className="h-14" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
          Farm
        </Button>
        <Button className="h-14" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
          Buy Crypto
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Chart Widget */}
        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg mb-1" style={{ color: '#F1F1F1' }}>SHAH Price</h3>
              <div className="text-2xl" style={{ color: '#D4AF37' }}>$3.64</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                +18.2%
              </Badge>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
              <XAxis dataKey="time" stroke="#A1A1AA" style={{ fontSize: '12px' }} />
              <YAxis stroke="#A1A1AA" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  background: '#111111',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '8px',
                  color: '#F1F1F1',
                }}
              />
              <Line type="monotone" dataKey="price" stroke="#D4AF37" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <h3 className="text-lg mb-4" style={{ color: '#F1F1F1' }}>Recent Activity</h3>
          
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-opacity-50 transition-all" style={{ background: 'rgba(17, 17, 17, 0.5)' }}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div>
                    <div className="text-sm" style={{ color: '#F1F1F1' }}>{activity.type}</div>
                    <div className="text-xs" style={{ color: '#A1A1AA' }}>{activity.from}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm" style={{ color: '#F1F1F1' }}>{activity.amount}</div>
                  <div className="text-xs" style={{ color: '#A1A1AA' }}>{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 py-2 text-sm rounded-lg transition-all hover:opacity-80" style={{ color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
            View All Transactions
          </button>
        </div>
      </div>
    </div>
  );
}
