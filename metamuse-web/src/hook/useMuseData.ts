import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { api, apiHelpers } from '@/lib/api';
import { type MuseData } from '@/types';

export interface MuseStats {
  total_interactions: number;
  verified_interactions: number;
  last_interaction: string;
  memory_entries: number;
  active_plugins: number;
}

export interface UseMuseDataOptions {
  autoLoad?: boolean;
  includeStats?: boolean;
  refreshInterval?: number;
}

export function useMuseData(tokenId: string, options: UseMuseDataOptions = {}) {
  const { address } = useAccount();
  const {
    autoLoad = true,
    includeStats = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  // State
  const [muse, setMuse] = useState<MuseData | null>(null);
  const [stats, setStats] = useState<MuseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load muse data
  const loadMuse = useCallback(async (showLoading = true) => {
    if (!tokenId) return;

    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    
    setError(null);

    try {
      const museData = await api.muses.getById(tokenId);
      setMuse(museData);

      // Load stats if requested
      if (includeStats) {
        try {
          const statsData = await api.muses.getStats(tokenId);
          setStats(statsData);
        } catch (statsError) {
          console.warn('Failed to load muse stats:', statsError);
          // Don't fail the entire operation if stats fail
        }
      }
    } catch (err) {
      const errorMessage = apiHelpers.formatError(err);
      setError(errorMessage);
      console.error('Failed to load muse data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tokenId, includeStats]);

  // Refresh muse data (without loading state)
  const refresh = useCallback(() => {
    loadMuse(false);
  }, [loadMuse]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && tokenId) {
      loadMuse();
    }
  }, [autoLoad, tokenId, loadMuse]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || !muse) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval, muse]);

  // Computed values
  const isOwner = address && muse ? muse.owner.toLowerCase() === address.toLowerCase() : false;
  const dominantTrait = muse ? Math.max(muse.creativity, muse.wisdom, muse.humor, muse.empathy) : 0;
  const dominantTraitName = muse 
    ? muse.creativity === dominantTrait ? 'Creative'
    : muse.wisdom === dominantTrait ? 'Wise'
    : muse.humor === dominantTrait ? 'Humorous'
    : 'Empathetic'
    : '';

  return {
    // Data
    muse,
    stats,
    
    // State
    isLoading,
    isRefreshing,
    error,
    
    // Actions
    loadMuse,
    refresh,
    clearError,
    
    // Computed
    isOwner,
    dominantTrait,
    dominantTraitName,
    hasError: !!error,
    exists: !!muse,
  };
}

// Hook for loading multiple muses (for gallery/explore)
export function useMuseList(type: 'owned' | 'all' = 'all', ownerAddress?: string) {
  const { address } = useAccount();
  
  // State
  const [muses, setMuses] = useState<MuseData[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load muses
  const loadMuses = useCallback(async (
    params: {
      limit?: number;
      offset?: number;
      sort?: 'recent' | 'popular' | 'interactions';
      append?: boolean;
    } = {}
  ) => {
    const { limit = 20, offset = 0, sort = 'recent', append = false } = params;
    
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    
    setError(null);

    try {
      let response;
      
      if (type === 'owned' && (ownerAddress || address)) {
        response = await api.muses.getByOwner(ownerAddress || address!);
      } else {
        response = await api.muses.getAll({ limit, offset, sort });
      }

      if (append) {
        setMuses(prev => [...prev, ...response.muses]);
      } else {
        setMuses(response.muses);
      }
      
      setTotal(response.total);
      setHasMore('has_more' in response ? Boolean(response.has_more) : response.muses.length === limit);
      
    } catch (err) {
      const errorMessage = apiHelpers.formatError(err);
      setError(errorMessage);
      console.error('Failed to load muses:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [type, ownerAddress, address]);

  // Load more muses (pagination)
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    loadMuses({
      offset: muses.length,
      append: true,
    });
  }, [loadMuses, muses.length, hasMore, isLoadingMore]);

  // Refresh muse list
  const refresh = useCallback(() => {
    loadMuses();
  }, [loadMuses]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (type === 'owned' && !ownerAddress && !address) return;
    loadMuses();
  }, [type, ownerAddress, address, loadMuses]);

  return {
    // Data
    muses,
    total,
    hasMore,
    
    // State
    isLoading,
    isLoadingMore,
    error,
    
    // Actions
    loadMuses,
    loadMore,
    refresh,
    clearError,
    
    // Computed
    isEmpty: muses.length === 0 && !isLoading,
    hasError: !!error,
  };
}

export default useMuseData;