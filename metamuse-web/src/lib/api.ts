import { type MuseTraits, type MuseData } from '@/types';
import { API_BASE_URL } from '@/constants';

// API Error class for better error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Base API client with error handling
class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If we can't parse JSON error, use the original message
        }
        
        throw new APIError(errorMessage, response.status, response);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return {} as T;
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      // Network or other errors
      throw new APIError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new APIClient();

// API endpoints
export const api = {
  // Health check
  health: {
    check: () => apiClient.get<{ status: string; timestamp: number }>('/api/health'),
  },

  // Muse management
  muses: {
    // Prepare a muse for creation (generates DNA hash, etc.)
    prepare: (traits: MuseTraits & { creator_address?: string }) =>
      apiClient.post<{
        dna_hash: string;
        preparation_id: string;
        estimated_gas: string;
      }>('/api/v1/muses/prepare', traits),

    // Get muse data by token ID
    getById: (tokenId: string) =>
      apiClient.get<MuseData>(`/api/v1/muses/${tokenId}`),

    // Get muses owned by an address
    getByOwner: (ownerAddress: string) =>
      apiClient.get<{ muses: MuseData[]; total: number }>(`/api/v1/muses/owner/${ownerAddress}`),

    // Get all muses (for explore page)
    getAll: (params?: { limit?: number; offset?: number; sort?: 'recent' | 'popular' | 'interactions' }) =>
      apiClient.get<{ muses: MuseData[]; total: number; has_more: boolean }>(`/api/v1/muses${params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, v?.toString() || ''])).toString() : ''}`),

    // Get muse statistics
    getStats: (tokenId: string) =>
      apiClient.get<{
        total_interactions: number;
        verified_interactions: number;
        last_interaction: string;
        memory_entries: number;
        active_plugins: number;
      }>(`/api/v1/muses/${tokenId}/stats`),
  },

  // Chat functionality
  chat: {
    // Initialize or get existing chat session
    getSession: (museId: string, userAddress: string) =>
      apiClient.post<{
        session_id: string;
        muse_id: string;
        messages: Array<{
          id: string;
          content: string;
          role: 'user' | 'muse';
          timestamp: string;
          verification_status: 'pending' | 'committed' | 'verified' | 'failed';
          commitment_hash?: string;
        }>;
      }>(`/api/v1/muses/${museId}/chat/session`, { user_address: userAddress }),

    // Send a message in chat
    sendMessage: (museId: string, data: { session_id: string; message: string; user_address: string }) =>
      apiClient.post<{
        interaction_id: string;
        response: string;
        commitment_hash: string;
        user_commitment: string;
        tee_attestation?: string;
        tee_verified: boolean;
        timestamp: number;
      }>(`/api/v1/muses/${museId}/chat/message`, data),

    // Get chat history
    getHistory: (museId: string, sessionId: string, params?: { limit?: number; before?: string }) =>
      apiClient.get<{
        messages: Array<{
          id: string;
          content: string;
          role: 'user' | 'muse';
          timestamp: string;
          verification_status: string;
          commitment_hash?: string;
        }>;
        has_more: boolean;
      }>(`/api/v1/muses/${museId}/chat/history/${sessionId}${params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, v?.toString() || ''])).toString() : ''}`),
  },

  // Verification
  verification: {
    // Request verification of interactions
    requestVerification: (data: {
      interaction_id: string;
      commitment_hash: string;
      signature: string;
      muse_id: string;
    }) =>
      apiClient.post<{
        verification_id: string;
        status: 'pending' | 'processing' | 'verified' | 'failed';
        tx_hash?: string;
        estimated_confirmation_time: number;
      }>('/api/v1/verification/request', data),

    // Get verification status
    getStatus: (verificationId: string) =>
      apiClient.get<{
        verification_id: string;
        status: 'pending' | 'processing' | 'verified' | 'failed';
        tx_hash?: string;
        block_number?: number;
        confirmation_time?: string;
        error?: string;
      }>(`/api/v1/verification/${verificationId}`),

    // Batch verification for multiple interactions
    requestBatch: (data: {
      muse_id: string;
      commitments: Array<{
        interaction_id: string;
        commitment_hash: string;
        signature: string;
      }>;
    }) =>
      apiClient.post<{
        batch_id: string;
        status: 'pending' | 'processing' | 'verified' | 'failed';
        total_interactions: number;
        estimated_gas: string;
      }>('/api/v1/verification/batch', data),
  },

  // Memory management (Enhanced)
  memory: {
    // Basic memory operations (legacy compatibility)
    getEntries: (museId: string, params?: { limit?: number; importance_threshold?: number }) =>
      apiClient.get<{
        memories: Array<{
          id: string;
          content: string;
          importance_score: number;
          timestamp: string;
          ipfs_hash: string;
          context_tags: string[];
        }>;
        total: number;
      }>(`/api/v1/muses/${museId}/memory${params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, v?.toString() || ''])).toString() : ''}`),

    addEntry: (museId: string, data: {
      content: string;
      importance_score: number;
      context_tags: string[];
    }) =>
      apiClient.post<{
        memory_id: string;
        ipfs_hash: string;
        status: 'stored';
      }>(`/api/v1/muses/${museId}/memory`, data),

    // Enhanced memory operations
    getEnhanced: (museId: string, params?: {
      limit?: number;
      category?: string;
      tags?: string;
      min_importance?: number;
      search?: string;
      search_type?: 'semantic' | 'keyword';
    }) => {
      const query = new URLSearchParams();
      if (params?.limit) query.set('limit', params.limit.toString());
      if (params?.category) query.set('category', params.category);
      if (params?.tags) query.set('tags', params.tags);
      if (params?.min_importance) query.set('min_importance', params.min_importance.toString());
      if (params?.search) query.set('search', params.search);
      if (params?.search_type) query.set('search_type', params.search_type);
      
      return apiClient.get<{
        memories: Array<{
          id: string;
          content: string;
          ai_response: string;
          importance: number;
          timestamp: number;
          category: string;
          tags: string[];
          emotional_tone?: {
            sentiment: number;
            emotions: Array<[string, number]>;
            energy_level: number;
          };
          ipfs_hash?: string;
          access_count: number;
          retention_priority: string;
        }>;
        stats: {
          total_memories: number;
          average_importance: number;
          category_breakdown: Record<string, number>;
          top_tags: Record<string, number>;
          emotional_distribution: Record<string, number>;
        };
        has_more: boolean;
      }>(`/api/v1/muses/${museId}/memories/enhanced?${query.toString()}`);
    },

    // Semantic search
    semanticSearch: (museId: string, query: string, limit?: number) =>
      apiClient.get<Array<{
        id: string;
        content: string;
        ai_response: string;
        importance: number;
        timestamp: number;
        category: string;
        tags: string[];
        emotional_tone?: any;
        ipfs_hash?: string;
        access_count: number;
        retention_priority: string;
      }>>(`/api/v1/muses/${museId}/memories/semantic?search=${encodeURIComponent(query)}${limit ? `&limit=${limit}` : ''}`),

    // Category-based retrieval
    getByCategory: (museId: string, category: string, limit?: number) =>
      apiClient.get<Array<any>>(`/api/v1/muses/${museId}/memories/category/${category}${limit ? `?limit=${limit}` : ''}`),

    // Tag-based retrieval
    getByTag: (museId: string, tag: string, limit?: number) =>
      apiClient.get<Array<any>>(`/api/v1/muses/${museId}/memories/tagged/${tag}${limit ? `?limit=${limit}` : ''}`),

    // Important memories
    getImportant: (museId: string, minImportance?: number, limit?: number) => {
      const params = new URLSearchParams();
      if (minImportance) params.set('min_importance', minImportance.toString());
      if (limit) params.set('limit', limit.toString());
      return apiClient.get<Array<any>>(`/api/v1/muses/${museId}/memories/important?${params.toString()}`);
    },

    // Available tags
    getTags: (museId: string) =>
      apiClient.get<{ tags: string[] }>(`/api/v1/muses/${museId}/memories/tags`),

    // Enhanced statistics
    getStats: (museId: string) =>
      apiClient.get<{
        total_memories: number;
        average_importance: number;
        category_breakdown: Record<string, number>;
        top_tags: Record<string, number>;
        emotional_distribution: Record<string, number>;
      }>(`/api/v1/muses/${museId}/memories/stats`),

    // Memory timeline
    getTimeline: (museId: string, limit?: number) =>
      apiClient.get<{
        timeline: Array<{
          date: string;
          memories: Array<any>;
          memory_count: number;
          avg_importance: number;
          dominant_emotions: string[];
        }>;
        total_days: number;
        date_range: {
          start: string;
          end: string;
        };
      }>(`/api/v1/muses/${museId}/memories/timeline${limit ? `?limit=${limit}` : ''}`),

    // Advanced search
    search: (museId: string, params: {
      search?: string;
      search_type?: 'semantic' | 'keyword';
      category?: string;
      tags?: string;
      min_importance?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString());
      });
      return apiClient.get<Array<any>>(`/api/v1/muses/${museId}/memories/search?${query.toString()}`);
    },
  },

  // Plugin management
  plugins: {
    // Get available plugins
    getAvailable: () =>
      apiClient.get<{
        plugins: Array<{
          id: string;
          name: string;
          description: string;
          version: string;
          author: string;
          price: string;
          download_count: number;
          rating: number;
          wasm_hash: string;
          metadata_uri: string;
        }>;
      }>('/api/v1/plugins'),

    // Get installed plugins for a muse
    getInstalled: (museId: string) =>
      apiClient.get<{
        plugins: Array<{
          plugin_id: string;
          name: string;
          status: 'active' | 'inactive' | 'error';
          installation_date: string;
        }>;
      }>(`/api/v1/muses/${museId}/plugins`),

    // Install plugin for a muse
    install: (museId: string, pluginId: string) =>
      apiClient.post<{
        installation_id: string;
        status: 'pending' | 'installing' | 'active' | 'failed';
        tx_hash?: string;
      }>(`/api/v1/muses/${museId}/plugins/${pluginId}/install`),
  },

  // Analytics and stats
  analytics: {
    // Get platform statistics
    getPlatformStats: () =>
      apiClient.get<{
        total_muses: number;
        total_interactions: number;
        verified_interactions: number;
        active_users: number;
        top_personality_traits: Array<{
          trait: string;
          average_value: number;
          count: number;
        }>;
      }>('/api/v1/analytics/platform'),

    // Get user analytics
    getUserStats: (userAddress: string) =>
      apiClient.get<{
        muses_owned: number;
        total_interactions: number;
        verified_interactions: number;
        favorite_muse: string;
        interaction_streak: number;
      }>(`/api/v1/analytics/user/${userAddress}`),
  },

  // AI Alignment Market API
  rating: {
    // Submit a rating
    submitRating: (data: {
      muse_id: number;
      interaction_hash: string;
      quality_score: number; // 1-10 scale
      personality_accuracy: number; // 1-10 scale  
      helpfulness: number; // 1-10 scale
      feedback: string;
      user_address: string;
    }) =>
      apiClient.post<{
        success: boolean;
        transaction_hash?: string;
        reward_amount: number;
        error_message?: string;
      }>('/api/v1/ratings/submit', data),

    // Get muse statistics
    getMuseStats: (museId: string) =>
      apiClient.get<{
        average_rating: number;
        total_ratings: number;
        quality_avg: number;
        personality_avg: number;
        helpfulness_avg: number;
      }>(`/api/v1/ratings/muse/${museId}/stats`),

    // Get platform statistics
    getPlatformStats: () =>
      apiClient.get<{
        total_users: number;
        total_ratings: number;
        total_rewards_distributed: number;
        active_muses: number;
      }>('/api/v1/ratings/platform/stats'),

    // Get user rewards
    getUserRewards: (userAddress: string) =>
      apiClient.get<{
        total_earned: number;
        ratings_submitted: number;
        average_quality_score: number;
        last_reward_date?: string;
      }>(`/api/v1/ratings/user/${userAddress}/rewards`),
  },

  // DAT (Data Anchoring Tokens) API
  dat: {
    // Mint a new DAT for a verified AI interaction
    mint: (data: {
      interaction_data: {
        message_id: string;
        session_id: string;
        user_message: string;
        ai_response: string;
        timestamp: number;
        user_address: string;
      };
      tee_proof?: {
        attestation_hex: string;
        enclave_id: string;
        timestamp: number;
        nonce: string;
      };
      verification_proof?: {
        commitment_hash: string;
        signature: string;
        block_number: number;
      };
    }) =>
      apiClient.post<{
        dat_id: string;
        ipfs_hash: string;
        contract_address: string;
        token_id?: string;
        transaction_hash?: string;
        success: boolean;
        error_message?: string;
      }>('/api/v1/dat/mint', data),

    // Get DATs owned by a user
    getUserDATs: (userAddress: string, params?: { limit?: number; offset?: number }) =>
      apiClient.get<{
        dats: Array<{
          dat_id: string;
          ipfs_hash: string;
          contract_address: string;
          token_id: string;
          interaction_data: {
            message_id: string;
            session_id: string;
            user_message: string;
            ai_response: string;
            timestamp: number;
            user_address: string;
          };
          tee_verified: boolean;
          blockchain_verified: boolean;
          created_at: number;
        }>;
        total: number;
        has_more: boolean;
      }>(`/api/v1/dat/user/${userAddress}${params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, v?.toString() || ''])).toString() : ''}`),

    // Verify DAT authenticity
    verify: (datId: string) =>
      apiClient.get<{
        dat_id: string;
        is_authentic: boolean;
        verification_details: {
          tee_verified: boolean;
          blockchain_verified: boolean;
          ipfs_accessible: boolean;
          signature_valid: boolean;
        };
        metadata: any;
      }>(`/api/v1/dat/${datId}/verify`),

    // Get DAT metadata from IPFS
    getMetadata: (ipfsHash: string) =>
      apiClient.get<{
        dat_id: string;
        interaction_data: any;
        tee_proof?: any;
        verification_proof?: any;
        created_at: number;
        authenticity_score: number;
      }>(`/api/v1/dat/metadata/${ipfsHash}`),

    // Get platform DAT statistics
    getStats: () =>
      apiClient.get<{
        total_dats_minted: number;
        total_tee_verified: number;
        total_blockchain_verified: number;
        active_users: number;
        total_ipfs_storage: number;
      }>('/api/v1/dat/stats'),
  },

  // Training Data Marketplace API
  trainingData: {
    // Contribute training data for AI improvement
    contribute: (data: {
      contributor_address: string;
      muse_token_id: number;
      contribution_type: number; // ContributionType enum value
      original_data: any;
      improved_data: any;
      metadata: {
        message_id?: string;
        session_id?: string;
        user_comment?: string;
        difficulty_level: number; // 1-10
        improvement_type: string; // "grammar", "accuracy", "creativity", etc.
        reference_urls: string[];
        tags: string[];
      };
    }) =>
      apiClient.post<{
        success: boolean;
        contribution_id: string;
        reward_amount: number;
        ipfs_hash: string;
        reward_calculation: {
          base_reward: number;
          type_bonus: number;
          quality_bonus: number;
          streak_bonus: number;
          total_reward: number;
          reasoning: string[];
        };
      }>('/api/v1/training-data/contribute', data),

    // Validate a training data contribution
    validate: (data: {
      contribution_id: string;
      validator_address: string;
      approved: boolean;
      quality_score: number; // 1-100
      feedback?: string;
    }) =>
      apiClient.post<{
        success: boolean;
        contribution_id: string;
        new_quality_score: number;
        validation_status: 'Pending' | 'Validated' | 'Rejected' | 'UnderReview';
      }>('/api/v1/training-data/validate', data),

    // Get contributor profile and statistics
    getContributor: (address: string) =>
      apiClient.get<{
        success: boolean;
        profile: {
          address: string;
          total_contributions: number;
          total_dats_earned: number;
          average_quality_score: number;
          validations_passed: number;
          current_streak: number;
          last_contribution: string;
          quality_contributor_badge: boolean;
          specializations: string[];
          contribution_history: string[];
        };
      }>(`/api/v1/training-data/contributor/${address}`),

    // Get contribution details
    getContribution: (id: string) =>
      apiClient.get<{
        success: boolean;
        contribution: {
          contribution_id: string;
          contributor_address: string;
          muse_token_id: number;
          contribution_type: number;
          original_data: any;
          improved_data: any;
          metadata: any;
          data_hash: string;
          ipfs_hash: string;
          timestamp: string;
          quality_score: number;
          reward_amount: number;
          validation_status: string;
        };
      }>(`/api/v1/training-data/contribution/${id}`),

    // Get marketplace statistics
    getStats: () =>
      apiClient.get<{
        stats: {
          total_contributions: number;
          total_contributors: number;
          total_rewards_distributed: number;
          contributions_by_type: Record<string, number>;
          average_quality_score: number;
          active_contributors: number;
          quality_contributors: number;
        };
        recent_contributions: any[];
        top_contributors: any[];
      }>('/api/v1/training-data/marketplace/stats'),

    // Get contributions by type
    getByType: (typeId: number, limit?: number) =>
      apiClient.get<{
        success: boolean;
        contributions: any[];
        contribution_type: string;
      }>(`/api/v1/training-data/contributions/type/${typeId}${limit ? `?limit=${limit}` : ''}`),

    // Get recent contributions for a user
    getRecent: (address: string, limit?: number) =>
      apiClient.get<{
        success: boolean;
        contributions: any[];
        total: number;
      }>(`/api/v1/training-data/recent/${address}${limit ? `?limit=${limit}` : ''}`),

    // Get contributor leaderboard
    getLeaderboard: () =>
      apiClient.get<{
        success: boolean;
        leaderboard: any[];
        total_contributors: number;
      }>('/api/v1/training-data/leaderboard'),
  },
};

// Helper functions for common API patterns
export const apiHelpers = {
  // Retry a request with exponential backoff
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  },

  // Check if API is available
  async isHealthy(): Promise<boolean> {
    try {
      await api.health.check();
      return true;
    } catch {
      return false;
    }
  },

  // Format API errors for user display
  formatError(error: unknown): string {
    if (error instanceof APIError) {
      return error.message;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  },
};

export default api;