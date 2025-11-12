import { Home, Compass, Factory, Layers, Sprout, Rocket, Droplets, ArrowLeftRight, Settings, Network, Smartphone, X } from 'lucide-react';
import shahGoldLogo from 'figma:asset/36013c53d7c184a9d5a98b3ea0a168c9eebe2f39.png';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function Sidebar({ activePage, onNavigate, isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'discover', icon: Compass, label: 'Discover' },
    { id: 'blockchain', icon: Network, label: 'Blockchain' },
    { id: 'factory', icon: Factory, label: 'Factory' },
    { id: 'staking', icon: Layers, label: 'Staking' },
    { id: 'farming', icon: Sprout, label: 'Farming' },
    { id: 'launchpad', icon: Rocket, label: 'Launchpad' },
    { id: 'pools', icon: Droplets, label: 'Pools' },
    { id: 'swap', icon: ArrowLeftRight, label: 'Swap' },
    { id: 'telegram', icon: Smartphone, label: 'Telegram App' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#0A0A0A', borderRight: '1px solid rgba(212, 175, 55, 0.1)' }}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 lg:hidden w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(212, 175, 55, 0.1)' }}
        >
          <X className="w-5 h-5" style={{ color: '#D4AF37' }} />
        </button>

        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center p-1.5" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
              <img src={shahGoldLogo} alt="SHAH" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-xl font-semibold" style={{ color: '#F1F1F1' }}>SHAH</div>
              <div className="text-xs" style={{ color: '#A1A1AA' }}>Wallet</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative group touch-manipulation"
                style={{
                  background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                  color: isActive ? '#D4AF37' : '#A1A1AA',
                }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r" style={{ background: '#D4AF37' }} />
                )}
                <Icon className="w-5 h-5" style={{ color: isActive ? '#D4AF37' : '#A1A1AA' }} />
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="absolute inset-0 rounded-lg" style={{ boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)' }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.1)' }}>
          <div className="text-xs text-center" style={{ color: '#A1A1AA' }}>
            v1.0.0 • Powered by Web3
          </div>
        </div>
      </div>
    </>
  );
}