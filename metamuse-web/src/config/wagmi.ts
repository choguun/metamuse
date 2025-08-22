import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  hardhat,
} from 'wagmi/chains';
import { CHAIN_ID } from '@/constants';

// Define Metis Hyperion Testnet
const metisHyperionTestnet = {
  id: 133717,
  name: 'Metis Hyperion Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Metis',
    symbol: 'tMETIS',
  },
  rpcUrls: {
    default: {
      http: ['https://hyperion-testnet.metisdevops.link'],
    },
    public: {
      http: ['https://hyperion-testnet.metisdevops.link'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Hyperion Testnet Explorer', 
      url: 'https://hyperion-testnet-explorer.metisdevops.link' 
    },
  },
  testnet: true,
};

// Define custom chain for local development if needed
const localChain = {
  id: 1337,
  name: 'Local Hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Local Explorer', url: 'http://localhost:8545' },
  },
  testnet: true,
};

// Select chains based on environment
const getChains = () => {
  if (process.env.NODE_ENV === 'development') {
    return [metisHyperionTestnet, localChain, hardhat];
  }
  
  return [metisHyperionTestnet];
};

export const config = getDefaultConfig({
  appName: 'MetaMuse',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'metamuse-dev',
  chains: getChains() as any,
  ssr: true, // If your dApp uses server side rendering (SSR)
});

// Helper to get current chain info
export const getCurrentChain = () => {
  const chains = getChains();
  return chains.find(chain => chain.id === CHAIN_ID) || chains[0];
};