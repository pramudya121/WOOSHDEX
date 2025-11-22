import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { arcTestnet } from '../constants/contracts';
import { Menu, X, Wallet, Activity, Layers, ArrowLeftRight, AlertCircle, Circle } from 'lucide-react';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Swap', path: '/swap', icon: ArrowLeftRight },
    { name: 'Pools', path: '/pools', icon: Layers },
    { name: 'Analytics', path: '/analytics', icon: Activity },
  ];

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const isWrongNetwork = isConnected && chainId !== arcTestnet.id;

  // Helper for network status visual
  const NetworkStatusIndicator = () => {
    if (!isConnected) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-woosh-surface border border-woosh-surface text-xs font-medium text-woosh-subtext transition-colors">
          <div className="w-2 h-2 rounded-full bg-gray-600" />
          <span>Disconnected</span>
        </div>
      );
    }
    
    if (isWrongNetwork) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/30 border border-amber-500/50 text-xs font-medium text-amber-500 transition-colors">
          <AlertCircle size={12} className="text-amber-500 animate-pulse" />
          <span>Wrong Network</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-950/30 border border-green-500/30 text-xs font-medium text-green-400 transition-colors shadow-[0_0_10px_rgba(74,222,128,0.1)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span>Arc Testnet</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col text-woosh-text">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-woosh-bg/80 border-b border-woosh-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-woosh-red rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,45,45,0.5)]">
                <span className="font-bold text-white text-lg">W</span>
              </div>
              <span className="font-bold text-xl tracking-wider">WOOSHDEX</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-woosh-red/10 text-woosh-red shadow-[0_0_10px_rgba(255,45,45,0.1)] border border-woosh-red/20'
                          : 'hover:bg-woosh-surface text-woosh-subtext hover:text-white'
                      }`}
                    >
                      <Icon size={16} className="mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Wallet Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Network Status */}
              <NetworkStatusIndicator />

              {isWrongNetwork ? (
                 <button
                 onClick={() => switchChain({ chainId: arcTestnet.id })}
                 className="flex items-center px-4 py-2 bg-amber-500/10 border border-amber-500/50 text-amber-500 rounded-xl font-medium hover:bg-amber-500/20 transition-all"
               >
                 <AlertCircle size={18} className="mr-2" />
                 Switch Network
               </button>
              ) : null}

              {isConnected ? (
                <button
                  onClick={() => disconnect()}
                  className="flex items-center px-4 py-2 bg-woosh-surface border border-woosh-surface hover:border-woosh-red/30 rounded-xl text-sm font-medium transition-all group"
                >
                  <Wallet size={18} className="mr-2 text-woosh-red group-hover:text-white transition-colors" />
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="flex items-center px-6 py-2 bg-woosh-red hover:bg-woosh-darkRed text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(255,45,45,0.3)] hover:shadow-[0_0_25px_rgba(255,45,45,0.5)]"
                >
                  Connect Wallet
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-3">
              <NetworkStatusIndicator />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-woosh-subtext hover:text-white focus:outline-none"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-woosh-bg border-b border-woosh-surface">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-woosh-subtext hover:text-white hover:bg-woosh-surface"
                >
                  {item.name}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-woosh-surface">
                 {isConnected ? (
                    <button onClick={() => disconnect()} className="w-full text-left px-3 py-2 text-woosh-red">
                        Disconnect {address?.slice(0,6)}...
                    </button>
                 ) : (
                    <button onClick={handleConnect} className="w-full text-left px-3 py-2 text-woosh-red font-bold">
                        Connect Wallet
                    </button>
                 )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-woosh-surface/30 py-6 mt-12 bg-woosh-bg/50 backdrop-blur-sm">
        <div className="text-center text-woosh-subtext text-sm">
          <p>© 2025 WOOSHDEX. Built on Arc Testnet.</p>
        </div>
      </footer>
    </div>
  );
};