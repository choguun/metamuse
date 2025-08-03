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
    check: () => apiClient.get<{ status: string; version: string }>('/api/v1/health'),
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
        verification_status: 'committed';
        estimated_verification_time: number;
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

  // Memory management
  memory: {
    // Get muse memory entries
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

    // Add memory entry
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