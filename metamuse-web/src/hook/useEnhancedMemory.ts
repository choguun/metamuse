import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  enhancedMemoryApi, 
  memoryHelpers,
  type MemoryEntry, 
  type MemoryStats, 
  type MemorySearchParams,
  type MemoryCategory,
  type MemoryTimeline
} from '@/lib/api-memory-enhanced';

export interface UseEnhancedMemoryOptions {
  autoLoad?: boolean;
  cacheEnabled?: boolean;
  pollingInterval?: number;
}

export interface MemoryFilter {
  category?: MemoryCategory;
  tags?: string[];
  minImportance?: number;
  search?: string;
  searchType?: 'semantic' | 'keyword';
}

export function useEnhancedMemory(museId: string, options: UseEnhancedMemoryOptions = {}) {
  const {
    autoLoad = true,
    cacheEnabled = true,
    pollingInterval = 30000, // 30 seconds
  } = options;

  // State
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [timeline, setTimeline] = useState<MemoryTimeline | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<MemoryFilter>({});
  
  // Cache and refs
  const memoryCache = useRef<Map<string, MemoryEntry[]>>(new Map());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate cache key from filter
  const getCacheKey = useCallback((filter: MemoryFilter): string => {
    return JSON.stringify({
      museId,
      category: filter.category,
      tags: filter.tags?.sort(),
      minImportance: filter.minImportance,
      search: filter.search,
      searchType: filter.searchType,
    });
  }, [museId]);

  // Load enhanced memories with filtering
  const loadMemories = useCallback(async (filter: MemoryFilter = {}, useCache: boolean = true) => {
    const cacheKey = getCacheKey(filter);
    
    // Check cache first
    if (useCache && cacheEnabled && memoryCache.current.has(cacheKey)) {
      const cachedMemories = memoryCache.current.get(cacheKey)!;
      setMemories(cachedMemories);
      return cachedMemories;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const params: MemorySearchParams = {
        limit: 50,
        category: filter.category,
        tags: filter.tags,
        min_importance: filter.minImportance,
        search: filter.search,
        search_type: filter.searchType,
      };

      const response = await enhancedMemoryApi.getEnhanced(museId, params);
      
      // Update state
      setMemories(response.memories);
      setStats(response.stats);
      
      // Cache results
      if (cacheEnabled) {
        memoryCache.current.set(cacheKey, response.memories);
      }

      return response.memories;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load memories');
        console.error('Failed to load memories:', err);
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [museId, getCacheKey, cacheEnabled]);

  // Search memories
  const searchMemories = useCallback(async (query: string, searchType: 'semantic' | 'keyword' = 'keyword') => {
    if (!query.trim()) {
      return loadMemories(currentFilter);
    }

    setIsSearching(true);
    setError(null);

    try {
      let results: MemoryEntry[];

      if (searchType === 'semantic') {
        results = await enhancedMemoryApi.semanticSearch(museId, query);
      } else {
        results = await enhancedMemoryApi.search(museId, {
          search: query,
          search_type: searchType,
          category: currentFilter.category,
          tags: currentFilter.tags,
          min_importance: currentFilter.minImportance,
        });
      }

      setMemories(results);
      return results;
    } catch (err: any) {
      setError(err.message || 'Search failed');
      console.error('Search failed:', err);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [museId, currentFilter, loadMemories]);

  // Get memories by category
  const getByCategory = useCallback(async (category: MemoryCategory, limit: number = 20) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await enhancedMemoryApi.getByCategory(museId, category, limit);
      setMemories(results);
      setCurrentFilter({ category });
      return results;
    } catch (err: any) {
      setError(err.message || 'Failed to load category memories');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [museId]);

  // Get memories by tag
  const getByTag = useCallback(async (tag: string, limit: number = 20) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await enhancedMemoryApi.getByTag(museId, tag, limit);
      setMemories(results);
      setCurrentFilter({ tags: [tag] });
      return results;
    } catch (err: any) {
      setError(err.message || 'Failed to load tagged memories');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [museId]);

  // Get important memories
  const getImportantMemories = useCallback(async (minImportance: number = 0.7, limit: number = 20) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await enhancedMemoryApi.getImportant(museId, minImportance, limit);
      setMemories(results);
      setCurrentFilter({ minImportance });
      return results;
    } catch (err: any) {
      setError(err.message || 'Failed to load important memories');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [museId]);

  // Load available tags
  const loadTags = useCallback(async () => {
    try {
      const response = await enhancedMemoryApi.getTags(museId);
      setAvailableTags(response.tags);
      return response.tags;
    } catch (err: any) {
      console.error('Failed to load tags:', err);
      return [];
    }
  }, [museId]);

  // Load memory timeline
  const loadTimeline = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const timelineData = await enhancedMemoryApi.getTimeline(museId);
      setTimeline(timelineData);
      return timelineData;
    } catch (err: any) {
      setError(err.message || 'Failed to load timeline');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [museId]);

  // Load memory statistics
  const loadStats = useCallback(async () => {
    try {
      const statsData = await enhancedMemoryApi.getStats(museId);
      setStats(statsData);
      return statsData;
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      return null;
    }
  }, [museId]);

  // Apply filter
  const applyFilter = useCallback(async (filter: MemoryFilter) => {
    setCurrentFilter(filter);
    return loadMemories(filter, false);
  }, [loadMemories]);

  // Clear filter
  const clearFilter = useCallback(async () => {
    setCurrentFilter({});
    return loadMemories({}, false);
  }, [loadMemories]);

  // Get related memories
  const getRelatedMemories = useCallback((targetMemory: MemoryEntry, limit: number = 5): MemoryEntry[] => {
    return memoryHelpers.getRelatedMemories(targetMemory, memories, limit);
  }, [memories]);

  // Refresh data
  const refresh = useCallback(async () => {
    // Clear cache
    if (cacheEnabled) {
      memoryCache.current.clear();
    }
    
    // Reload current view
    await Promise.all([
      loadMemories(currentFilter, false),
      loadTags(),
      loadStats(),
    ]);
  }, [loadMemories, loadTags, loadStats, currentFilter, cacheEnabled]);

  // Start polling for updates
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        await refresh();
      } catch (err) {
        console.debug('Polling failed:', err);
      }
    }, pollingInterval);
  }, [refresh, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load memories on mount
  useEffect(() => {
    if (autoLoad && museId) {
      Promise.all([
        loadMemories(),
        loadTags(),
        loadStats(),
      ]);
    }

    return () => {
      // Cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      stopPolling();
    };
  }, [autoLoad, museId, loadMemories, loadTags, loadStats, stopPolling]);

  // Start polling when memories are loaded
  useEffect(() => {
    if (memories.length > 0) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [memories.length, startPolling, stopPolling]);

  // Client-side memory filtering and analysis
  const filteredMemories = useCallback((clientFilter?: Partial<MemoryFilter>) => {
    if (!clientFilter) return memories;

    return memories.filter(memory => {
      // Category filter
      if (clientFilter.category && memory.category !== clientFilter.category) {
        return false;
      }

      // Tag filter
      if (clientFilter.tags && clientFilter.tags.length > 0) {
        const hasMatchingTag = clientFilter.tags.some(tag => 
          memory.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Importance filter
      if (clientFilter.minImportance && memory.importance < clientFilter.minImportance) {
        return false;
      }

      // Search filter
      if (clientFilter.search) {
        const query = clientFilter.search.toLowerCase();
        const matchesContent = memory.content.toLowerCase().includes(query);
        const matchesResponse = memory.ai_response.toLowerCase().includes(query);
        const matchesTags = memory.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesContent && !matchesResponse && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [memories]);

  // Computed values
  const memoryCount = memories.length;
  const averageImportance = memories.length > 0 
    ? memories.reduce((sum, m) => sum + m.importance, 0) / memories.length 
    : 0;
  const categoryCounts = memories.reduce((counts, memory) => {
    counts[memory.category] = (counts[memory.category] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  const groupedByDate = memoryHelpers.groupByDate(memories);

  return {
    // State
    memories,
    stats,
    timeline,
    availableTags,
    isLoading,
    isSearching,
    error,
    currentFilter,

    // Actions
    loadMemories,
    searchMemories,
    getByCategory,
    getByTag,
    getImportantMemories,
    loadTags,
    loadTimeline,
    loadStats,
    applyFilter,
    clearFilter,
    refresh,
    clearError,
    startPolling,
    stopPolling,

    // Utilities
    getRelatedMemories,
    filteredMemories,

    // Computed values
    memoryCount,
    averageImportance,
    categoryCounts,
    groupedByDate,
    hasError: !!error,
    hasMemories: memories.length > 0,
    isActive: !isLoading && !error,
  };
}

export default useEnhancedMemory;