// Core MetaMuse types for frontend application

export interface MuseTraits {
  creativity: number;
  wisdom: number;
  humor: number;
  empathy: number;
}

export interface MuseData {
  token_id: string;
  creativity: number;
  wisdom: number;
  humor: number;
  empathy: number;
  dna_hash: string;
  birth_block: number;
  total_interactions: number;
  owner: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  commitment_hash?: string;
  verification_status?: 'pending' | 'committed' | 'verified' | 'failed';
  tx_hash?: string;
}

export interface ChatResponse {
  response: string;
  commitment_hash: string;
  signature: string;
  timestamp: number;
  metadata: {
    inference_time_ms: number;
    model_version: string;
    memory_updated: boolean;
    traits_used: MuseTraits;
  };
}

export interface PendingMuse {
  traits: MuseTraits;
  status: 'creating' | 'confirming' | 'completed' | 'failed';
  dna_hash?: string;
  tx_hash?: string;
  error?: string;
}

export interface Memory {
  id: string;
  content: string;
  importance: number;
  timestamp: number;
  context?: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: 'Personality' | 'Creative' | 'Utility';
  creator: string;
  version: string;
  active: boolean;
  installed?: boolean;
}

export interface ContractAddresses {
  MetaMuse: `0x${string}`;
  CommitmentVerifier: `0x${string}`;
  MuseMemory: `0x${string}`;
  MusePlugins: `0x${string}`;
}

export interface AppConfig {
  apiUrl: string;
  chainId: number;
  contracts: ContractAddresses;
}

// Event types for real-time updates
export interface StateEvent {
  type: 'INTERACTION_VERIFIED' | 'MEMORY_UPDATED' | 'MUSE_STATE_CHANGED';
  data: any;
}