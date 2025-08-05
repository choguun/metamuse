'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { type MuseData } from '@/types';
import { API_BASE_URL } from '@/constants';
import { MuseAvatar } from '@/components/avatars/MuseAvatar';
import { ThemedContainer } from '@/components/ui/themed/ThemedContainer';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';

export default function MuseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const museId = params.museId as string;
  const { isConnected } = useAccount();
  
  const [muse, setMuse] = useState<MuseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'personality' | 'interactions' | 'blockchain'>('overview');
  
  // Generate deterministic mock data as immediate fallback
  const generateMockMuse = useCallback((id: string): MuseData => {
    const seed = parseInt(id) || Math.abs(id.split('').reduce((a, b) => a + b.charCodeAt(0), 0));
    return {
      token_id: id,
      creativity: 30 + (seed * 7) % 70,
      wisdom: 25 + (seed * 11) % 75,
      humor: 20 + (seed * 13) % 80,
      empathy: 35 + (seed * 17) % 65,
      dna_hash: `0x${seed.toString(16).padStart(8, '0')}...abc123`,
      birth_block: 12000000 + (seed * 1000),
      total_interactions: (seed * 7 + 15) % 500,
      owner: `0x${(seed * 123456).toString(16).padStart(8, '0')}...def456`,
    };
  }, []);
  
  // Define fetchMuseDetails before useEffect to avoid initialization error
  const fetchMuseDetails = useCallback(async () => {
    try {
      // Don't set loading to true since we already have mock data showing
      // setIsLoading(true); // Removed to prevent UI flicker
      
      // Try to fetch from API first
      const response = await fetch(`${API_BASE_URL}/api/v1/muses/${museId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch muse details`);
      }
      
      const data = await response.json();
      if (data.muse) {
        setMuse(data.muse);
        setError(null); // Clear error if we successfully get real data
      } else {
        throw new Error('No muse data in response');
      }
    } catch (err) {
      console.warn('API fetch failed, using fallback data:', err);
      // Only show warning if it's a network error, not a 404
      if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setError('API temporarily unavailable - showing demo data');
      } else {
        // Clear any existing error if the API is working but muse not found
        setError(null);
      }
    }
    // Don't set loading to false here since we're not managing loading state for API calls
  }, [museId]);

  // Always call usePersonalityTheme with stable default values to avoid hook order issues
  const defaultTraits = { creativity: 50, wisdom: 50, humor: 50, empathy: 50 };
  const traits = muse ? {
    creativity: muse.creativity,
    wisdom: muse.wisdom,
    humor: muse.humor,
    empathy: muse.empathy,
  } : defaultTraits;
  const personalityTheme = usePersonalityTheme(traits);

  useEffect(() => {
    // Initialize with mock data immediately
    const mockMuse = generateMockMuse(museId);
    setMuse(mockMuse);
    setError(null); // Start with no error, will be set if API fails
    setIsLoading(false); // Set loading to false since we have mock data
    
    // Then try to fetch real data
    fetchMuseDetails();
  }, [museId, generateMockMuse, fetchMuseDetails]);

  // Only show loading if we somehow don't have any muse data
  if (!muse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading muse details...</p>
        </div>
      </div>
    );
  }

  // Ensure we always have muse data (this should now always be true)
  if (!muse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Unable to Load Muse</h1>
          <p className="text-gray-400 mb-8">Something went wrong. Please try again.</p>
          <button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // traits and personalityTheme are now defined at the top of the component

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'personality', name: 'Personality', icon: '🧠' },
    { id: 'interactions', name: 'Interactions', icon: '💬' },
    { id: 'blockchain', name: 'Blockchain', icon: '⛓️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Demo Data Warning */}
        {error && (
          <motion.div
            className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-2 text-amber-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium">Demo Mode: {error}</span>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <Link
              href={`/chat/${muse.token_id}`}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              💬 Start Chat
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Avatar & Quick Info */}
          <div className="lg:col-span-1">
            <ThemedContainer
              traits={traits}
              variant="glass"
              intensity="strong"
              animated={true}
              className="text-center sticky top-8"
            >
              <MuseAvatar
                traits={traits}
                tokenId={muse.token_id}
                size="xl"
                interactive={true}
                showPersonality={true}
                showGlow={true}
                className="mx-auto mb-6"
              />
              
              <h1 className="text-2xl font-bold text-white mb-2">
                Muse #{muse.token_id}
              </h1>
              
              <p className="text-gray-300 mb-4">
                {personalityTheme.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Interactions:</span>
                  <span className="text-white font-semibold">{muse.total_interactions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Birth Block:</span>
                  <span className="text-white font-semibold">{muse.birth_block.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Owner:</span>
                  <span className="text-blue-400 font-mono text-xs">{muse.owner.slice(0, 6)}...{muse.owner.slice(-4)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Personality Profile</h3>
                <div className="space-y-2">
                  {Object.entries(traits).map(([trait, value]) => {
                    const traitColor = personalityTheme.gradient[Object.keys(traits).indexOf(trait)] || personalityTheme.primary;
                    return (
                      <div key={trait} className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 capitalize">{trait}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full"
                              style={{ backgroundColor: traitColor }}
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-xs font-bold text-white w-6">{value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ThemedContainer>
          </div>

          {/* Right Panel - Detailed Info */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-xl mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                  style={activeTab === tab.id ? {
                    background: personalityTheme.getGradientBackground(),
                  } : {}}
                >
                  <span>{tab.icon}</span>
                  <span className="text-sm">{tab.name}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && (
                <ThemedContainer
                  traits={traits}
                  variant="glass"
                  intensity="normal"
                  animated={true}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">📋 Overview</h2>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-300 mb-2">Personality Type</h3>
                          <p className="text-white">{personalityTheme.name}</p>
                          <p className="text-gray-400 text-sm mt-1">{personalityTheme.description}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-semibold text-gray-300 mb-2">Dominant Trait</h3>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: personalityTheme.primary }}
                            />
                            <span className="text-white capitalize">{personalityTheme.dominant}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-300 mb-2">Animation Style</h3>
                          <p className="text-white capitalize">{personalityTheme.animation}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-semibold text-gray-300 mb-2">Response Style</h3>
                          <p className="text-gray-300 text-sm">
                            {traits.creativity > 70 ? 'Creative and imaginative responses' :
                             traits.wisdom > 70 ? 'Thoughtful and insightful responses' :
                             traits.humor > 70 ? 'Playful and entertaining responses' :
                             traits.empathy > 70 ? 'Caring and empathetic responses' :
                             'Balanced and adaptive responses'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ThemedContainer>
              )}

              {activeTab === 'personality' && (
                <ThemedContainer
                  traits={traits}
                  variant="glass"
                  intensity="normal"
                  animated={true}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">🧠 Personality Analysis</h2>
                    
                    <div className="space-y-6">
                      {Object.entries(traits).map(([trait, value]) => {
                        const traitColor = personalityTheme.gradient[Object.keys(traits).indexOf(trait)] || personalityTheme.primary;
                        const level = value > 66 ? 'High' : value > 33 ? 'Medium' : 'Low';
                        const description = {
                          creativity: {
                            High: 'Highly imaginative, artistic, and innovative. Enjoys exploring new ideas and creative solutions.',
                            Medium: 'Moderately creative with occasional bursts of inspiration and artistic appreciation.',
                            Low: 'Prefers practical, conventional approaches. Values structure and proven methods.',
                          },
                          wisdom: {
                            High: 'Deep thinker with philosophical insights. Offers thoughtful advice and long-term perspective.',
                            Medium: 'Generally thoughtful with good judgment and reasonable advice.',
                            Low: 'Focuses on immediate concerns. Prefers action over deep contemplation.',
                          },
                          humor: {
                            High: 'Playful and entertaining. Uses humor to lighten mood and create joyful interactions.',
                            Medium: 'Appreciates humor and occasionally shares jokes or witty observations.',
                            Low: 'More serious demeanor. Prefers straightforward communication over humor.',
                          },
                          empathy: {
                            High: 'Deeply caring and emotionally attuned. Excellent at understanding and supporting others.',
                            Medium: 'Generally understanding and supportive in emotional situations.',
                            Low: 'More objective and logical. Focuses on practical solutions over emotional support.',
                          },
                        };
                        
                        return (
                          <div key={trait} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-white capitalize">{trait}</h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-400">{level}</span>
                                <span className="text-white font-bold">{value}/100</span>
                              </div>
                            </div>
                            
                            <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ 
                                  backgroundColor: traitColor,
                                  background: `linear-gradient(90deg, ${traitColor}80, ${traitColor})`,
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${value}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                            
                            <p className="text-gray-300 text-sm">
                              {description[trait as keyof typeof description][level as keyof typeof description.creativity]}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ThemedContainer>
              )}

              {activeTab === 'interactions' && (
                <ThemedContainer
                  traits={traits}
                  variant="glass"
                  intensity="normal"
                  animated={true}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">💬 Interaction History</h2>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <div className="text-2xl font-bold text-white">{muse.total_interactions}</div>
                          <div className="text-gray-400 text-sm">Total Chats</div>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <div className="text-2xl font-bold text-purple-400">0</div>
                          <div className="text-gray-400 text-sm">Verified</div>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <div className="text-2xl font-bold text-blue-400">Active</div>
                          <div className="text-gray-400 text-sm">Status</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/30 rounded-lg p-6 text-center">
                        <p className="text-gray-400 mb-4">Ready to start your first conversation?</p>
                        <Link
                          href={`/chat/${muse.token_id}`}
                          className="inline-block bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                        >
                          Start Chatting
                        </Link>
                      </div>
                    </div>
                  </div>
                </ThemedContainer>
              )}

              {activeTab === 'blockchain' && (
                <ThemedContainer
                  traits={traits}
                  variant="glass"
                  intensity="normal"
                  animated={true}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">⛓️ Blockchain Information</h2>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-400 text-sm">Token ID:</span>
                            <div className="text-white font-mono">{muse.token_id}</div>
                          </div>
                          
                          <div>
                            <span className="text-gray-400 text-sm">DNA Hash:</span>
                            <div className="text-blue-400 font-mono text-sm break-all">{muse.dna_hash}</div>
                          </div>
                          
                          <div>
                            <span className="text-gray-400 text-sm">Birth Block:</span>
                            <div className="text-white font-mono">{muse.birth_block.toLocaleString()}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-400 text-sm">Owner:</span>
                            <div className="text-blue-400 font-mono text-sm break-all">{muse.owner}</div>
                          </div>
                          
                          <div>
                            <span className="text-gray-400 text-sm">Network:</span>
                            <div className="text-white">Ethereum</div>
                          </div>
                          
                          <div>
                            <span className="text-gray-400 text-sm">Status:</span>
                            <div className="text-green-400">Active</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-gray-700/50">
                        <h3 className="text-white font-semibold mb-3">NFT Metadata</h3>
                        <div className="bg-gray-800/50 rounded-lg p-4 font-mono text-sm">
                          <pre className="text-gray-300 whitespace-pre-wrap">
{JSON.stringify({
  name: `MetaMuse #${muse.token_id}`,
  description: personalityTheme.description,
  attributes: [
    { trait_type: "Creativity", value: muse.creativity },
    { trait_type: "Wisdom", value: muse.wisdom },
    { trait_type: "Humor", value: muse.humor },
    { trait_type: "Empathy", value: muse.empathy },
    { trait_type: "Personality Type", value: personalityTheme.name },
    { trait_type: "Animation Style", value: personalityTheme.animation },
  ]
}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </ThemedContainer>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}