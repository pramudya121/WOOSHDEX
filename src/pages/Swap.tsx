
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits, maxUint256 } from 'viem';
import { Link } from 'react-router-dom';
import { ArrowDown, Settings, Info, RefreshCw, ChevronDown, Wallet, AlertTriangle, X, Layers } from 'lucide-react';
import { CONTRACTS, ROUTER_ABI, FACTORY_ABI, PAIR_ABI, ERC20_ABI, arcTestnet } from '../constants/contracts';
import { TokenSelector, Token, TokenLogo } from '../components/TokenSelector';

// Expanded Token List
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

export const Swap: React.FC = () => {
  const { address, isConnected } = useAccount();
  
  // State
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const [amountIn, setAmountIn] = useState('');
  
  // Settings State
  const [slippage, setSlippage] = useState(0.5); // Default 0.5%
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'in' | 'out'>('in');

  // Contracts
  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Close settings when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helpers
  const tokenInAddr = tokenIn?.address === 'NATIVE' ? undefined : tokenIn?.address;
  const tokenOutAddr = tokenOut?.address === 'NATIVE' ? undefined : tokenOut?.address;

  // 1. Get Pair Address
  const { data: pairAddress } = useReadContract({
    address: CONTRACTS.FACTORY as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: [tokenInAddr as `0x${string}`, tokenOutAddr as `0x${string}`],
    query: { enabled: !!tokenInAddr && !!tokenOutAddr && tokenInAddr !== tokenOutAddr }
  });

  // 2. Get Reserves (Refreshes every 10 seconds)
  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: pairAddress,
    abi: PAIR_ABI,
    functionName: 'getReserves',
    query: { 
      enabled: !!pairAddress,
      refetchInterval: 10000, // Periodic refresh
    }
  });

  // 3. Get Token 0
  const { data: token0 } = useReadContract({
    address: pairAddress,
    abi: PAIR_ABI,
    functionName: 'token0',
    query: { enabled: !!pairAddress }
  });

  // 4. Check Allowance
  const { data: allowance } = useReadContract({
    address: tokenInAddr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, CONTRACTS.ROUTER as `0x${string}`],
    query: { enabled: !!address && !!tokenInAddr }
  });

  // Calculations
  const quoteData = useMemo(() => {
    if (!reserves || !token0 || !amountIn || isNaN(parseFloat(amountIn)) || !tokenIn) return null;
    
    // Check if pair exists and has liquidity
    if (!pairAddress || reserves[0] === 0n) {
       return null;
    }

    const r0 = reserves[0];
    const r1 = reserves[1];
    
    const isTokenIn0 = token0.toLowerCase() === (tokenInAddr || '').toLowerCase();
    const reserveIn = isTokenIn0 ? r0 : r1;
    const reserveOut = isTokenIn0 ? r1 : r0;

    if (reserveIn === 0n || reserveOut === 0n) return null;

    const amountInBig = parseUnits(amountIn, tokenIn.decimals);
    const amountInWithFee = amountInBig * 997n;
    const numerator = amountInWithFee * BigInt(reserveOut);
    const denominator = (BigInt(reserveIn) * 1000n) + amountInWithFee;
    const amountOutBig = numerator / denominator;

    // Price Impact Calculation
    // Ideal price = reserveOut / reserveIn
    // Execution price = amountOut / amountIn
    // We calculate impact based on how much the reserves shift
    const constantProduct = BigInt(reserveIn) * BigInt(reserveOut);
    const newReserveIn = BigInt(reserveIn) + amountInBig;
    // New Reserve Out = K / New Reserve In
    const newReserveOut = constantProduct / newReserveIn;
    const amountOutTheoretical = BigInt(reserveOut) - newReserveOut;
    
    // Difference between linear projection and actual curve
    // Simplified: Impact = (amountIn / (reserveIn + amountIn))
    // Using big int math for precision:
    const impactBig = (amountInBig * 10000n) / (BigInt(reserveIn) + amountInBig);
    const impactPct = Number(impactBig) / 100;

    return {
      amountOut: formatUnits(amountOutBig, tokenOut?.decimals || 18),
      amountOutBig,
      priceImpact: impactPct
    };
  }, [amountIn, reserves, token0, tokenIn, tokenOut, tokenInAddr, pairAddress]);

  // Handlers
  const handleApprove = () => {
    if (!tokenInAddr) return;
    writeContract({
      address: tokenInAddr as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.ROUTER as `0x${string}`, maxUint256]
    });
  };

  const handleSwap = () => {
    if (!quoteData || !tokenIn || !tokenOut || !address) return;

    // Calculate Minimum Output based on user Slippage
    // Formula: minAmount = amountOut * (1 - slippage/100)
    const slippageFactor = 10000n - BigInt(Math.floor(slippage * 100));
    const minAmountOut = (quoteData.amountOutBig * slippageFactor) / 10000n;

    console.debug(`Swapping with slippage ${slippage}%. Expected: ${quoteData.amountOutBig}, Min: ${minAmountOut}`);

    writeContract({
      address: CONTRACTS.ROUTER as `0x${string}`,
      abi: ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        parseUnits(amountIn, tokenIn.decimals),
        minAmountOut,
        [tokenInAddr as `0x${string}`, tokenOutAddr as `0x${string}`],
        address,
        BigInt(Math.floor(Date.now() / 1000) + 60 * 20) // 20 min deadline
      ]
    });
  };

  const openSelector = (mode: 'in' | 'out') => {
    setSelectorMode(mode);
    setIsSelectorOpen(true);
  };

  const handleTokenSelect = (token: Token) => {
    if (selectorMode === 'in') {
      if (token.address === tokenOut?.address) setTokenOut(tokenIn);
      setTokenIn(token);
    } else {
      if (token.address === tokenIn?.address) setTokenIn(tokenOut);
      setTokenOut(token);
    }
  };

  const needsApproval = tokenInAddr && allowance !== undefined && amountIn && parseUnits(amountIn, tokenIn?.decimals || 18) > allowance;

  return (
    <div className="max-w-lg mx-auto mt-10 relative">
      
      <TokenSelector 
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handleTokenSelect}
        tokens={DEFAULT_TOKENS}
        selectedTokenAddress={selectorMode === 'in' ? tokenIn?.address : tokenOut?.address}
      />

      <div className="bg-woosh-card border border-woosh-surface rounded-3xl p-6 shadow-2xl shadow-black/50 backdrop-blur-md relative">
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-woosh-red/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6 relative z-20">
          <h2 className="text-xl font-bold text-white">Swap</h2>
          <div className="flex gap-2 relative" ref={settingsRef}>
            <button 
              className="p-2 hover:bg-woosh-surface rounded-full text-woosh-subtext transition-colors" 
              onClick={() => refetchReserves()}
              title="Refresh Rates"
            >
              <RefreshCw size={18} className={isPending ? 'animate-spin' : ''} />
            </button>
            <button 
              className={`p-2 rounded-full transition-colors ${isSettingsOpen ? 'bg-woosh-surface text-white' : 'hover:bg-woosh-surface text-woosh-subtext'}`}
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <Settings size={18} />
            </button>

            {/* Settings Dropdown */}
            {isSettingsOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-woosh-card border border-woosh-surface rounded-xl shadow-xl p-4 z-50 animate-in fade-in zoom-in duration-200">
                 <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-white">Transaction Settings</h4>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-woosh-subtext hover:text-white"><X size={14}/></button>
                 </div>
                 
                 <div className="mb-2">
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-xs text-woosh-subtext">Slippage Tolerance</span>
                        <Info size={10} className="text-woosh-subtext" />
                    </div>
                    <div className="flex gap-2 mb-2">
                        {[0.1, 0.5, 1.0].map((val) => (
                            <button
                                key={val}
                                onClick={() => setSlippage(val)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    slippage === val ? 'bg-woosh-red text-white' : 'bg-woosh-surface text-woosh-text hover:bg-woosh-surface/80'
                                }`}
                            >
                                {val}%
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center bg-woosh-surface rounded-lg px-3 py-2 border border-transparent focus-within:border-woosh-red/50">
                        <input 
                            type="number" 
                            value={slippage}
                            onChange={(e) => setSlippage(parseFloat(e.target.value))}
                            className="bg-transparent text-right w-full text-sm text-white outline-none"
                            placeholder="Custom"
                        />
                        <span className="text-woosh-subtext text-xs ml-1">%</span>
                    </div>
                    {slippage > 5 && (
                        <p className="text-[10px] text-red-500 mt-1">High slippage! Frontrun risk.</p>
                    )}
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Field (Token In) */}
        <div className="bg-woosh-surface rounded-2xl p-4 mb-2 border border-transparent focus-within:border-woosh-red/50 transition-colors">
          <div className="flex justify-between mb-2 text-sm text-woosh-subtext">
            <span>You pay</span>
            {/* Balance display handled in TokenSelector, simplifed here */}
          </div>
          <div className="flex justify-between items-center gap-4">
             <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              className="bg-transparent text-3xl font-bold text-white placeholder-woosh-subtext/50 outline-none w-full min-w-0"
            />
            <button 
              onClick={() => openSelector('in')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-all flex-shrink-0 ${
                tokenIn ? 'bg-woosh-card hover:bg-woosh-bg text-white' : 'bg-woosh-red text-white hover:bg-woosh-darkRed'
              }`}
            >
              {tokenIn ? (
                <>
                  <TokenLogo token={tokenIn} size="sm" className="w-6 h-6" />
                  {tokenIn.symbol}
                </>
              ) : (
                'Select'
              )}
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Switcher */}
        <div className="flex justify-center -my-4 relative z-10">
          <div className="bg-woosh-card p-2 rounded-xl border border-woosh-surface shadow-lg cursor-pointer hover:text-woosh-red transition-colors group"
               onClick={() => {
                 setTokenIn(tokenOut);
                 setTokenOut(tokenIn);
               }}
          >
            <ArrowDown size={20} className="group-hover:animate-bounce" />
          </div>
        </div>

        {/* Output Field (Token Out) */}
        <div className="bg-woosh-surface rounded-2xl p-4 mt-2 mb-6 border border-transparent">
          <div className="flex justify-between mb-2 text-sm text-woosh-subtext">
            <span>You receive</span>
          </div>
          <div className="flex justify-between items-center gap-4">
             <div className={`text-3xl font-bold w-full min-w-0 truncate ${quoteData ? 'text-white' : 'text-woosh-subtext/50'}`}>
               {quoteData ? parseFloat(quoteData.amountOut).toFixed(6) : '0.0'}
             </div>
             <button 
              onClick={() => openSelector('out')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-all flex-shrink-0 ${
                tokenOut ? 'bg-woosh-card hover:bg-woosh-bg text-white' : 'bg-woosh-red text-white hover:bg-woosh-darkRed'
              }`}
            >
              {tokenOut ? (
                <>
                   <TokenLogo token={tokenOut} size="sm" className="w-6 h-6" />
                  {tokenOut.symbol}
                </>
              ) : (
                'Select'
              )}
              <ChevronDown size={16} />
            </button>
          </div>
          
          {/* Quick Quote Info */}
          {quoteData && (
             <div className="flex justify-between items-center mt-2 text-xs border-t border-woosh-subtext/10 pt-2">
               <span className="text-woosh-subtext">Slippage Tolerance</span>
               <span className="text-white">{slippage}%</span>
             </div>
          )}
        </div>

        {/* Price Impact Warning / Info */}
        {quoteData && (
            <div className={`mb-4 p-3 rounded-xl border flex items-start gap-3 ${
                quoteData.priceImpact > 5 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : quoteData.priceImpact > 1 
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                    : 'bg-woosh-surface/50 border-woosh-surface text-woosh-subtext'
            }`}>
                <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
                <div className="flex-grow">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">Price Impact</span>
                        <span className="text-xs font-bold">{quoteData.priceImpact.toFixed(2)}%</span>
                    </div>
                    {quoteData.priceImpact > 5 && (
                        <p className="text-[10px] opacity-90 mt-1">
                            High price impact! You will lose a significant portion of funds.
                        </p>
                    )}
                </div>
            </div>
        )}

        {/* Impermanent Loss Protection Alert */}
        {quoteData && quoteData.priceImpact > 2 && (
            <div className="mb-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <Layers className="flex-shrink-0 mt-0.5 text-indigo-400" size={16} />
                <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-indigo-400">Liquidity Strategy Alert</span>
                    </div>
                    <p className="text-[11px] text-indigo-200/80 mb-2">
                        High price divergence detected ({quoteData.priceImpact.toFixed(2)}%). 
                        If you are a Liquidity Provider for this pair, this trade contributes to Impermanent Loss. 
                        Consider rebalancing your positions.
                    </p>
                    <Link 
                        to="/pools" 
                        className="inline-flex items-center justify-center text-[10px] bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded border border-indigo-500/30 transition-colors font-medium"
                    >
                        Check Liquidity Positions
                    </Link>
                </div>
            </div>
        )}

        {/* Action Button */}
        {!isConnected ? (
          <div className="w-full py-4 bg-woosh-surface text-woosh-subtext text-center rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
            <Wallet size={18} /> Connect Wallet First
          </div>
        ) : !tokenIn || !tokenOut ? (
          <button disabled className="w-full py-4 bg-woosh-surface text-woosh-subtext rounded-2xl font-bold cursor-not-allowed opacity-50">
            Select Tokens
          </button>
        ) : needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="w-full py-4 bg-woosh-red hover:bg-woosh-darkRed text-white rounded-2xl font-bold shadow-lg shadow-woosh-red/20 transition-all flex justify-center items-center gap-2"
          >
            {isPending ? <RefreshCw className="animate-spin" /> : null}
            Approve {tokenIn.symbol}
          </button>
        ) : (
          <button
            onClick={handleSwap}
            disabled={!quoteData || isPending || isConfirming || (quoteData.priceImpact > 15)}
            className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex justify-center items-center gap-2 ${
                quoteData && quoteData.priceImpact > 15 
                ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                : 'bg-woosh-red hover:bg-woosh-darkRed text-white shadow-woosh-red/20'
            }`}
          >
             {isPending || isConfirming ? <RefreshCw className="animate-spin" /> : null}
             {isConfirming ? 'Confirming...' : quoteData && quoteData.priceImpact > 15 ? 'Price Impact Too High' : 'Swap'}
          </button>
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
        
        {writeError && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 text-xs break-all">
            Error: {(writeError as any).shortMessage || writeError.message}
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center">
         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-woosh-surface/50 border border-woosh-surface text-xs text-woosh-subtext">
            <Info size={12} />
            <span>Rates refresh automatically every 10s.</span>
         </div>
      </div>
    </div>
  );
};
