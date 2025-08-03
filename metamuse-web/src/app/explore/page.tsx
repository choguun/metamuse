'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { type MuseData } from '@/types';
import { PERSONALITY_COLORS } from '@/constants';

interface ExploreFilters {
  sortBy: 'newest' | 'interactions' | 'random';
  personalityFilter: 'all' | 'creative' | 'wise' | 'humorous' | 'empathetic';
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
      
      const response = await fetch(`/api/v1/muses/explore?${params}`);
      
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

        {/* Muses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayMuses.map((muse, index) => {
            const dominant = getPersonalityDescription(muse);
            return (
              <motion.div
                key={muse.token_id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all duration-200 overflow-hidden group"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Muse Header */}
                <div className="relative p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: dominant.color }}
                    >
                      #{muse.token_id}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Interactions</div>
                      <div className="text-lg font-semibold text-white">{muse.total_interactions}</div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Muse #{muse.token_id}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Primarily {dominant.name.toLowerCase()} • By {muse.owner.slice(0, 6)}...{muse.owner.slice(-4)}
                  </p>
                </div>

                {/* Personality Bars */}
                <div className="px-6 pb-4">
                  <div className="space-y-3">
                    {[
                      { name: 'Creativity', value: muse.creativity, color: PERSONALITY_COLORS.creativity },
                      { name: 'Wisdom', value: muse.wisdom, color: PERSONALITY_COLORS.wisdom },
                      { name: 'Humor', value: muse.humor, color: PERSONALITY_COLORS.humor },
                      { name: 'Empathy', value: muse.empathy, color: PERSONALITY_COLORS.empathy },
                    ].map((trait) => (
                      <div key={trait.name} className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{trait.name}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-300"
                              style={{
                                width: `${trait.value}%`,
                                backgroundColor: trait.color,
                              }}
                            />
                          </div>
                          <span className="text-xs text-white w-6">{trait.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6">
                  <div className="flex space-x-3">
                    <Link
                      href={`/chat/${muse.token_id}`}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium text-center transition-all duration-200"
                    >
                      Chat
                    </Link>
                    <button className="flex-1 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200">
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
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