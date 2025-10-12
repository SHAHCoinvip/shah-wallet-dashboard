import { useState } from 'react';
import { Home, ArrowLeftRight, Layers, ImageIcon, Settings as SettingsIcon, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import shahBlueLogo from 'figma:asset/88d7df6b7125a93f578ca49664988348e076f5d8.png';
import shahGoldLogo from 'figma:asset/36013c53d7c184a9d5a98b3ea0a168c9eebe2f39.png';

type Screen = 'login' | 'dashboard' | 'stake' | 'swap' | 'nft' | 'settings';

export function TelegramMiniApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [activeNav, setActiveNav] = useState<Screen>('dashboard');
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [telegramNotif, setTelegramNotif] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState([25]);

  const handleNavigate = (screen: Screen) => {
    setActiveNav(screen);
    setCurrentScreen(screen);
    if (screen === 'swap') {
      setShowSwapModal(true);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onConnect={() => setCurrentScreen('dashboard')} />;
      case 'dashboard':
        return <DashboardScreen onSwap={() => setShowSwapModal(true)} />;
      case 'stake':
        return <StakeScreen />;
      case 'nft':
        return <NFTScreen />;
      case 'settings':
        return (
          <SettingsScreen
            priceAlerts={priceAlerts}
            setPriceAlerts={setPriceAlerts}
            telegramNotif={telegramNotif}
            setTelegramNotif={setTelegramNotif}
            alertThreshold={alertThreshold}
            setAlertThreshold={setAlertThreshold}
          />
        );
      default:
        return <DashboardScreen onSwap={() => setShowSwapModal(true)} />;
    }
  };

  return (
    <div className="mx-auto relative" style={{ width: '375px', height: '812px', background: '#0A0A0A', overflow: 'hidden' }}>
      {/* Main Content */}
      <div className="h-full overflow-y-auto pb-20">
        {renderScreen()}
      </div>

      {/* Swap Modal */}
      {showSwapModal && currentScreen !== 'login' && (
        <SwapModal onClose={() => setShowSwapModal(false)} />
      )}

      {/* Bottom Navigation */}
      {currentScreen !== 'login' && (
        <div
          className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-around"
          style={{
            background: 'rgba(17, 17, 17, 0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(212, 175, 55, 0.1)',
          }}
        >
          <NavButton
            icon={Home}
            label="Home"
            isActive={activeNav === 'dashboard'}
            onClick={() => handleNavigate('dashboard')}
          />
          <NavButton
            icon={ArrowLeftRight}
            label="Swap"
            isActive={activeNav === 'swap' || showSwapModal}
            onClick={() => {
              setActiveNav('swap');
              setShowSwapModal(true);
            }}
          />
          <NavButton
            icon={Layers}
            label="Stake"
            isActive={activeNav === 'stake'}
            onClick={() => handleNavigate('stake')}
          />
          <NavButton
            icon={ImageIcon}
            label="NFT"
            isActive={activeNav === 'nft'}
            onClick={() => handleNavigate('nft')}
          />
          <NavButton
            icon={SettingsIcon}
            label="Settings"
            isActive={activeNav === 'settings'}
            onClick={() => handleNavigate('settings')}
          />
        </div>
      )}
    </div>
  );
}

// Login Screen
function LoginScreen({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="w-24 h-24 rounded-full flex items-center justify-center p-4 mb-6" style={{ background: 'rgba(212, 175, 55, 0.1)', boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)' }}>
        <img src={shahGoldLogo} alt="SHAH" className="w-full h-full object-contain" />
      </div>
      
      <h1 className="text-3xl mb-2" style={{ color: '#D4AF37' }}>SHAH Wallet</h1>
      <p className="mb-8 text-center" style={{ color: '#A1A1AA' }}>
        Connect your wallet to access the SHAH ecosystem
      </p>
      
      <Button
        className="w-full h-14 text-lg"
        onClick={onConnect}
        style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}
      >
        Connect Wallet
      </Button>
      
      <div className="mt-8 text-center text-xs" style={{ color: '#A1A1AA' }}>
        Powered by Telegram Mini App
      </div>
    </div>
  );
}

// Dashboard Screen
function DashboardScreen({ onSwap }: { onSwap: () => void }) {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center p-1" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
            <img src={shahGoldLogo} alt="SHAH" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl" style={{ color: '#F1F1F1' }}>Dashboard</h1>
        </div>
        <p className="text-xs" style={{ color: '#A1A1AA' }}>0x7a25...4f9c</p>
      </div>

      {/* Balance Cards */}
      <div className="space-y-3">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.2)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.1)' }}>
          <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Total Balance</div>
          <div className="text-2xl mb-2" style={{ color: '#D4AF37' }}>$49,322</div>
          <div className="text-xs flex items-center gap-1" style={{ color: '#10B981' }}>
            <TrendingUp className="w-3 h-3" />
            <span>+8.2% (24h)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>ETH</div>
            <div className="text-lg" style={{ color: '#F1F1F1' }}>2.458</div>
            <div className="text-xs" style={{ color: '#3B82F6' }}>$4,852</div>
          </div>

          <div className="p-3 rounded-xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div className="text-xs mb-1 flex items-center gap-1" style={{ color: '#A1A1AA' }}>
              <img src={shahBlueLogo} alt="SHAH" className="w-3 h-3 object-contain" />
              SHAH
            </div>
            <div className="text-lg" style={{ color: '#3B82F6' }}>12,450</div>
            <div className="text-xs" style={{ color: '#10B981' }}>+12.5%</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        <ActionIcon icon="🔄" label="Swap" onClick={onSwap} />
        <ActionIcon icon="💰" label="Stake" />
        <ActionIcon icon="🌾" label="Farm" />
        <ActionIcon icon="💳" label="Buy" />
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm mb-3" style={{ color: '#F1F1F1' }}>Recent Activity</h3>
        <div className="space-y-2">
          {[
            { type: 'Received', amount: '+0.5 ETH', time: '2m ago' },
            { type: 'Staked', amount: '1,000 SHAH', time: '1h ago' },
            { type: 'Swapped', amount: '0.2 ETH', time: '3h ago' },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(17, 17, 17, 0.5)' }}>
              <div>
                <div className="text-sm" style={{ color: '#F1F1F1' }}>{activity.type}</div>
                <div className="text-xs" style={{ color: '#A1A1AA' }}>{activity.time}</div>
              </div>
              <div className="text-sm" style={{ color: '#F1F1F1' }}>{activity.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stake Screen
function StakeScreen() {
  return (
    <div className="p-4 space-y-4">
      <div className="pt-2 pb-2">
        <h1 className="text-xl mb-1" style={{ color: '#F1F1F1' }}>Staking</h1>
        <p className="text-xs" style={{ color: '#A1A1AA' }}>Earn rewards by staking SHAH</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Staked</div>
          <div className="text-lg" style={{ color: '#F1F1F1' }}>3,400 SHAH</div>
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Rewards</div>
          <div className="text-lg" style={{ color: '#10B981' }}>284.5 SHAH</div>
        </div>
      </div>

      {/* Active Pool */}
      <div className="p-4 rounded-xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '2px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.15)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="text-2xl">👑</div>
            <div>
              <div className="text-sm" style={{ color: '#D4AF37' }}>Gold Tier</div>
              <div className="text-xs" style={{ color: '#A1A1AA' }}>Active</div>
            </div>
          </div>
          <Badge style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            48% APY
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span style={{ color: '#A1A1AA' }}>Your Stake</span>
            <span style={{ color: '#F1F1F1' }}>2,500 SHAH</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: '#A1A1AA' }}>Rewards</span>
            <span style={{ color: '#10B981' }}>124.2 SHAH</span>
          </div>
        </div>

        <Button className="w-full" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
          Claim Rewards
        </Button>
      </div>

      {/* Other Pools */}
      <div className="space-y-2">
        <h3 className="text-sm" style={{ color: '#F1F1F1' }}>Other Pools</h3>
        
        {[
          { name: 'Silver Tier', icon: '🥈', apy: '24%' },
          { name: 'Bronze Tier', icon: '🥉', apy: '12%' },
        ].map((pool, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(17, 17, 17, 0.5)' }}>
            <div className="flex items-center gap-2">
              <div className="text-xl">{pool.icon}</div>
              <div className="text-sm" style={{ color: '#F1F1F1' }}>{pool.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#10B981' }}>{pool.apy}</span>
              <ChevronRight className="w-4 h-4" style={{ color: '#A1A1AA' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// NFT Screen
function NFTScreen() {
  const nfts = [
    { name: 'Royal Shah #1', price: '250 SHAH', image: '👑' },
    { name: 'Gold Pass', price: '500 SHAH', image: '🎫' },
    { name: 'Crypto Legend', price: '180 SHAH', image: '💎' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2 pb-2">
        <h1 className="text-xl mb-1" style={{ color: '#F1F1F1' }}>NFT Drops</h1>
        <p className="text-xs" style={{ color: '#A1A1AA' }}>Swipe to explore collections</p>
      </div>

      {/* Swipeable Cards */}
      <div className="space-y-3 overflow-x-auto">
        {nfts.map((nft, i) => (
          <div
            key={i}
            className="p-4 rounded-xl"
            style={{
              background: 'rgba(17, 17, 17, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.1)',
            }}
          >
            <div className="flex gap-3 mb-3">
              <div className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                {nft.image}
              </div>
              <div className="flex-1">
                <h3 className="mb-1" style={{ color: '#F1F1F1' }}>{nft.name}</h3>
                <Badge style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  Live
                </Badge>
                <div className="text-xs mt-2" style={{ color: '#A1A1AA' }}>Mint: {nft.price}</div>
              </div>
            </div>
            <Button className="w-full" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
              Mint Now
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Settings Screen
function SettingsScreen({
  priceAlerts,
  setPriceAlerts,
  telegramNotif,
  setTelegramNotif,
  alertThreshold,
  setAlertThreshold,
}: {
  priceAlerts: boolean;
  setPriceAlerts: (v: boolean) => void;
  telegramNotif: boolean;
  setTelegramNotif: (v: boolean) => void;
  alertThreshold: number[];
  setAlertThreshold: (v: number[]) => void;
}) {
  return (
    <div className="p-4 space-y-4">
      <div className="pt-2 pb-2">
        <h1 className="text-xl mb-1" style={{ color: '#F1F1F1' }}>Settings</h1>
        <p className="text-xs" style={{ color: '#A1A1AA' }}>Manage notifications & alerts</p>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(17, 17, 17, 0.6)' }}>
          <div>
            <div className="text-sm mb-0.5" style={{ color: '#F1F1F1' }}>Telegram Notifications</div>
            <div className="text-xs" style={{ color: '#A1A1AA' }}>Get alerts via Telegram</div>
          </div>
          <Switch checked={telegramNotif} onCheckedChange={setTelegramNotif} />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(17, 17, 17, 0.6)' }}>
          <div>
            <div className="text-sm mb-0.5" style={{ color: '#F1F1F1' }}>Price Alerts</div>
            <div className="text-xs" style={{ color: '#A1A1AA' }}>Track price movements</div>
          </div>
          <Switch checked={priceAlerts} onCheckedChange={setPriceAlerts} />
        </div>
      </div>

      {/* Alert Threshold */}
      {priceAlerts && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm" style={{ color: '#F1F1F1' }}>Alert Threshold</span>
            <div className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37' }}>
              ±{alertThreshold[0]}%
            </div>
          </div>
          <Slider value={alertThreshold} onValueChange={setAlertThreshold} min={5} max={50} step={5} />
          <div className="flex justify-between text-xs mt-2" style={{ color: '#A1A1AA' }}>
            <span>5%</span>
            <span>50%</span>
          </div>
        </div>
      )}

      {/* Version */}
      <div className="text-center text-xs pt-4" style={{ color: '#A1A1AA' }}>
        SHAH Wallet v1.0.0
      </div>
    </div>
  );
}

// Swap Modal (Pull-up sheet)
function SwapModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl p-6 animate-slide-up"
        style={{
          background: 'rgba(17, 17, 17, 0.98)',
          backdropFilter: 'blur(20px)',
          maxHeight: '80%',
          borderTop: '2px solid rgba(212, 175, 55, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1 rounded-full mx-auto mb-6" style={{ background: 'rgba(212, 175, 55, 0.3)' }} />

        <h2 className="text-xl mb-4" style={{ color: '#F1F1F1' }}>Swap</h2>

        {/* From */}
        <div className="mb-2">
          <div className="text-xs mb-2" style={{ color: '#A1A1AA' }}>From</div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(10, 10, 10, 0.5)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="flex items-center justify-between">
              <input
                type="text"
                placeholder="0.0"
                className="bg-transparent border-0 outline-none text-lg flex-1"
                style={{ color: '#F1F1F1' }}
              />
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                <span className="text-sm" style={{ color: '#F1F1F1' }}>ETH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Swap Icon */}
        <div className="flex justify-center my-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
            <ArrowLeftRight className="w-4 h-4" style={{ color: '#D4AF37' }} />
          </div>
        </div>

        {/* To */}
        <div className="mb-4">
          <div className="text-xs mb-2" style={{ color: '#A1A1AA' }}>To</div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(10, 10, 10, 0.5)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="flex items-center justify-between">
              <input
                type="text"
                placeholder="0.0"
                className="bg-transparent border-0 outline-none text-lg flex-1"
                style={{ color: '#F1F1F1' }}
              />
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
                <span className="text-sm" style={{ color: '#D4AF37' }}>SHAH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 rounded-lg mb-4 space-y-1" style={{ background: 'rgba(10, 10, 10, 0.3)' }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: '#A1A1AA' }}>Rate</span>
            <span style={{ color: '#F1F1F1' }}>1 ETH = 2,845 SHAH</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: '#A1A1AA' }}>Fee</span>
            <span style={{ color: '#F1F1F1' }}>~$2.45</span>
          </div>
        </div>

        <Button className="w-full h-12" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
          Swap
        </Button>
      </div>
    </div>
  );
}

// Action Icon Component
function ActionIcon({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <button className="flex flex-col items-center gap-1" onClick={onClick}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(17, 17, 17, 0.6)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
        {icon}
      </div>
      <span className="text-xs" style={{ color: '#A1A1AA' }}>{label}</span>
    </button>
  );
}

// Nav Button Component
function NavButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="flex flex-col items-center gap-1 relative"
      onClick={onClick}
    >
      {isActive && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full"
          style={{ boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)' }}
        />
      )}
      <Icon
        className="w-5 h-5 relative z-10"
        style={{ color: isActive ? '#D4AF37' : '#A1A1AA' }}
      />
      <span
        className="text-xs"
        style={{ color: isActive ? '#D4AF37' : '#A1A1AA' }}
      >
        {label}
      </span>
    </button>
  );
}
