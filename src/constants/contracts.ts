import { defineChain } from 'viem';

// --- Chain Definition ---
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'USDC', // As per prompt description, symbol is USDC (Gas token?)
    symbol: 'USDC',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});

// --- Contract Addresses ---
export const CONTRACTS = {
  FACTORY: '0x8FA75F65Aa434d87a21435A64B3a54b2F70F9CDD',
  ROUTER: '0x01426dDCd7CFf512C331e56794A12D955D64c263',
  PAIR_TEMPLATE: '0x33d3c9DC1D84613FCc9356353435c35C3c08ea63', // Used for ABI reference mostly
  LP_TOKEN_TEMPLATE: '0x7065C3dd0a430E542330702C8541FD9bAFd25dC8'
} as const;

// --- ABIs ---
export const FACTORY_ABI = [
	{
		"inputs": [
			{ "internalType": "address", "name": "tokenA", "type": "address" },
			{ "internalType": "address", "name": "tokenB", "type": "address" }
		],
		"name": "createPair",
		"outputs": [{ "internalType": "address", "name": "pair", "type": "address" }],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "tokenA", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "tokenB", "type": "address" },
			{ "indexed": false, "internalType": "address", "name": "pair", "type": "address" },
			{ "indexed": false, "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"name": "PairCreated",
		"type": "event"
	},
	{
		"inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"name": "allPairs",
		"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "allPairsLength",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "", "type": "address" },
			{ "internalType": "address", "name": "", "type": "address" }
		],
		"name": "getPair",
		"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"stateMutability": "view",
		"type": "function"
	}
] as const;

export const PAIR_ABI = [
	{
		"constant": true,
		"inputs": [],
		"name": "getReserves",
		"outputs": [
			{ "internalType": "uint112", "name": "_reserve0", "type": "uint112" },
			{ "internalType": "uint112", "name": "_reserve1", "type": "uint112" },
			{ "internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32" }
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "token0",
		"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "token1",
		"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
    {
		"inputs": [],
		"name": "totalSupply",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
    {
		"inputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"name": "balanceOf",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	}
] as const;

export const ROUTER_ABI = [
	{
		"inputs": [
			{ "internalType": "address", "name": "tokenA", "type": "address" },
			{ "internalType": "address", "name": "tokenB", "type": "address" },
			{ "internalType": "uint256", "name": "amountADesired", "type": "uint256" },
			{ "internalType": "uint256", "name": "amountBDesired", "type": "uint256" }
		],
		"name": "addLiquidity",
		"outputs": [
			{ "internalType": "uint256", "name": "amountA", "type": "uint256" },
			{ "internalType": "uint256", "name": "amountB", "type": "uint256" },
			{ "internalType": "uint256", "name": "liquidity", "type": "uint256" }
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "tokenA", "type": "address" },
			{ "internalType": "address", "name": "tokenB", "type": "address" }
		],
		"name": "removeLiquidity",
		"outputs": [
			{ "internalType": "uint256", "name": "amountA", "type": "uint256" },
			{ "internalType": "uint256", "name": "amountB", "type": "uint256" }
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "amountIn", "type": "uint256" },
			{ "internalType": "address", "name": "tokenIn", "type": "address" },
			{ "internalType": "address", "name": "tokenOut", "type": "address" },
			{ "internalType": "address", "name": "to", "type": "address" }
		],
		"name": "swapExactTokensForTokens",
		"outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }],
		"stateMutability": "nonpayable",
		"type": "function"
	}
] as const;

export const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    }
] as const;
