import { type ContractAddresses } from '@/types';

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Blockchain Configuration
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 133717; // Default to Metis Hyperion Testnet

// Contract Addresses (will be updated after deployment)
export const CONTRACTS: ContractAddresses = {
  MetaMuse: (process.env.NEXT_PUBLIC_METAMUSE_CONTRACT || '0x742d35Cc6634C0532925a3b8D9C072a8c0c8E8C1') as `0x${string}`,
  CommitmentVerifier: (process.env.NEXT_PUBLIC_COMMITMENT_VERIFIER_CONTRACT || '0x742d35Cc6634C0532925a3b8D9C072a8c0c8E8C1') as `0x${string}`,
  MuseMemory: (process.env.NEXT_PUBLIC_MUSE_MEMORY_CONTRACT || '0x742d35Cc6634C0532925a3b8D9C072a8c0c8E8C1') as `0x${string}`,
  MusePlugins: (process.env.NEXT_PUBLIC_MUSE_PLUGINS_CONTRACT || '0x742d35Cc6634C0532925a3b8D9C072a8c0c8E8C1') as `0x${string}`,
};

// Contract ABIs - Simplified for frontend usage
export const METAMUSE_ABI = [
  {
    inputs: [
      { name: '_creativity', type: 'uint8' },
      { name: '_wisdom', type: 'uint8' },
      { name: '_humor', type: 'uint8' },
      { name: '_empathy', type: 'uint8' },
    ],
    name: 'createMuse',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_tokenId', type: 'uint256' },
      { name: '_commitmentHash', type: 'bytes32' },
    ],
    name: 'commitInteraction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_tokenId', type: 'uint256' },
      { name: '_commitmentHash', type: 'bytes32' },
      { name: '_signature', type: 'bytes' },
    ],
    name: 'verifyInteraction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    name: 'getMuseData',
    outputs: [
      { name: 'creativity', type: 'uint8' },
      { name: 'wisdom', type: 'uint8' },
      { name: 'humor', type: 'uint8' },
      { name: 'empathy', type: 'uint8' },
      { name: 'dnaHash', type: 'bytes32' },
      { name: 'birthBlock', type: 'uint256' },
      { name: 'totalInteractions', type: 'uint256' },
      { name: 'owner', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: '_tokenId', type: 'uint256' },
      { name: '_user', type: 'address' },
    ],
    name: 'canInteract',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: false, name: 'dnaHash', type: 'bytes32' },
      { indexed: false, name: 'creativity', type: 'uint8' },
      { indexed: false, name: 'wisdom', type: 'uint8' },
      { indexed: false, name: 'humor', type: 'uint8' },
      { indexed: false, name: 'empathy', type: 'uint8' },
    ],
    name: 'MuseCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'commitmentHash', type: 'bytes32' },
      { indexed: true, name: 'user', type: 'address' },
    ],
    name: 'InteractionCommitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'commitmentHash', type: 'bytes32' },
      { indexed: false, name: 'verificationTime', type: 'uint256' },
    ],
    name: 'InteractionVerified',
    type: 'event',
  },
] as const;

// Event signatures for filtering
export const MUSE_CREATED_EVENT_SIGNATURE = '0x...'; // Will be calculated from ABI

// Application Constants
export const TRAIT_MIN = 0;
export const TRAIT_MAX = 100;

export const TRAIT_DESCRIPTIONS = {
  creativity: {
    low: 'Practical and grounded in suggestions',
    medium: 'Balances creativity with practicality', 
    high: 'Highly imaginative and unconventional in ideas',
  },
  wisdom: {
    low: 'Focuses on immediate, actionable advice',
    medium: 'Provides thoughtful, well-reasoned guidance',
    high: 'Offers deep, philosophical insights and perspectives',
  },
  humor: {
    low: 'Serious and formal in communication',
    medium: 'Occasionally playful with light humor',
    high: 'Witty, entertaining, and frequently humorous',
  },
  empathy: {
    low: 'Direct and objective in responses',
    medium: 'Considerate and understanding',
    high: 'Deeply compassionate and emotionally attuned',
  },
} as const;

// UI Constants
export const PERSONALITY_COLORS = {
  creativity: '#8B5CF6', // Purple
  wisdom: '#3B82F6',     // Blue
  humor: '#F59E0B',      // Amber
  empathy: '#10B981',    // Emerald
} as const;

export const NAVIGATION_ITEMS = [
  { name: 'Home', href: '/' },
  { name: 'Create Muse', href: '/create' },
  { name: 'My Muses', href: '/gallery' },
  { name: 'Explore', href: '/explore' },
] as const;