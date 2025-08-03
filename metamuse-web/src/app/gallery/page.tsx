'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { type MuseData } from '@/types';
import { PERSONALITY_COLORS, API_BASE_URL } from '@/constants';

export default function Gallery() {
  const { isConnected, address } = useAccount();
  const [muses, setMuses] = useState<MuseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserMuses();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  const fetchUserMuses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/muses/owner/${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch muses');
      }
      
      const data = await response.json();
      setMuses(data.muses || []);
    } catch (err) {
      setError('Failed to load your muses');
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

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
        <div className="text-center max-w-md mx-auto px-4">
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-400 mb-8">
            Connect your wallet to view your AI companion collection.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

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
            Your Muse Collection
          </motion.h1>
          <motion.p
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Explore and interact with your AI companions
          </motion.p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your muses...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-red-400 mb-4">⚠️ {error}</div>
            <button
              onClick={fetchUserMuses}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        ) : muses.length === 0 ? (
          <div className="text-center py-20">
            <motion.div
              className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-4">No Muses Yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              You haven't created any AI companions yet. Start by creating your first Muse!
            </p>
            <Link
              href="/create"
              className="inline-block bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105"
            >
              Create Your First Muse
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {muses.map((muse, index) => {
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
                      Primarily {dominant.name.toLowerCase()} • Born at block {muse.birth_block}
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
                        Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create New Muse Button */}
        {muses.length > 0 && (
          <div className="text-center mt-12">
            <Link
              href="/create"
              className="inline-block bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105"
            >
              Create Another Muse
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}