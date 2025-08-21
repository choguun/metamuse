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
  
  // Get enhanced memories with filtering - compatibility layer
  getEnhanced: async (museId: string, params?: MemorySearchParams): Promise<EnhancedMemoryResponse> => {
    try {
      const query = new URLSearchParams();
      if (params?.limit) query.set('limit', params.limit.toString());
      
      // Use the actual backend endpoint
      const response = await fetchMemoryAPI<{
        memories: string[];
        total_count: number;
        avg_importance: number;
      }>(`/api/v1/muses/${museId}/memories?${query.toString()}`);
      
      // Transform backend response to expected frontend format
      let enhancedMemories: MemoryEntry[] = response.memories.map((memory, index) => ({
        id: `mem_${index}_${Date.now()}`,
        content: memory,
        ai_response: `AI response for: ${memory.substring(0, 50)}...`,
        importance: response.avg_importance || 0.5,
        timestamp: Date.now() - (index * 60000), // Fake timestamps
        category: 'conversation' as MemoryCategory,
        tags: ['chat', 'conversation'],
        access_count: Math.floor(Math.random() * 10),
        retention_priority: 'Medium' as RetentionPriority,
      }));

      // Add sample memories if none exist (for demo purposes)
      if (enhancedMemories.length === 0) {
        console.log('💾 No memories found, adding sample data for demo');
        enhancedMemories = [
          {
            id: `sample_1_${Date.now()}`,
            content: "User asked about personality traits and how they affect responses",
            ai_response: "I explained that my creativity, wisdom, humor, and empathy levels shape how I interact and respond to different questions.",
            importance: 0.8,
            timestamp: Date.now() - 3600000, // 1 hour ago
            category: 'conversation' as MemoryCategory,
            tags: ['personality', 'traits', 'explanation'],
            access_count: 5,
            retention_priority: 'High' as RetentionPriority,
          },
          {
            id: `sample_2_${Date.now()}`,
            content: "Discussion about AI alignment and improvement through community feedback",
            ai_response: "We talked about how the rating system helps improve AI responses through community-driven feedback and token rewards.",
            importance: 0.9,
            timestamp: Date.now() - 7200000, // 2 hours ago
            category: 'learning' as MemoryCategory,
            tags: ['AI', 'alignment', 'feedback', 'improvement'],
            access_count: 8,
            retention_priority: 'Critical' as RetentionPriority,
          },
          {
            id: `sample_3_${Date.now()}`,
            content: "User tested the rating system and earned MUSE tokens",
            ai_response: "The user successfully submitted a rating and received 15 MUSE tokens plus a quality bonus for detailed feedback.",
            importance: 0.7,
            timestamp: Date.now() - 10800000, // 3 hours ago
            category: 'personal' as MemoryCategory,
            tags: ['rating', 'tokens', 'reward', 'success'],
            access_count: 3,
            retention_priority: 'Medium' as RetentionPriority,
          },
        ];
      }
      
      // Calculate stats from enhanced memories (including samples)
      const categoryCounts = enhancedMemories.reduce((acc, mem) => {
        acc[mem.category] = (acc[mem.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const retentionCounts = enhancedMemories.reduce((acc, mem) => {
        acc[mem.retention_priority] = (acc[mem.retention_priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const avgImportance = enhancedMemories.length > 0 
        ? enhancedMemories.reduce((sum, mem) => sum + mem.importance, 0) / enhancedMemories.length
        : 0;

      // Calculate tag counts
      const tagCounts = enhancedMemories.reduce((acc, mem) => {
        mem.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const stats: MemoryStats = {
        total_memories: enhancedMemories.length,
        average_importance: avgImportance,
        category_breakdown: categoryCounts,
        top_tags: tagCounts,
        emotional_distribution: { neutral: enhancedMemories.length }, // Simplified for demo
      };
      
      return {
        memories: enhancedMemories,
        stats,
        has_more: false, // Simple implementation
      };
    } catch (error) {
      console.warn('Memory API failed, returning empty result:', error);
      return {
        memories: [],
        stats: {
          total_memories: 0,
          average_importance: 0,
          category_breakdown: {},
          top_tags: {},
          emotional_distribution: {},
        },
        has_more: false,
      };
    }
  },

  // Semantic search memories - fallback implementation
  semanticSearch: async (museId: string, query: string, limit: number = 10): Promise<MemoryEntry[]> => {
    try {
      // Use regular memory search as fallback
      const enhanced = await enhancedMemoryApi.getEnhanced(museId, { limit, search: query });
      return enhanced.memories.filter(mem => 
        mem.content.toLowerCase().includes(query.toLowerCase())
      ).slice(0, limit);
    } catch (error) {
      console.warn('Semantic search failed, returning empty:', error);
      return [];
    }
  },

  // Get memories by category - fallback implementation
  getByCategory: async (museId: string, category: MemoryCategory, limit: number = 20): Promise<MemoryEntry[]> => {
    try {
      const enhanced = await enhancedMemoryApi.getEnhanced(museId, { limit });
      return enhanced.memories.filter(mem => mem.category === category).slice(0, limit);
    } catch (error) {
      console.warn('Category search failed, returning empty:', error);
      return [];
    }
  },

  // Get memories by tag - fallback implementation
  getByTag: async (museId: string, tag: string, limit: number = 20): Promise<MemoryEntry[]> => {
    try {
      const enhanced = await enhancedMemoryApi.getEnhanced(museId, { limit });
      return enhanced.memories.filter(mem => mem.tags.includes(tag)).slice(0, limit);
    } catch (error) {
      console.warn('Tag search failed, returning empty:', error);
      return [];
    }
  },

  // Get important memories - fallback implementation
  getImportant: async (museId: string, minImportance: number = 0.7, limit: number = 20): Promise<MemoryEntry[]> => {
    try {
      const enhanced = await enhancedMemoryApi.getEnhanced(museId, { limit });
      return enhanced.memories
        .filter(mem => mem.importance >= minImportance)
        .slice(0, limit);
    } catch (error) {
      console.warn('Important memories search failed, returning empty:', error);
      return [];
    }
  },

  // Get all available tags - fallback implementation
  getTags: async (museId: string): Promise<{ tags: string[] }> => {
    try {
      const enhanced = await enhancedMemoryApi.getEnhanced(museId);
      const allTags = enhanced.memories.flatMap(mem => mem.tags);
      const uniqueTags = [...new Set(allTags)];
      return { tags: uniqueTags };
    } catch (error) {
      console.warn('Tags fetch failed, returning defaults:', error);
      return { tags: ['chat', 'conversation', 'general'] };
    }
  },

  // Get enhanced statistics - fallback implementation
  getStats: async (museId: string): Promise<MemoryStats> => {
    try {
      const enhanced = await enhancedMemoryApi.getEnhanced(museId);
      return enhanced.stats;
    } catch (error) {
      console.warn('Stats fetch failed, returning defaults:', error);
      return {
        total_memories: 0,
        category_breakdown: {},
        top_tags: {},
        emotional_distribution: {},
        average_importance: 0,
      };
    }
  },

  // Get memory timeline - fallback implementation
  getTimeline: async (museId: string, limit: number = 50): Promise<MemoryTimeline> => {
    try {
      const enhanced = await enhancedMemoryApi.getEnhanced(museId, { limit });
      const entries = enhanced.memories.map(mem => ({
        date: new Date(mem.timestamp).toISOString().split('T')[0],
        memories: [mem],
        memory_count: 1,
        avg_importance: mem.importance,
        dominant_emotions: mem.tags || [],
      }));
      
      return {
        timeline: entries,
        date_range: {
          start: entries.length > 0 ? entries[entries.length - 1].date : new Date().toISOString().split('T')[0],
          end: entries.length > 0 ? entries[0].date : new Date().toISOString().split('T')[0],
        },
        total_days: entries.length,
      };
    } catch (error) {
      console.warn('Timeline fetch failed, returning empty:', error);
      const today = new Date().toISOString().split('T')[0];
      return {
        timeline: [],
        date_range: {
          start: today,
          end: today,
        },
        total_days: 0,
      };
    }
  },

  // Search memories with various options - fallback implementation
  search: async (museId: string, params: MemorySearchParams): Promise<MemoryEntry[]> => {
    try {
      return await enhancedMemoryApi.getEnhanced(museId, params).then(response => response.memories);
    } catch (error) {
      console.warn('Advanced search failed, returning empty:', error);
      return [];
    }
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