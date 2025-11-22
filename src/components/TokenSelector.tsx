import React, { useState, useMemo } from 'react';
import { X, Search, ShieldCheck, AlertTriangle, Check } from 'lucide-react';
import { useBalance, useAccount } from 'wagmi';
import { formatUnits, isAddress } from 'viem';
import { arcTestnet } from '../constants/contracts';

export interface Token {
  symbol: string;
  name: string;
  address: string; // 'NATIVE' or 0x...
  decimals: number;
  isTrusted?: boolean;
  logoUrl?: string;
}

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  tokens: Token[];
  selectedTokenAddress?: string;
}

interface TokenLogoProps {
  token: Token;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TokenLogo: React.FC<TokenLogoProps> = ({ token, size = 'md', className = '' }) => {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-[9px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm'
  };

  const baseClasses = `rounded-full flex-shrink-0 flex items-center justify-center font-bold overflow-hidden transition-all ${sizeClasses[size]} ${className}`;

  if (token.logoUrl && !error) {
    return (
      <img 
        src={token.logoUrl} 
        alt={token.symbol} 
        className={`rounded-full object-cover ${sizeClasses[size].split(' ').slice(0, 2).join(' ')} ${className}`}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`${baseClasses} ${
       token.address === 'NATIVE' ? 'bg-woosh-red text-white' : 'bg-woosh-surface border border-woosh-subtext/20 text-woosh-text'
    }`}>
      <span>{token.symbol.slice(0, 2)}</span>
    </div>
  );
};

const TokenRow: React.FC<{ token: Token; isSelected: boolean; onSelect: (t: Token) => void }> = ({ 
  token, 
  isSelected, 
  onSelect 
}) => {
  const { address, isConnected } = useAccount();
  
  // Fetch balance for the token (Native if address is 'NATIVE', else ERC20)
  const { data: balance, isLoading } = useBalance({
    address: address,
    token: token.address === 'NATIVE' ? undefined : (token.address as `0x${string}`),
    chainId: arcTestnet.id,
    query: { enabled: !!address && isConnected }
  });

  const formattedBalance = balance 
    ? Number(formatUnits(balance.value, balance.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })
    : '0';

  return (
    <div 
      onClick={() => onSelect(token)}
      className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
        isSelected 
          ? 'bg-woosh-red/10 border border-woosh-red/30' 
          : 'hover:bg-woosh-surface border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <TokenLogo token={token} size="md" />
        
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-bold text-white">{token.symbol}</span>
            {token.isTrusted && (
              <ShieldCheck size={14} className="text-blue-400" aria-label="Trusted Token" />
            )}
          </div>
          <span className="text-xs text-woosh-subtext">{token.name}</span>
        </div>
      </div>

      <div className="text-right min-w-[80px]">
        {isLoading && isConnected ? (
            <div className="h-4 w-16 bg-woosh-surface/50 animate-pulse rounded ml-auto mb-1"></div>
        ) : (
            <div className="text-sm font-medium text-white">
                {isConnected ? formattedBalance : '-'}
            </div>
        )}
        {isSelected && <Check size={14} className="text-woosh-red ml-auto" />}
      </div>
    </div>
  );
};

export const TokenSelector: React.FC<TokenSelectorProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  tokens,
  selectedTokenAddress 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens;
    
    const trimmedQuery = searchQuery.trim();
    const lowerQuery = trimmedQuery.toLowerCase();

    return tokens.filter(t => {
      // 1. Symbol Match
      if (t.symbol.toLowerCase().includes(lowerQuery)) return true;
      
      // 2. Name Match
      if (t.name.toLowerCase().includes(lowerQuery)) return true;
      
      // 3. Exact Address Match
      if (t.address.toLowerCase() === lowerQuery) return true;

      return false;
    });
  }, [tokens, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-woosh-card border border-woosh-surface rounded-3xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-woosh-surface/50 flex justify-between items-center bg-woosh-bg/50">
          <h3 className="text-lg font-bold text-white">Select Token</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-woosh-surface text-woosh-subtext hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-woosh-subtext" />
            <input 
              type="text" 
              placeholder="Search name or paste address" 
              className="w-full bg-woosh-surface border border-woosh-surface focus:border-woosh-red/50 rounded-xl py-3 pl-11 pr-10 text-white placeholder-woosh-subtext/50 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
             {searchQuery && (
                <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-woosh-card text-woosh-subtext hover:text-white transition-colors"
                >
                    <X size={14} />
                </button>
            )}
          </div>
          
          {/* Common Tokens Tags (Quick Select) */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {tokens.filter(t => t.isTrusted).slice(0, 3).map(t => (
               <button 
                 key={t.address}
                 onClick={() => {
                    onSelect(t);
                    onClose();
                 }}
                 className="px-3 py-1 rounded-lg bg-woosh-surface border border-woosh-surface/50 hover:border-woosh-red/30 text-xs text-woosh-subtext hover:text-white transition-colors flex items-center gap-1"
               >
                 <TokenLogo token={t} size="sm" className="w-4 h-4 text-[8px]" />
                 {t.symbol}
               </button>
            ))}
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
          {filteredTokens.length > 0 ? (
            filteredTokens.map((token) => (
              <TokenRow 
                key={token.address} 
                token={token} 
                isSelected={token.address === selectedTokenAddress}
                onSelect={(t) => {
                    onSelect(t);
                    onClose();
                }} 
              />
            ))
          ) : (
            <div className="p-8 text-center text-woosh-subtext flex flex-col items-center">
              <AlertTriangle size={32} className="mb-2 opacity-50" />
              <p>No tokens found.</p>
            </div>
          )}
        </div>
        
        {/* Footer with Network Safety Info */}
        <div className="p-4 bg-woosh-surface/30 border-t border-woosh-surface/50 text-xs text-woosh-subtext text-center">
            <p className="flex items-center justify-center gap-1">
               <ShieldCheck size={12} className="text-green-500" /> 
               Tokens list is curated for Arc Testnet
            </p>
        </div>
      </div>
    </div>
  );
};