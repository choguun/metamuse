// Enhanced Memory API Client
// This extends the existing API client with advanced memory functionality

import { API_BASE_URL } from '@/constants';

// Create a simple fetch wrapper for memory API calls
const fetchMemoryAPI = async <T>(endpoint: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// Enhanced memory types
export interface MemoryEntry {
  id: string;
  content: string;
  ai_response: string;
  importance: number;
  timestamp: number;
  category: MemoryCategory;
  tags: string[];
  emotional_tone?: EmotionalTone;
  ipfs_hash?: string;
  access_count: number;
  retention_priority: RetentionPriority;
}

export interface EmotionalTone {
  sentiment: number; // -1.0 to 1.0
  emotions: Array<[string, number]>;
  energy_level: number; // 0.0 to 1.0
}

export type MemoryCategory = 
  | 'conversation' 
  | 'learning' 
  | 'personal' 
  | 'creative' 
  | 'problem_solving' 
  | 'emotional' 
  | 'factual';

export type RetentionPriority = 
  | 'Critical' 
  | 'High' 
  | 'Medium' 
  | 'Low' 
  | 'Temporary';

export interface MemoryStats {
  total_memories: number;
  average_importance: number;
  category_breakdown: Record<string, number>;
  top_tags: Record<string, number>;
  emotional_distribution: Record<string, number>;
}

export interface EnhancedMemoryResponse {
  memories: MemoryEntry[];
  stats: MemoryStats;
  has_more: boolean;
}

export interface MemorySearchParams {
  limit?: number;
  category?: MemoryCategory;
  tags?: string[];
  min_importance?: number;
  search?: string;
  search_type?: 'semantic' | 'keyword';
}

export interface MemoryTimelineEntry {
  date: string;
  memories: MemoryEntry[];
  memory_count: number;
  avg_importance: number;
  dominant_emotions: string[];
}

export interface MemoryTimeline {
  timeline: MemoryTimelineEntry[];
  total_days: number;
  date_range: {
    start: string;
    end: string;
  };
}

// Enhanced memory API methods
export const enhancedMemoryApi = {
  
  // Get enhanced memories with filtering
  getEnhanced: (museId: string, params?: MemorySearchParams) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.category) query.set('category', params.category);
    if (params?.tags && params.tags.length > 0) query.set('tags', params.tags.join(','));
    if (params?.min_importance) query.set('min_importance', params.min_importance.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.search_type) query.set('search_type', params.search_type);
    
    return fetchMemoryAPI<EnhancedMemoryResponse>(
      `/api/v1/muses/${museId}/memories/enhanced?${query.toString()}`
    );
  },

  // Semantic search memories
  semanticSearch: (museId: string, query: string, limit: number = 10) =>
    fetchMemoryAPI<MemoryEntry[]>(
      `/api/v1/muses/${museId}/memories/semantic?search=${encodeURIComponent(query)}&limit=${limit}`
    ),

  // Get memories by category
  getByCategory: (museId: string, category: MemoryCategory, limit: number = 20) =>
    fetchMemoryAPI<MemoryEntry[]>(
      `/api/v1/muses/${museId}/memories/category/${category}?limit=${limit}`
    ),

  // Get memories by tag
  getByTag: (museId: string, tag: string, limit: number = 20) =>
    fetchMemoryAPI<MemoryEntry[]>(
      `/api/v1/muses/${museId}/memories/tagged/${tag}?limit=${limit}`
    ),

  // Get important memories
  getImportant: (museId: string, minImportance: number = 0.7, limit: number = 20) =>
    fetchMemoryAPI<MemoryEntry[]>(
      `/api/v1/muses/${museId}/memories/important?min_importance=${minImportance}&limit=${limit}`
    ),

  // Get all available tags
  getTags: (museId: string) =>
    fetchMemoryAPI<{ tags: string[] }>(`/api/v1/muses/${museId}/memories/tags`),

  // Get enhanced statistics
  getStats: (museId: string) =>
    fetchMemoryAPI<MemoryStats>(`/api/v1/muses/${museId}/memories/stats`),

  // Get memory timeline
  getTimeline: (museId: string, limit: number = 50) =>
    fetchMemoryAPI<MemoryTimeline>(
      `/api/v1/muses/${museId}/memories/timeline?limit=${limit}`
    ),

  // Search memories with various options
  search: (museId: string, params: MemorySearchParams) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.search) query.set('search', params.search);
    if (params.search_type) query.set('search_type', params.search_type);
    if (params.category) query.set('category', params.category);
    if (params.tags && params.tags.length > 0) query.set('tags', params.tags.join(','));
    if (params.min_importance) query.set('min_importance', params.min_importance.toString());
    
    return fetchMemoryAPI<MemoryEntry[]>(
      `/api/v1/muses/${museId}/memories/search?${query.toString()}`
    );
  },

};

// Helper functions for memory analysis
export const memoryHelpers = {
  
  // Format memory timestamp
  formatTimestamp: (timestamp: number): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(timestamp * 1000));
  },

  // Get category color
  getCategoryColor: (category: MemoryCategory): string => {
    const colors = {
      conversation: '#6B7280',
      learning: '#3B82F6',
      personal: '#EF4444',
      creative: '#8B5CF6',
      problem_solving: '#F59E0B',
      emotional: '#EC4899',
      factual: '#10B981',
    };
    return colors[category] || colors.conversation;
  },

  // Get category icon
  getCategoryIcon: (category: MemoryCategory): string => {
    const icons = {
      conversation: '💬',
      learning: '📚',
      personal: '👤',
      creative: '🎨',
      problem_solving: '🔧',
      emotional: '❤️',
      factual: '📊',
    };
    return icons[category] || icons.conversation;
  },

  // Get importance badge
  getImportanceBadge: (importance: number): { text: string; color: string } => {
    if (importance >= 0.8) return { text: 'Critical', color: '#EF4444' };
    if (importance >= 0.6) return { text: 'High', color: '#F59E0B' };
    if (importance >= 0.4) return { text: 'Medium', color: '#3B82F6' };
    return { text: 'Low', color: '#6B7280' };
  },

  // Get sentiment emoji
  getSentimentEmoji: (sentiment: number): string => {
    if (sentiment > 0.3) return '😊';
    if (sentiment < -0.3) return '😔';
    return '😐';
  },

  // Format emotional tone summary
  formatEmotionalTone: (tone: EmotionalTone): string => {
    if (!tone.emotions.length) return 'Neutral';
    
    const primaryEmotion = tone.emotions.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );
    
    const intensity = primaryEmotion[1] > 0.7 ? 'Strong' : 'Mild';
    return `${intensity} ${primaryEmotion[0]}`;
  },

  // Group memories by date
  groupByDate: (memories: MemoryEntry[]): Record<string, MemoryEntry[]> => {
    return memories.reduce((groups, memory) => {
      const date = new Date(memory.timestamp * 1000).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(memory);
      return groups;
    }, {} as Record<string, MemoryEntry[]>);
  },

  // Filter memories by importance threshold
  filterByImportance: (memories: MemoryEntry[], threshold: number): MemoryEntry[] => {
    return memories.filter(memory => memory.importance >= threshold);
  },

  // Get memory statistics
  calculateStats: (memories: MemoryEntry[]): {
    totalMemories: number;
    averageImportance: number;
    categoryDistribution: Record<string, number>;
    tagDistribution: Record<string, number>;
    emotionalBreakdown: Record<string, number>;
  } => {
    const stats = {
      totalMemories: memories.length,
      averageImportance: memories.reduce((sum, m) => sum + m.importance, 0) / memories.length || 0,
      categoryDistribution: {} as Record<string, number>,
      tagDistribution: {} as Record<string, number>,
      emotionalBreakdown: {} as Record<string, number>,
    };

    memories.forEach(memory => {
      // Category distribution
      stats.categoryDistribution[memory.category] = 
        (stats.categoryDistribution[memory.category] || 0) + 1;

      // Tag distribution
      memory.tags.forEach(tag => {
        stats.tagDistribution[tag] = (stats.tagDistribution[tag] || 0) + 1;
      });

      // Emotional breakdown
      if (memory.emotional_tone) {
        memory.emotional_tone.emotions.forEach(([emotion, intensity]) => {
          stats.emotionalBreakdown[emotion] = 
            Math.max(stats.emotionalBreakdown[emotion] || 0, intensity);
        });
      }
    });

    return stats;
  },

  // Search within memories (client-side)
  searchMemories: (memories: MemoryEntry[], query: string): MemoryEntry[] => {
    const lowerQuery = query.toLowerCase();
    return memories.filter(memory =>
      memory.content.toLowerCase().includes(lowerQuery) ||
      memory.ai_response.toLowerCase().includes(lowerQuery) ||
      memory.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },

  // Get related memories by tags
  getRelatedMemories: (targetMemory: MemoryEntry, allMemories: MemoryEntry[], limit: number = 5): MemoryEntry[] => {
    return allMemories
      .filter(memory => memory.id !== targetMemory.id)
      .map(memory => ({
        memory,
        relevance: targetMemory.tags.filter(tag => memory.tags.includes(tag)).length
      }))
      .filter(item => item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(item => item.memory);
  },

};

// Re-export for convenience
export default enhancedMemoryApi;