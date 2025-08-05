'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { type MuseData } from '@/types';
import { PERSONALITY_COLORS } from '@/constants';
import { MuseAvatar } from '@/components/avatars/MuseAvatar';
import { ThemedContainer } from '@/components/ui/themed/ThemedContainer';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { api, APIError, apiHelpers } from '@/lib/api';

// Separate component to avoid hook violations in map
function MuseCard({ muse, index, getPersonalityDescription }: { 
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
    // Navigate to a details page or show detailed info
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
        {/* Muse Header */}
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
              {theme.name} • Born at block {muse.birth_block}
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
                  {/* Glow effect for high values */}
                  {trait.value > 70 && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${trait.color}40, transparent)`,
                        boxShadow: `0 0 8px ${trait.color}60`,
                      }}
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
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
            ⚙️ Details
          </button>
        </div>
      </ThemedContainer>
    </motion.div>
  );
}

export default function Gallery() {
  const { isConnected, address } = useAccount();
  const [muses, setMuses] = useState<MuseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApiAndFetchMuses = async () => {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }

      // Check API health first
      const isHealthy = await apiHelpers.isHealthy();
      if (!isHealthy) {
        setError('Backend service is not available. Please ensure the API server is running.');
        setIsLoading(false);
        return;
      }

      // API is healthy, fetch muses
      await fetchUserMuses();
    };

    checkApiAndFetchMuses();
  }, [isConnected, address]);

  const fetchUserMuses = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Fetching muses for address:', address);
      
      // Use the proper API client with retry logic
      const data = await apiHelpers.retryRequest(
        () => api.muses.getByOwner(address),
        3, // max retries
        1000 // base delay ms
      );
      
      console.log('✅ Successfully fetched user muses:', data);
      setMuses(data.muses || []);
      
    } catch (err) {
      console.error('❌ Error fetching muses:', err);
      
      // Provide more specific error messages
      if (err instanceof APIError) {
        if (err.status === 0) {
          setError('Unable to connect to server. Please check if the backend is running.');
        } else if (err.status >= 500) {
          setError('Server error occurred. Please try again later.');
        } else {
          setError(`Failed to load muses: ${err.message}`);
        }
      } else {
        setError('Failed to load your muses. Please try again.');
      }
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
            <div className="w-16 h-16 bg-red-800/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Connection Error</h3>
            <div className="text-red-400 mb-6 max-w-md mx-auto">{error}</div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchUserMuses}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Try Again
              </button>
              <button
                onClick={async () => {
                  setError(null);
                  const isHealthy = await apiHelpers.isHealthy();
                  if (isHealthy) {
                    setError('✅ API connection is working. Try fetching muses again.');
                  } else {
                    setError('❌ API server is not responding. Please check if the backend is running.');
                  }
                }}
                className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Check Connection
              </button>
            </div>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-4">No Muses in Your Collection</h2>
            <div className="text-gray-400 mb-8 max-w-2xl mx-auto space-y-3">
              <p>
                You haven't created any AI companions yet. Create your first Muse to get started!
              </p>
              <div className="text-sm bg-blue-900/20 border border-blue-800/30 rounded-lg p-4 mx-auto max-w-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold text-blue-300 mb-1">How it works:</div>
                    <div className="text-blue-200">
                      Each Muse is a unique NFT with personality traits stored on the blockchain. 
                      Create one with custom traits, then chat and build memories together!
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/create"
                className="inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Muse
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center border border-purple-500 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Explore Community Muses
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {muses.map((muse, index) => (
              <MuseCard key={muse.token_id} muse={muse} index={index} getPersonalityDescription={getPersonalityDescription} />
            ))}
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