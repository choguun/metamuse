'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { type MuseData } from '@/types';
import { PERSONALITY_COLORS, API_BASE_URL } from '@/constants';
import { MuseAvatar } from '@/components/avatars/MuseAvatar';
import { ThemedContainer } from '@/components/ui/themed/ThemedContainer';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';

interface ExploreFilters {
  sortBy: 'newest' | 'interactions' | 'random';
  personalityFilter: 'all' | 'creative' | 'wise' | 'humorous' | 'empathetic';
}

// Separate component to avoid hook violations in map
function ExploreMuseCard({ muse, index, getPersonalityDescription }: { 
  muse: MuseData; 
  index: number; 
  getPersonalityDescription: (muse: MuseData) => any;
}) {
  const router = useRouter();
  const traits = {
    creativity: muse.creativity,
    wisdom: muse.wisdom,
    humor: muse.humor,
    empathy: muse.empathy,
  };
  const theme = usePersonalityTheme(traits);
  const dominant = getPersonalityDescription(muse);
  
  const handleViewDetails = () => {
    // Navigate to a details page
    router.push(`/muse/${muse.token_id}`);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <ThemedContainer
        traits={traits}
        variant="glass"
        intensity="normal"
        animated={true}
        interactive={true}
        className="overflow-hidden group hover:scale-[1.02] transition-transform duration-200"
      >
        {/* Enhanced Muse Header */}
        <div className="relative pb-4">
          <div className="flex items-start justify-between mb-6">
            <MuseAvatar
              traits={traits}
              tokenId={muse.token_id}
              size="lg"
              interactive={true}
              showPersonality={true}
              showGlow={true}
            />
            <div className="text-right">
              <div className="text-sm text-gray-400">Interactions</div>
              <div className="text-lg font-semibold text-white">{muse.total_interactions}</div>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white mb-2">
              Muse #{muse.token_id}
            </h3>
            <p className="text-gray-300 text-sm mb-2">
              {theme.description}
            </p>
            <p className="text-gray-400 text-xs">
              {theme.name} • By {muse.owner.slice(0, 6)}...{muse.owner.slice(-4)}
            </p>
          </div>
        </div>

        {/* Enhanced Personality Bars */}
        <div className="space-y-4 mb-6">
          {[
            { name: 'Creativity', value: muse.creativity, color: theme.gradient[0] || theme.primary },
            { name: 'Wisdom', value: muse.wisdom, color: theme.gradient[1] || theme.secondary },
            { name: 'Humor', value: muse.humor, color: theme.gradient[2] || theme.accent },
            { name: 'Empathy', value: muse.empathy, color: theme.gradient[3] || theme.primary },
          ].map((trait, traitIndex) => (
            <motion.div 
              key={trait.name} 
              className="flex items-center justify-between"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + traitIndex * 0.05 }}
            >
              <span className="text-sm text-gray-300 font-medium">{trait.name}</span>
              <div className="flex items-center space-x-3">
                <div className="w-24 h-2 bg-gray-700/50 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-full relative"
                    style={{
                      backgroundColor: trait.color,
                      background: `linear-gradient(90deg, ${trait.color}80, ${trait.color})`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${trait.value}%` }}
                    transition={{ delay: index * 0.1 + traitIndex * 0.1 + 0.5, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span 
                  className="text-sm font-bold w-8 text-center"
                  style={{ color: trait.color }}
                >
                  {trait.value}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Actions */}
        <div className="flex space-x-3">
          <Link
            href={`/chat/${muse.token_id}`}
            className="flex-1 text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 text-white"
            style={{
              background: theme.getGradientBackground(),
              boxShadow: `0 4px 12px ${theme.getPrimaryWithOpacity(0.3)}`,
            }}
          >
            💬 Chat
          </Link>
          <button 
            onClick={handleViewDetails}
            className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 border text-gray-300 hover:text-white cursor-pointer"
            style={{
              borderColor: theme.primary,
              color: theme.primary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.getPrimaryWithOpacity(0.1);
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.primary;
            }}
          >
            👁️ View Details
          </button>
        </div>
      </ThemedContainer>
    </motion.div>
  );
}

export default function Explore() {
  const [muses, setMuses] = useState<MuseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExploreFilters>({
    sortBy: 'newest',
    personalityFilter: 'all',
  });

  useEffect(() => {
    fetchPublicMuses();
  }, [filters]);

  const fetchPublicMuses = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        sort_by: filters.sortBy,
        personality_filter: filters.personalityFilter,
        limit: '12',
      });
      
      const response = await fetch(`${API_BASE_URL}/api/v1/muses/explore?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch muses');
      }
      
      const data = await response.json();
      setMuses(data.muses || []);
    } catch (err) {
      setError('Failed to load muses');
      console.error('Error fetching muses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonalityDescription = (muse: MuseData) => {
    const traits = [
      { name: 'Creative', value: muse.creativity, color: PERSONALITY_COLORS.creativity },
      { name: 'Wise', value: muse.wisdom, color: PERSONALITY_COLORS.wisdom },
      { name: 'Humorous', value: muse.humor, color: PERSONALITY_COLORS.humor },
      { name: 'Empathetic', value: muse.empathy, color: PERSONALITY_COLORS.empathy },
    ];
    
    const dominant = traits.reduce((prev, current) => 
      current.value > prev.value ? current : prev
    );
    
    return dominant;
  };

  const generateMockMuses = (): MuseData[] => {
    // Generate some mock data for demonstration
    const mockMuses: MuseData[] = [
      {
        token_id: '1',
        creativity: 85,
        wisdom: 60,
        humor: 75,
        empathy: 45,
        dna_hash: '0x123...',
        birth_block: 12345,
        total_interactions: 142,
        owner: '0xabc...',
      },
      {
        token_id: '2',
        creativity: 30,
        wisdom: 95,
        humor: 40,
        empathy: 80,
        dna_hash: '0x456...',
        birth_block: 12350,
        total_interactions: 89,
        owner: '0xdef...',
      },
      {
        token_id: '3',
        creativity: 70,
        wisdom: 55,
        humor: 90,
        empathy: 65,
        dna_hash: '0x789...',
        birth_block: 12360,
        total_interactions: 203,
        owner: '0xghi...',
      },
      {
        token_id: '4',
        creativity: 45,
        wisdom: 70,
        humor: 35,
        empathy: 95,
        dna_hash: '0xabc...',
        birth_block: 12365,
        total_interactions: 67,
        owner: '0xjkl...',
      },
      {
        token_id: '5',
        creativity: 90,
        wisdom: 40,
        humor: 80,
        empathy: 55,
        dna_hash: '0xdef...',
        birth_block: 12370,
        total_interactions: 156,
        owner: '0xmno...',
      },
      {
        token_id: '6',
        creativity: 55,
        wisdom: 85,
        humor: 60,
        empathy: 75,
        dna_hash: '0xghi...',
        birth_block: 12375,
        total_interactions: 94,
        owner: '0xpqr...',
      },
    ];
    return mockMuses;
  };

  // Use mock data if API fails
  const displayMuses = muses.length > 0 ? muses : generateMockMuses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Explore Muses
          </motion.h1>
          <motion.p
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Discover unique AI companions created by the community
          </motion.p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Sort By */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="newest">Newest</option>
                  <option value="interactions">Most Interactions</option>
                  <option value="random">Random</option>
                </select>
              </div>

              {/* Personality Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Personality</label>
                <select
                  value={filters.personalityFilter}
                  onChange={(e) => setFilters(prev => ({ ...prev, personalityFilter: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Personalities</option>
                  <option value="creative">Highly Creative</option>
                  <option value="wise">Highly Wise</option>
                  <option value="humorous">Highly Humorous</option>
                  <option value="empathetic">Highly Empathetic</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Discovering muses...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-amber-400 mb-4">⚠️ {error}</div>
            <p className="text-gray-400 mb-6">Showing sample muses for demonstration</p>
          </div>
        ) : null}

        {/* Enhanced Muses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayMuses.map((muse, index) => (
            <ExploreMuseCard key={muse.token_id} muse={muse} index={index} getPersonalityDescription={getPersonalityDescription} />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <motion.div
            className="bg-gradient-to-r from-purple-800/30 to-blue-800/30 rounded-2xl p-8 border border-gray-700"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Create Your Own?
            </h2>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Join the community and create your unique AI companion with customizable personality traits.
            </p>
            <Link
              href="/create"
              className="inline-block bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105"
            >
              Create Your Muse
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}