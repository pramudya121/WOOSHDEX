import React, { useState, useMemo, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { formatUnits, parseUnits, maxUint256 } from 'viem';
import { ArrowLeft, Plus, Minus, Settings, Info, Wallet, ChevronDown, RefreshCw, AlertCircle, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONTRACTS, ROUTER_ABI, FACTORY_ABI, PAIR_ABI, ERC20_ABI, arcTestnet } from '../constants/contracts';
import { TokenSelector, Token, TokenLogo } from '../components/TokenSelector';

// Reusing the default token list from Swap for now
const DEFAULT_TOKENS: Token[] = [
  { 
    symbol: 'USDC', 
    name: 'USD Coin (Native)', 
    address: 'NATIVE', 
    decimals: 18, 
    isTrusted: true,
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
  },
  { 
    symbol: 'USDC', 
    name: 'USD Coin', 
    address: '0x3600000000000000000000000000000000000000', 
    decimals: 18, 
    isTrusted: true,
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
  },
  { 
    symbol: 'EURC', 
    name: 'Euro Coin', 
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a', 
    decimals: 18, 
    isTrusted: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/26037/large/eurc.png'
  },
  { 
    symbol: 'USYC', 
    name: 'US Yield Coin', 
    address: '0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C', 
    decimals: 18, 
    isTrusted: true 
  },
  { 
    symbol: 'SYN', 
    name: 'Synthra', 
    address: '0xC5124C846c6e6307986988dFb7e743327aA05F19', 
    decimals: 18,
    isTrusted: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/18262/large/syn.png'
  },
  { 
    symbol: 'WUSDC', 
    name: 'Wrapped USDC', 
    address: '0x911b4000D3422F482F4062a913885f7b035382Df', 
    decimals: 18, 
    isTrusted: true,
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
  },
];

export const Liquidity: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  
  // Token State
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  
  // Add Mode State
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  
  // Remove Mode State
  const [removePercent, setRemovePercent] = useState(50); // 0-100
  
  // Modals
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState<'A' | 'B'>('A');

  // Contract Write
  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Reset inputs on success
  useEffect(() => {
    if (isSuccess) {
      setAmountA('');
      setAmountB('');
      setRemovePercent(50);
    }
  }, [isSuccess]);

  // --- 1. Get Pair Address ---
  const tokenAAddr = tokenA?.address === 'NATIVE' ? undefined : tokenA?.address;
  const tokenBAddr = tokenB?.address === 'NATIVE' ? undefined : tokenB?.address;

  const { data: pairAddress, refetch: refetchPair } = useReadContract({
    address: CONTRACTS.FACTORY as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: [tokenAAddr as `0x${string}`, tokenBAddr as `0x${string}`],
    query: { enabled: !!tokenAAddr && !!tokenBAddr && tokenAAddr !== tokenBAddr }
  });

  // --- 2. Get Reserves & Total Supply ---
  const hasPair = pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000';

  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: hasPair ? pairAddress : undefined,
    abi: PAIR_ABI,
    functionName: 'getReserves',
    query: { enabled: !!hasPair, refetchInterval: 5000 }
  });

  const { data: totalSupply } = useReadContract({
    address: hasPair ? pairAddress : undefined,
    abi: PAIR_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!hasPair }
  });

  const { data: token0 } = useReadContract({
    address: hasPair ? pairAddress : undefined,
    abi: PAIR_ABI,
    functionName: 'token0',
    query: { enabled: !!hasPair }
  });

  // --- 3. User LP Balance ---
  const { data: userLpBalance, refetch: refetchLpBalance } = useReadContract({
    address: hasPair ? pairAddress : undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!hasPair && !!address }
  });

  // --- 4. Approvals ---
  const { data: allowanceA, refetch: refetchAllowanceA } = useReadContract({
    address: tokenAAddr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, CONTRACTS.ROUTER as `0x${string}`],
    query: { enabled: !!address && !!tokenAAddr }
  });

  const { data: allowanceB, refetch: refetchAllowanceB } = useReadContract({
    address: tokenBAddr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, CONTRACTS.ROUTER as `0x${string}`],
    query: { enabled: !!address && !!tokenBAddr }
  });

  const { data: allowanceLP, refetch: refetchAllowanceLP } = useReadContract({
    address: hasPair ? pairAddress : undefined,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, CONTRACTS.ROUTER as `0x${string}`],
    query: { enabled: !!address && !!hasPair }
  });

  // --- Logic: Auto-Calculate Amounts (Add Mode) ---
  const handleAmountChange = (val: string, type: 'A' | 'B') => {
    if (type === 'A') setAmountA(val);
    if (type === 'B') setAmountB(val);

    // If pair exists and has reserves, calculate the other amount
    if (hasPair && reserves && reserves[0] > 0n && tokenA && tokenB && val && !isNaN(parseFloat(val))) {
        const reserveA = (token0?.toLowerCase() === tokenA.address.toLowerCase()) ? reserves[0] : reserves[1];
        const reserveB = (token0?.toLowerCase() === tokenA.address.toLowerCase()) ? reserves[1] : reserves[0];

        if (type === 'A') {
            const amountBBig = (parseUnits(val, tokenA.decimals) * reserveB) / reserveA;
            setAmountB(formatUnits(amountBBig, tokenB.decimals));
        } else {
            const amountABig = (parseUnits(val, tokenB.decimals) * reserveA) / reserveB;
            setAmountA(formatUnits(amountABig, tokenA.decimals));
        }
    }
  };

  // --- Logic: Remove Liquidity Calculations ---
  const removeAmounts = useMemo(() => {
      if (!userLpBalance || !reserves || !totalSupply || totalSupply === 0n) return null;
      
      const liquidityToRemove = (userLpBalance * BigInt(removePercent)) / 100n;
      
      // AmountA = (Liquidity * ReserveA) / TotalSupply
      const reserveA = (token0?.toLowerCase() === (tokenAAddr || '').toLowerCase()) ? reserves[0] : reserves[1];
      const reserveB = (token0?.toLowerCase() === (tokenAAddr || '').toLowerCase()) ? reserves[1] : reserves[0];

      const amountAOut = (liquidityToRemove * reserveA) / totalSupply;
      const amountBOut = (liquidityToRemove * reserveB) / totalSupply;

      return {
          amountA: formatUnits(amountAOut, tokenA?.decimals || 18),
          amountB: formatUnits(amountBOut, tokenB?.decimals || 18),
          liquidity: liquidityToRemove
      };
  }, [userLpBalance, reserves, totalSupply, removePercent, tokenA, tokenB, token0, tokenAAddr]);

  // --- Actions ---

  const approveToken = (tokenAddr: string, refetch: () => void) => {
    writeContract({
        address: tokenAddr as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.ROUTER as `0x${string}`, maxUint256],
    }, {
        onSuccess: () => setTimeout(refetch, 2000)
    });
  };

  const handleAddLiquidity = () => {
      if (!tokenA || !tokenB || !amountA || !amountB || !address) return;

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 min

      // Slippage protection (0.5% default)
      const amountAMin = (parseUnits(amountA, tokenA.decimals) * 995n) / 1000n;
      const amountBMin = (parseUnits(amountB, tokenB.decimals) * 995n) / 1000n;

      writeContract({
          address: CONTRACTS.ROUTER as `0x${string}`,
          abi: ROUTER_ABI,
          functionName: 'addLiquidity',
          args: [
              tokenA.address as `0x${string}`,
              tokenB.address as `0x${string}`,
              parseUnits(amountA, tokenA.decimals),
              parseUnits(amountB, tokenB.decimals),
              hasPair ? amountAMin : 0n, // 0 min for initial liquidity to avoid revert
              hasPair ? amountBMin : 0n,
              address,
              deadline
          ]
      });
  };

  const handleRemoveLiquidity = () => {
      if (!tokenA || !tokenB || !removeAmounts || !address) return;

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

      // Slippage protection (0.5% default)
      const amountAMin = (parseUnits(removeAmounts.amountA, tokenA.decimals) * 995n) / 1000n;
      const amountBMin = (parseUnits(removeAmounts.amountB, tokenB.decimals) * 995n) / 1000n;

      writeContract({
          address: CONTRACTS.ROUTER as `0x${string}`,
          abi: ROUTER_ABI,
          functionName: 'removeLiquidity',
          args: [
              tokenA.address as `0x${string}`,
              tokenB.address as `0x${string}`,
              removeAmounts.liquidity,
              amountAMin,
              amountBMin,
              address,
              deadline
          ]
      });
  };

  // Need Approval Checks
  const needsApproveA = tokenAAddr && allowanceA !== undefined && amountA && parseUnits(amountA, tokenA?.decimals || 18) > allowanceA;
  const needsApproveB = tokenBAddr && allowanceB !== undefined && amountB && parseUnits(amountB, tokenB?.decimals || 18) > allowanceB;
  const needsApproveLP = hasPair && allowanceLP !== undefined && removeAmounts && removeAmounts.liquidity > allowanceLP;

  // --- Helpers to open selector ---
  const openSelector = (target: 'A' | 'B') => {
    setSelectorTarget(target);
    setIsSelectorOpen(true);
  };

  const onTokenSelect = (token: Token) => {
    if (selectorTarget === 'A') {
        if (token.address === tokenB?.address) setTokenB(null);
        setTokenA(token);
    } else {
        if (token.address === tokenA?.address) setTokenA(null);
        setTokenB(token);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10">
      <div className="mb-4">
        <Link to="/pools" className="flex items-center text-woosh-subtext hover:text-white transition-colors gap-2">
            <ArrowLeft size={16} /> Back to Pools
        </Link>
      </div>

      <TokenSelector 
        isOpen={isSelectorOpen} 
        onClose={() => setIsSelectorOpen(false)}
        onSelect={onTokenSelect}
        tokens={DEFAULT_TOKENS}
        selectedTokenAddress={selectorTarget === 'A' ? tokenA?.address : tokenB?.address}
      />

      <div className="bg-woosh-card border border-woosh-surface rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Toggle Tabs */}
        <div className="flex p-1 bg-woosh-surface rounded-xl mb-6">
            <button 
                onClick={() => setMode('add')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    mode === 'add' ? 'bg-woosh-card text-white shadow-lg' : 'text-woosh-subtext hover:text-white'
                }`}
            >
                Add Liquidity
            </button>
            <button 
                onClick={() => setMode('remove')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    mode === 'remove' ? 'bg-woosh-card text-white shadow-lg' : 'text-woosh-subtext hover:text-white'
                }`}
            >
                Remove Liquidity
            </button>
        </div>

        {/* Mode Content */}
        {mode === 'add' ? (
            <>
                {/* Token A Input */}
                <div className="bg-woosh-surface rounded-2xl p-4 mb-2 border border-transparent focus-within:border-woosh-red/50">
                    <div className="flex justify-between mb-2 text-sm text-woosh-subtext">
                        <span>Input</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <input 
                            type="number" 
                            value={amountA}
                            onChange={(e) => handleAmountChange(e.target.value, 'A')}
                            placeholder="0.0"
                            className="bg-transparent text-3xl font-bold text-white placeholder-woosh-subtext/50 outline-none w-full min-w-0"
                        />
                        <button 
                            onClick={() => openSelector('A')}
                            className="flex items-center gap-2 px-3 py-2 bg-woosh-card rounded-xl font-bold text-white hover:bg-woosh-bg transition-colors flex-shrink-0"
                        >
                            {tokenA ? <><TokenLogo token={tokenA} size="sm" /> {tokenA.symbol}</> : 'Select'}
                            <ChevronDown size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex justify-center -my-3 relative z-10">
                    <div className="bg-woosh-card p-1.5 rounded-lg border border-woosh-surface text-woosh-subtext">
                        <Plus size={16} />
                    </div>
                </div>

                {/* Token B Input */}
                <div className="bg-woosh-surface rounded-2xl p-4 mt-2 mb-6 border border-transparent focus-within:border-woosh-red/50">
                    <div className="flex justify-between mb-2 text-sm text-woosh-subtext">
                        <span>Input</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <input 
                            type="number" 
                            value={amountB}
                            onChange={(e) => handleAmountChange(e.target.value, 'B')}
                            placeholder="0.0"
                            className="bg-transparent text-3xl font-bold text-white placeholder-woosh-subtext/50 outline-none w-full min-w-0"
                        />
                        <button 
                            onClick={() => openSelector('B')}
                            className="flex items-center gap-2 px-3 py-2 bg-woosh-card rounded-xl font-bold text-white hover:bg-woosh-bg transition-colors flex-shrink-0"
                        >
                             {tokenB ? <><TokenLogo token={tokenB} size="sm" /> {tokenB.symbol}</> : 'Select'}
                             <ChevronDown size={16} />
                        </button>
                    </div>
                </div>

                {/* Initial Liquidity Notice */}
                {tokenA && tokenB && !hasPair && (
                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Info size={16} />
                            <span className="font-bold text-sm">You are the first provider</span>
                        </div>
                        <p className="text-xs text-blue-200/80">
                            The ratio of tokens you add will set the initial price of this pool. 
                            Ensure you add them at the correct market price to avoid immediate arbitrage.
                        </p>
                    </div>
                )}

                 {/* Actions */}
                 {!isConnected ? (
                     <div className="w-full py-4 bg-woosh-surface text-woosh-subtext text-center rounded-2xl font-bold">Connect Wallet</div>
                 ) : !tokenA || !tokenB ? (
                     <button disabled className="w-full py-4 bg-woosh-surface text-woosh-subtext rounded-2xl font-bold opacity-50 cursor-not-allowed">Select Tokens</button>
                 ) : needsApproveA ? (
                    <button 
                        onClick={() => approveToken(tokenA.address, refetchAllowanceA)}
                        disabled={isPending}
                        className="w-full py-4 bg-woosh-red hover:bg-woosh-darkRed text-white rounded-2xl font-bold shadow-lg transition-all flex justify-center items-center gap-2"
                    >
                        {isPending ? <RefreshCw className="animate-spin"/> : null} Approve {tokenA.symbol}
                    </button>
                 ) : needsApproveB ? (
                    <button 
                        onClick={() => approveToken(tokenB.address, refetchAllowanceB)}
                        disabled={isPending}
                        className="w-full py-4 bg-woosh-red hover:bg-woosh-darkRed text-white rounded-2xl font-bold shadow-lg transition-all flex justify-center items-center gap-2"
                    >
                         {isPending ? <RefreshCw className="animate-spin"/> : null} Approve {tokenB.symbol}
                    </button>
                 ) : (
                     <button 
                        onClick={handleAddLiquidity}
                        disabled={isPending || !amountA || !amountB}
                        className="w-full py-4 bg-woosh-red hover:bg-woosh-darkRed text-white rounded-2xl font-bold shadow-lg shadow-woosh-red/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {isPending ? <RefreshCw className="animate-spin"/> : null} Supply
                    </button>
                 )}
            </>
        ) : (
            <>
                {/* Remove Mode */}
                <div className="flex gap-2 mb-6">
                    <button 
                         onClick={() => openSelector('A')}
                         className="flex-1 py-3 bg-woosh-surface rounded-xl flex items-center justify-center gap-2 text-white font-bold border border-transparent hover:border-woosh-red/50 transition-all"
                    >
                        {tokenA ? <><TokenLogo token={tokenA} size="sm" /> {tokenA.symbol}</> : 'Select Token A'}
                    </button>
                    <button 
                         onClick={() => openSelector('B')}
                         className="flex-1 py-3 bg-woosh-surface rounded-xl flex items-center justify-center gap-2 text-white font-bold border border-transparent hover:border-woosh-red/50 transition-all"
                    >
                        {tokenB ? <><TokenLogo token={tokenB} size="sm" /> {tokenB.symbol}</> : 'Select Token B'}
                    </button>
                </div>

                {tokenA && tokenB && hasPair ? (
                    <>
                        <div className="p-4 bg-woosh-surface rounded-2xl mb-6">
                            <div className="flex justify-between text-sm text-woosh-subtext mb-2">
                                <span>Amount</span>
                                <span>{removePercent}%</span>
                            </div>
                            <div className="text-4xl font-bold text-white mb-4">{removePercent}%</div>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={removePercent} 
                                onChange={(e) => setRemovePercent(parseInt(e.target.value))}
                                className="w-full h-2 bg-woosh-bg rounded-lg appearance-none cursor-pointer accent-woosh-red"
                            />
                            <div className="flex justify-between mt-4">
                                {[25, 50, 75, 100].map(pct => (
                                    <button 
                                        key={pct}
                                        onClick={() => setRemovePercent(pct)}
                                        className="px-3 py-1 rounded-lg bg-woosh-card border border-woosh-surface text-xs hover:border-woosh-red/50 transition-colors"
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-woosh-subtext">Pooled {tokenA.symbol}:</span>
                                <span className="text-white font-medium">{removeAmounts ? parseFloat(removeAmounts.amountA).toFixed(4) : '0.00'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-woosh-subtext">Pooled {tokenB.symbol}:</span>
                                <span className="text-white font-medium">{removeAmounts ? parseFloat(removeAmounts.amountB).toFixed(4) : '0.00'}</span>
                            </div>
                        </div>

                        {userLpBalance === 0n ? (
                             <div className="p-4 bg-woosh-surface text-center text-woosh-subtext rounded-xl text-sm">
                                 No liquidity found to remove.
                             </div>
                        ) : needsApproveLP ? (
                            <button 
                                onClick={() => approveToken(pairAddress!, refetchAllowanceLP)}
                                disabled={isPending}
                                className="w-full py-4 bg-woosh-red hover:bg-woosh-darkRed text-white rounded-2xl font-bold shadow-lg transition-all flex justify-center items-center gap-2"
                            >
                                {isPending ? <RefreshCw className="animate-spin"/> : null} Approve LP Token
                            </button>
                        ) : (
                            <button 
                                onClick={handleRemoveLiquidity}
                                disabled={isPending || removePercent === 0}
                                className="w-full py-4 bg-woosh-red hover:bg-woosh-darkRed text-white rounded-2xl font-bold shadow-lg shadow-woosh-red/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {isPending ? <RefreshCw className="animate-spin"/> : null} Remove Liquidity
                            </button>
                        )}
                    </>
                ) : (
                    <div className="p-8 text-center text-woosh-subtext bg-woosh-surface/20 rounded-2xl border border-dashed border-woosh-surface">
                        <Wallet size={32} className="mx-auto mb-2 opacity-50"/>
                        <p>Select a pair to manage liquidity.</p>
                    </div>
                )}
            </>
        )}

        {/* Transaction Status */}
        {hash && (
          <div className="mt-4 p-3 bg-woosh-bg rounded-xl border border-woosh-surface/50 flex justify-between items-center text-sm animate-in slide-in-from-bottom-2">
             <span className="text-woosh-subtext">Transaction Hash</span>
             <a 
                href={`${arcTestnet.blockExplorers?.default.url}/tx/${hash}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-woosh-red hover:underline flex items-center gap-1"
             >
                View <Info size={12} />
             </a>
          </div>
        )}
      </div>
    </div>
  );
};