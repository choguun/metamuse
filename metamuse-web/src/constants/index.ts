import { type ContractAddresses } from '@/types';

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Blockchain Configuration
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 133717; // Default to Metis Hyperion Testnet

// Contract Addresses (deployed on Metis Hyperion Testnet - UPDATED ✅)
// Block: 4755757, Deployer: 0x3BD91974F74dF7F014EAC3747e50819375667881
export const CONTRACTS: ContractAddresses = {
  MetaMuse: (process.env.NEXT_PUBLIC_METAMUSE_CONTRACT || '0x5Ae3a5b00c18b96E0879c7C9F5EcD5247B86C0e0') as `0x${string}`,
  CommitmentVerifier: (process.env.NEXT_PUBLIC_COMMITMENT_VERIFIER_CONTRACT || '0xB503F26D1edD1A59537472f7885fb3e2f8203fB6') as `0x${string}`,
  MuseMemory: (process.env.NEXT_PUBLIC_MUSE_MEMORY_CONTRACT || '0xBf602Bd3837e0cdD5EE4EFeB06655030CD773202') as `0x${string}`,
  MusePlugins: (process.env.NEXT_PUBLIC_MUSE_PLUGINS_CONTRACT || '0xfC4658aD392b45AE5edC0039dbf952620B104182') as `0x${string}`,
  MuseRating: (process.env.NEXT_PUBLIC_MUSE_RATING_CONTRACT || '0xFE0B57A0aa6BF0d5bCd65719ac3eA61f5d8a0f5A') as `0x${string}`,
  InteractionDAT: (process.env.NEXT_PUBLIC_INTERACTION_DAT_CONTRACT || '0x88B8c2c26Ba304eD643DD3791cf95E7bf78261e6') as `0x${string}`,
  TrainingDataDAT: (process.env.NEXT_PUBLIC_TRAINING_DATA_DAT_CONTRACT || '0xe84ee106Aaf184b9137B4187d8d93675F7830072') as `0x${string}`,
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

// MuseRating contract ABI for AI Alignment Market
export const MUSE_RATING_ABI = [
  {
    inputs: [
      { name: 'museId', type: 'uint256' },
      { name: 'interactionHash', type: 'string' },
      { name: 'qualityScore', type: 'uint8' },
      { name: 'personalityAccuracy', type: 'uint8' },
      { name: 'helpfulness', type: 'uint8' },
      { name: 'feedback', type: 'string' },
    ],
    name: 'rateInteraction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'museId', type: 'uint256' }],
    name: 'getMuseStats',
    outputs: [
      { name: 'totalRatings', type: 'uint256' },
      { name: 'averageQuality', type: 'uint256' },
      { name: 'averagePersonality', type: 'uint256' },
      { name: 'averageHelpfulness', type: 'uint256' },
      { name: 'totalRewards', type: 'uint256' },
      { name: 'lastUpdated', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPlatformStats',
    outputs: [
      { name: 'totalUsers', type: 'uint256' },
      { name: 'totalRatings', type: 'uint256' },
      { name: 'totalRewardsDistributed', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'ratingId', type: 'bytes32' },
      { indexed: true, name: 'museId', type: 'uint256' },
      { indexed: true, name: 'rater', type: 'address' },
      { indexed: false, name: 'qualityScore', type: 'uint8' },
      { indexed: false, name: 'personalityAccuracy', type: 'uint8' },
      { indexed: false, name: 'helpfulness', type: 'uint8' },
      { indexed: false, name: 'rewardAmount', type: 'uint256' },
    ],
    name: 'InteractionRated',
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