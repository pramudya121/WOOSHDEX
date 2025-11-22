import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiProvider, createConfig, http, useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arcTestnet } from './constants/contracts';
import { Layout } from './components/Layout';
import { Swap } from './pages/Swap';
import { Pools } from './pages/Pools';
import { Liquidity } from './pages/Liquidity';
import { Analytics } from './pages/Analytics';

// --- Wagmi Config ---
const config = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
  connectors: [
    injected(), // Support for Metamask, Bitget, OKX via window.ethereum
  ],
});

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/swap" replace />} />
              <Route path="swap" element={<Swap />} />
              <Route path="pools" element={<Pools />} />
              <Route path="liquidity" element={<Liquidity />} />
              <Route path="analytics" element={<Analytics />} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/swap" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;