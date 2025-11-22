
import React, { useState } from 'react';
import { useReadContract } from 'wagmi';
import { Link } from 'react-router-dom';
import { formatUnits } from 'viem';
import { CONTRACTS, FACTORY_ABI, PAIR_ABI, ERC20_ABI } from '../constants/contracts';
import { Activity, Box, Plus, ChevronLeft, ChevronRight, Search, AlertCircle, Droplets } from 'lucide-react';

// --- Sub-component to fetch and render individual Pair data ---
const PoolRow: React.FC<{ index: number }> = ({ index }) => {
  // 1. Get Pair Address from Factory
  const { data: pairAddress, isLoading: isLoadingAddr } = useReadContract({
    address: CONTRACTS.FACTORY as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'allPairs',
    args: [BigInt(index)],
  });

  // 2. Get Token Addresses from Pair
  const { data: token0Addr } = useReadContract({
    address: pairAddress,
    abi: PAIR_ABI,
    functionName: 'token0',
    query: { enabled: !!pairAddress }
  });

  const { data: token1Addr } = useReadContract({
    address: pairAddress,
    abi: PAIR_ABI,
    functionName: 'token1',
    query: { enabled: !!pairAddress }
  });

  // 3. Get Reserves
  const { data: reserves } = useReadContract({
    address: pairAddress,
    abi: PAIR_ABI,
    functionName: 'getReserves',
    query: { enabled: !!pairAddress }
  });

  // 4. Get Symbols
  const { data: symbol0 } = useReadContract({
    address: token0Addr,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: !!token0Addr }
  });

  const { data: symbol1 } = useReadContract({
    address: token1Addr,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: !!token1Addr }
  });

  if (isLoadingAddr || !pairAddress) {
    return (
      <div className="p-4 border-b border-woosh-surface animate-pulse flex justify-between">
        <div className="h-6 w-32 bg-woosh-surface rounded"></div>
        <div className="h-6 w-24 bg-woosh-surface rounded"></div>
      </div>
    );
  }

  const r0 = reserves ? parseFloat(formatUnits(reserves[0], 18)).toFixed(2) : '0.00';
  const r1 = reserves ? parseFloat(formatUnits(reserves[1], 18)).toFixed(2) : '0.00';

  return (
    <div className="p-4 border-b border-woosh-surface hover:bg-woosh-surface/50 transition-colors flex flex-col md:flex-row justify-between items-center gap-4 group">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-woosh-surface border border-woosh-subtext/20 flex items-center justify-center text-[10px] text-white font-bold z-10">
                {symbol0?.slice(0,2)}
            </div>
            <div className="w-8 h-8 rounded-full bg-woosh-red text-white flex items-center justify-center text-[10px] font-bold z-0">
                {symbol1?.slice(0,2)}
            </div>
        </div>
        <div>
          <h4 className="font-bold text-white flex items-center gap-2">
            {symbol0} / {symbol1}
            <span className="text-[10px] bg-woosh-surface border border-woosh-subtext/20 px-2 py-0.5 rounded text-woosh-subtext font-normal">
                0.3%
            </span>
          </h4>
          <span className="text-xs text-woosh-subtext">{pairAddress.slice(0,6)}...{pairAddress.slice(-4)}</span>
        </div>
      </div>

      <div className="flex justify-between w-full md:w-auto md:gap-12">
          <div className="text-right">
              <p className="text-xs text-woosh-subtext">Liquidity</p>
              <p className="text-sm text-white font-mono">
                 {r0} {symbol0}
              </p>
              <p className="text-sm text-white font-mono">
                 {r1} {symbol1}
              </p>
          </div>
          
          <Link 
            to="/liquidity" 
            className="flex items-center px-4 py-2 bg-woosh-surface border border-woosh-surface text-white text-sm font-bold rounded-xl group-hover:bg-woosh-red group-hover:border-woosh-red transition-all"
          >
            Manage
          </Link>
      </div>
    </div>
  );
};

export const Pools: React.FC = () => {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;

  // Read total pairs length
  const { data: allPairsLength, isLoading } = useReadContract({
    address: CONTRACTS.FACTORY as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'allPairsLength',
  });

  const totalPairs = allPairsLength ? Number(allPairsLength) : 0;
  const maxPage = Math.ceil(totalPairs / PAGE_SIZE) - 1;
  
  // Calculate indices for current page
  const indices = [];
  if (totalPairs > 0) {
      for (let i = 0; i < PAGE_SIZE; i++) {
          const idx = (page * PAGE_SIZE) + i;
          if (idx < totalPairs) indices.push(idx);
      }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
             <Droplets className="text-woosh-red" /> Liquidity Pools
          </h1>
          <p className="text-woosh-subtext">Earn 0.25% fees on all trades proportional to your share of the pool.</p>
        </div>
        <Link 
          to="/liquidity"
          className="bg-woosh-red hover:bg-woosh-darkRed text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(255,45,45,0.3)] transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Create Position
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-woosh-card border border-woosh-surface p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Box size={64} className="text-white"/>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Box size={20}/></div>
            <span className="text-woosh-subtext font-medium">Total Pairs</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {isLoading ? <div className="h-8 w-16 bg-woosh-surface animate-pulse rounded"/> : totalPairs}
          </div>
        </div>
        
        <div className="bg-woosh-card border border-woosh-surface p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity size={64} className="text-white"/>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Activity size={20}/></div>
            <span className="text-woosh-subtext font-medium">24h Volume</span>
          </div>
          <div className="text-2xl font-bold text-white">$1,240.50</div>
          <span className="text-xs text-green-500">+12%</span>
        </div>

        <div className="bg-woosh-card border border-woosh-surface p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Droplets size={64} className="text-white"/>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Activity size={20}/></div>
            <span className="text-woosh-subtext font-medium">TVL</span>
          </div>
          <div className="text-2xl font-bold text-white">$45,290.00</div>
          <span className="text-xs text-green-500">+5%</span>
        </div>
      </div>

      {/* Pools Table */}
      <div className="bg-woosh-card border border-woosh-surface rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-woosh-surface flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-white text-lg">All Pools</h3>
          <div className="relative w-full sm:w-64">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-woosh-subtext" />
             <input 
                type="text" 
                placeholder="Search by token..." 
                className="w-full bg-woosh-surface border border-transparent focus:border-woosh-red/50 rounded-xl pl-9 pr-4 py-2 text-sm text-white outline-none"
             />
          </div>
        </div>

        {totalPairs === 0 && !isLoading ? (
             <div className="p-12 text-center flex flex-col items-center justify-center">
                 <div className="w-16 h-16 bg-woosh-surface rounded-full flex items-center justify-center mb-4">
                     <AlertCircle size={32} className="text-woosh-subtext" />
                 </div>
                 <h4 className="text-white font-bold mb-2">No Pools Found</h4>
                 <p className="text-woosh-subtext max-w-sm mb-6">
                    Be the first to create a liquidity pool on WOOSHDEX via the Factory contract.
                 </p>
                 <Link to="/liquidity" className="text-woosh-red font-bold hover:underline">Create a pair</Link>
             </div>
        ) : (
            <div>
                 {/* Header Row */}
                 <div className="hidden md:flex px-4 py-3 bg-woosh-surface/30 text-xs font-bold text-woosh-subtext uppercase tracking-wider">
                     <div className="w-1/2">Pair</div>
                     <div className="w-1/2 text-right pr-24">Liquidity Composition</div>
                     <div className="w-24">Action</div>
                 </div>

                 {/* Rows */}
                 <div className="divide-y divide-woosh-surface">
                     {indices.map(index => (
                         <PoolRow key={index} index={index} />
                     ))}
                 </div>
            </div>
        )}

        {/* Pagination */}
        {totalPairs > PAGE_SIZE && (
            <div className="p-4 border-t border-woosh-surface flex justify-between items-center">
                <span className="text-xs text-woosh-subtext">
                    Showing {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalPairs)} of {totalPairs}
                </span>
                <div className="flex gap-2">
                    <button 
                        disabled={page === 0}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        className="p-2 rounded-lg bg-woosh-surface hover:bg-woosh-surface/80 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        disabled={page >= maxPage}
                        onClick={() => setPage(p => Math.min(maxPage, p + 1))}
                        className="p-2 rounded-lg bg-woosh-surface hover:bg-woosh-surface/80 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
