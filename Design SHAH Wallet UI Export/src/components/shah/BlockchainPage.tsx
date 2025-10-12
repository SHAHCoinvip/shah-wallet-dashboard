import { Download, ExternalLink, BookOpen, Zap, Shield, TrendingUp, Network, Cpu, Clock, Coins } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useEffect, useState } from 'react';
import shahGoldLogo from 'figma:asset/36013c53d7c184a9d5a98b3ea0a168c9eebe2f39.png';

// Animated network nodes
interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function BlockchainPage() {
  const [nodes, setNodes] = useState<Node[]>([]);

  useEffect(() => {
    // Create random network nodes
    const newNodes: Node[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
    }));
    setNodes(newNodes);

    // Animate nodes
    const interval = setInterval(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          x: (node.x + node.vx + 100) % 100,
          y: (node.y + node.vy + 100) % 100,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A' }}>
      {/* Hero Section with Animated Background */}
      <div className="relative overflow-hidden" style={{ minHeight: '600px' }}>
        {/* Animated Network Background */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" style={{ position: 'absolute' }}>
            {nodes.map((node) =>
              nodes.map((target) => {
                if (node.id >= target.id) return null;
                const dx = target.x - node.x;
                const dy = target.y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 30) return null;
                return (
                  <line
                    key={`${node.id}-${target.id}`}
                    x1={`${node.x}%`}
                    y1={`${node.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke="#D4AF37"
                    strokeWidth="1"
                    opacity={1 - distance / 30}
                  />
                );
              })
            )}
            {nodes.map((node) => (
              <circle
                key={node.id}
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r="3"
                fill="#D4AF37"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.6))',
                }}
              />
            ))}
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 p-16 text-center">
          <div className="flex justify-center mb-8">
            <img src={shahGoldLogo} alt="Shahcoin" className="w-32 h-32 object-contain" style={{ filter: 'drop-shadow(0 0 30px rgba(212, 175, 55, 0.4))' }} />
          </div>

          <Badge className="mb-6" style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <Network className="w-3 h-3 mr-1" />
            Blockchain Network
          </Badge>

          <h1 className="text-6xl mb-4" style={{ color: '#D4AF37', textShadow: '0 0 30px rgba(212, 175, 55, 0.3)' }}>
            SHAHCOIN CORE
          </h1>
          <h2 className="text-3xl mb-6" style={{ color: '#F1F1F1' }}>
            The People's Chain
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto" style={{ color: '#A1A1AA' }}>
            A decentralized, secure, and lightning-fast blockchain built for the future of finance.
            Join thousands of nodes powering the SHAH ecosystem.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Button className="h-14 px-8 text-lg" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
              <Download className="w-5 h-5 mr-2" />
              Download Wallet
            </Button>
            <Button variant="outline" className="h-14 px-8 text-lg" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}>
              <ExternalLink className="w-5 h-5 mr-2" />
              View Explorer
            </Button>
            <Button variant="outline" className="h-14 px-8 text-lg" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}>
              <BookOpen className="w-5 h-5 mr-2" />
              Read Docs
            </Button>
          </div>

          {/* Chain Stats Grid */}
          <div className="max-w-5xl mx-auto grid grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                  <Clock className="w-6 h-6" style={{ color: '#3B82F6' }} />
                </div>
              </div>
              <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Block Time</div>
              <div className="text-2xl" style={{ color: '#F1F1F1' }}>2.5 min</div>
            </div>

            <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
                  <Coins className="w-6 h-6" style={{ color: '#D4AF37' }} />
                </div>
              </div>
              <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Total Supply</div>
              <div className="text-2xl" style={{ color: '#F1F1F1' }}>63M SHAH</div>
            </div>

            <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                  <Cpu className="w-6 h-6" style={{ color: '#10B981' }} />
                </div>
              </div>
              <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Algorithms</div>
              <div className="text-sm" style={{ color: '#F1F1F1' }}>SHA256D + Scrypt + Groestl</div>
            </div>

            <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
                  <TrendingUp className="w-6 h-6" style={{ color: '#D4AF37' }} />
                </div>
              </div>
              <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Halving Schedule</div>
              <div className="text-2xl" style={{ color: '#F1F1F1' }}>Every 4 years</div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Section */}
      <div className="p-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl text-center mb-12" style={{ color: '#F1F1F1' }}>Download Shahcoin Wallet</h2>
          
          <div className="grid grid-cols-3 gap-6 mb-16">
            <div className="p-8 rounded-2xl text-center hover:scale-105 transition-all" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="text-6xl mb-4">🪟</div>
              <h3 className="text-xl mb-4" style={{ color: '#F1F1F1' }}>Windows</h3>
              <Button className="w-full" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <div className="text-xs mt-2" style={{ color: '#A1A1AA' }}>v2.5.0 • 45MB</div>
            </div>

            <div className="p-8 rounded-2xl text-center hover:scale-105 transition-all" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="text-6xl mb-4">🍎</div>
              <h3 className="text-xl mb-4" style={{ color: '#F1F1F1' }}>macOS</h3>
              <Button className="w-full" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <div className="text-xs mt-2" style={{ color: '#A1A1AA' }}>v2.5.0 • 52MB</div>
            </div>

            <div className="p-8 rounded-2xl text-center hover:scale-105 transition-all" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="text-6xl mb-4">🐧</div>
              <h3 className="text-xl mb-4" style={{ color: '#F1F1F1' }}>Linux</h3>
              <Button className="w-full" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <div className="text-xs mt-2" style={{ color: '#A1A1AA' }}>v2.5.0 • 48MB</div>
            </div>
          </div>

          {/* Explorer & Docs */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                  <ExternalLink className="w-6 h-6" style={{ color: '#3B82F6' }} />
                </div>
                <div>
                  <h3 className="text-xl mb-1" style={{ color: '#F1F1F1' }}>ShahScan Explorer</h3>
                  <p className="text-sm" style={{ color: '#A1A1AA' }}>View transactions, blocks & addresses</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" style={{ borderColor: 'rgba(59, 130, 246, 0.3)', color: '#3B82F6' }}>
                Launch Explorer
              </Button>
            </div>

            <div className="p-8 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
                  <BookOpen className="w-6 h-6" style={{ color: '#D4AF37' }} />
                </div>
                <div>
                  <h3 className="text-xl mb-1" style={{ color: '#F1F1F1' }}>Developer Docs & SDK</h3>
                  <p className="text-sm" style={{ color: '#A1A1AA' }}>Build on Shahcoin blockchain</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}>
                Read Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="p-16" style={{ background: 'rgba(17, 17, 17, 0.3)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl text-center mb-12" style={{ color: '#F1F1F1' }}>Network Features</h2>
          
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59, 130, 246, 0.2)', boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)' }}>
                <Zap className="w-10 h-10" style={{ color: '#3B82F6' }} />
              </div>
              <h3 className="text-xl mb-3" style={{ color: '#F1F1F1' }}>Fast Blocks</h3>
              <p style={{ color: '#A1A1AA' }}>
                2.5-minute block time ensures quick confirmations for your transactions without compromising security.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(212, 175, 55, 0.2)', boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)' }}>
                <Shield className="w-10 h-10" style={{ color: '#D4AF37' }} />
              </div>
              <h3 className="text-xl mb-3" style={{ color: '#F1F1F1' }}>Secure Mining</h3>
              <p style={{ color: '#A1A1AA' }}>
                Multi-algorithm mining (SHA256D, Scrypt, Groestl) provides enhanced network security and decentralization.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(16, 185, 129, 0.2)', boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)' }}>
                <TrendingUp className="w-10 h-10" style={{ color: '#10B981' }} />
              </div>
              <h3 className="text-xl mb-3" style={{ color: '#F1F1F1' }}>PoS Roadmap</h3>
              <p style={{ color: '#A1A1AA' }}>
                Transitioning to Proof of Stake for energy efficiency while maintaining the highest security standards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.3) 0%, transparent 70%)' }} />
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl mb-6" style={{ color: '#D4AF37' }}>Join the Shahcoin Network</h2>
          <p className="text-xl mb-8" style={{ color: '#A1A1AA' }}>
            Be part of a growing global community building the future of decentralized finance.
            Start mining, staking, or building today.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button className="h-14 px-8 text-lg" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
              Get Started
            </Button>
            <Button variant="outline" className="h-14 px-8 text-lg" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}>
              Join Community
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
