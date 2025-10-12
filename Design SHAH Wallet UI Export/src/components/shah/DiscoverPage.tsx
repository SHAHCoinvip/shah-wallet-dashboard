import { TrendingUp, Star, Flame, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import shahBlueLogo from 'figma:asset/88d7df6b7125a93f578ca49664988348e076f5d8.png';

const trendingTokens = [
  { name: 'SHAH Token', symbol: 'SHAH', price: '$3.64', change: '+18.2%', volume: '$12.4M', marketCap: '$84.2M', trending: true },
  { name: 'Ethereum', symbol: 'ETH', price: '$1,975.32', change: '+2.4%', volume: '$8.2B', marketCap: '$237B', trending: false },
  { name: 'Bitcoin', symbol: 'BTC', price: '$27,450.00', change: '+1.8%', volume: '$22.1B', marketCap: '$532B', trending: false },
  { name: 'Polygon', symbol: 'MATIC', price: '$0.82', change: '+12.5%', volume: '$420M', marketCap: '$7.6B', trending: true },
  { name: 'Chainlink', symbol: 'LINK', price: '$7.24', change: '-3.2%', volume: '$380M', marketCap: '$4.1B', trending: false },
  { name: 'Uniswap', symbol: 'UNI', price: '$6.15', change: '+8.7%', volume: '$145M', marketCap: '$4.6B', trending: true },
];

const newTokens = [
  { name: 'Nova Protocol', symbol: 'NOVA', price: '$0.24', change: '+124%', age: '2 days', liquidity: '$250K' },
  { name: 'Quantum Finance', symbol: 'QFI', price: '$1.82', change: '+85%', age: '5 days', liquidity: '$180K' },
  { name: 'Stellar Vault', symbol: 'SVLT', price: '$0.08', change: '+42%', age: '1 week', liquidity: '$95K' },
];

export function DiscoverPage() {
  return (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>Discover</h1>
        <p style={{ color: '#A1A1AA' }}>Explore trending tokens and new opportunities</p>
      </div>

      {/* Featured Banner */}
      <div className="mb-8 p-8 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.2)', boxShadow: '0 0 40px rgba(212, 175, 55, 0.15)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)' }} />
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex justify-center mb-6">
              <img src={shahBlueLogo} alt="SHAH" className="w-20 h-20 object-contain" style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))' }} />
            </div>
            <Badge className="mb-3" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <Star className="w-3 h-3 mr-1" />
              Featured Token
            </Badge>
            <h2 className="text-3xl mb-2" style={{ color: '#3B82F6' }}>SHAH Token</h2>
            <p className="mb-4" style={{ color: '#A1A1AA' }}>
              The native governance and utility token of the SHAH ecosystem
            </p>
            <div className="flex gap-6 mb-6">
              <div>
                <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>Price</div>
                <div className="text-2xl" style={{ color: '#F1F1F1' }}>$3.64</div>
              </div>
              <div>
                <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>24h Change</div>
                <div className="text-2xl" style={{ color: '#10B981' }}>+18.2%</div>
              </div>
              <div>
                <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>Market Cap</div>
                <div className="text-2xl" style={{ color: '#F1F1F1' }}>$84.2M</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                Buy SHAH
              </Button>
              <Button variant="outline" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}>
                View Chart
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="mb-6" style={{ background: '#111111', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <TabsTrigger value="trending" style={{ color: '#A1A1AA' }}>
            <Flame className="w-4 h-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="new" style={{ color: '#A1A1AA' }}>
            <Clock className="w-4 h-4 mr-2" />
            New Tokens
          </TabsTrigger>
          <TabsTrigger value="gainers" style={{ color: '#A1A1AA' }}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Top Gainers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending">
          <div className="space-y-3">
            {trendingTokens.map((token, index) => (
              <div
                key={index}
                className="p-5 rounded-xl hover:scale-[1.01] transition-all"
                style={{
                  background: 'rgba(17, 17, 17, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(212, 175, 55, 0.1)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-lg" style={{ color: '#A1A1AA' }}>#{index + 1}</div>
                    
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: token.trending ? 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)' : 'rgba(59, 130, 246, 0.2)' }}>
                      <span style={{ color: token.trending ? '#0A0A0A' : '#3B82F6' }}>{token.symbol.substring(0, 1)}</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#F1F1F1' }}>{token.name}</span>
                        {token.trending && (
                          <Badge style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <Flame className="w-3 h-3 mr-1" />
                            Hot
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm" style={{ color: '#A1A1AA' }}>{token.symbol}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Price</div>
                      <div style={{ color: '#F1F1F1' }}>{token.price}</div>
                    </div>

                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>24h Change</div>
                      <div style={{ color: token.change.startsWith('+') ? '#10B981' : '#EF4444' }}>{token.change}</div>
                    </div>

                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Volume</div>
                      <div style={{ color: '#F1F1F1' }}>{token.volume}</div>
                    </div>

                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Market Cap</div>
                      <div style={{ color: '#F1F1F1' }}>{token.marketCap}</div>
                    </div>

                    <Button size="sm" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                      Trade
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="new">
          <div className="grid grid-cols-3 gap-6">
            {newTokens.map((token, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl"
                style={{
                  background: 'rgba(17, 17, 17, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(212, 175, 55, 0.1)',
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                    <span style={{ color: '#3B82F6' }}>{token.symbol.substring(0, 1)}</span>
                  </div>
                  <Badge style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    New
                  </Badge>
                </div>

                <h3 className="text-lg mb-1" style={{ color: '#F1F1F1' }}>{token.name}</h3>
                <div className="text-sm mb-4" style={{ color: '#A1A1AA' }}>{token.symbol}</div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Price</div>
                    <div style={{ color: '#F1F1F1' }}>{token.price}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>24h</div>
                    <div style={{ color: '#10B981' }}>{token.change}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Age</div>
                    <div className="text-sm" style={{ color: '#F1F1F1' }}>{token.age}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Liquidity</div>
                    <div className="text-sm" style={{ color: '#F1F1F1' }}>{token.liquidity}</div>
                  </div>
                </div>

                <Button className="w-full" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gainers">
          <div className="space-y-3">
            {trendingTokens
              .filter(t => t.change.startsWith('+'))
              .sort((a, b) => parseFloat(b.change) - parseFloat(a.change))
              .map((token, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl hover:scale-[1.01] transition-all"
                  style={{
                    background: 'rgba(17, 17, 17, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-lg" style={{ color: '#10B981' }}>#{index + 1}</div>
                      
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                        <span style={{ color: '#10B981' }}>{token.symbol.substring(0, 1)}</span>
                      </div>
                      
                      <div>
                        <div style={{ color: '#F1F1F1' }}>{token.name}</div>
                        <div className="text-sm" style={{ color: '#A1A1AA' }}>{token.symbol}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div>
                        <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Price</div>
                        <div style={{ color: '#F1F1F1' }}>{token.price}</div>
                      </div>

                      <div>
                        <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>24h Gain</div>
                        <div className="text-lg" style={{ color: '#10B981' }}>{token.change}</div>
                      </div>

                      <Button size="sm" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                        Trade
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
