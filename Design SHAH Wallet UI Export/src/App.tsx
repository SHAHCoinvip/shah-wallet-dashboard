import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/shah/Sidebar';
import { DashboardPage } from './components/shah/DashboardPage';
import { DiscoverPage } from './components/shah/DiscoverPage';
import { BlockchainPage } from './components/shah/BlockchainPage';
import { FactoryPage } from './components/shah/FactoryPage';
import { StakingPage } from './components/shah/StakingPage';
import { LaunchpadPage } from './components/shah/LaunchpadPage';
import { PoolsPage } from './components/shah/PoolsPage';
import { SwapPage } from './components/shah/SwapPage';
import { SettingsPage } from './components/shah/SettingsPage';
import { TelegramMiniApp } from './components/shah/TelegramMiniApp';
import { StyleGuidePage } from './components/shah/StyleGuidePage';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'discover':
        return <DiscoverPage />;
      case 'blockchain':
        return <BlockchainPage />;
      case 'factory':
        return <FactoryPage />;
      case 'staking':
      case 'farming':
        return <StakingPage />;
      case 'launchpad':
        return <LaunchpadPage />;
      case 'pools':
        return <PoolsPage />;
      case 'swap':
        return <SwapPage />;
      case 'telegram':
        return (
          <div className="flex items-center justify-center min-h-screen" style={{ background: '#0A0A0A' }}>
            <TelegramMiniApp />
          </div>
        );
      case 'settings':
        return <SettingsPage />;
      case 'styleguide':
        return <StyleGuidePage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#0A0A0A' }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: '#111111', border: '1px solid rgba(212, 175, 55, 0.1)' }}
      >
        <Menu className="w-5 h-5" style={{ color: '#D4AF37' }} />
      </button>

      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <div className="flex-1 lg:ml-64">
        {renderPage()}
      </div>

      {/* Style Guide Access (hidden button in bottom right) */}
      <button
        onClick={() => setActivePage('styleguide')}
        className="fixed bottom-8 right-4 lg:right-8 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-30"
        style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)' }}
        title="Style Guide"
      >
        <span className="text-black text-lg lg:text-xl">◎</span>
      </button>
    </div>
  );
}