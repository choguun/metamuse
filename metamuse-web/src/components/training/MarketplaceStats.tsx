'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface MarketplaceStats {
  total_contributions: number;
  total_contributors: number;
  total_rewards_distributed: number;
  contributions_by_type: Record<string, number>;
  average_quality_score: number;
  active_contributors: number;
  quality_contributors: number;
}

interface ContributorProfile {
  address: string;
  total_contributions: number;
  total_dats_earned: number;
  average_quality_score: number;
  validations_passed: number;
  current_streak: number;
  last_contribution: string;
  quality_contributor_badge: boolean;
  specializations: string[];
  contribution_history: string[];
}

interface TrainingDataContribution {
  contribution_id: string;
  contributor_address: string;
  muse_token_id: number;
  contribution_type: number;
  timestamp: string;
  quality_score: number;
  reward_amount: number;
  validation_status: string;
}

const CONTRIBUTION_TYPE_NAMES = {
  1: 'Conversation Correction',
  2: 'Preference Feedback', 
  3: 'Quality Rating',
  4: 'Personality Tuning',
  5: 'Conversation Curation',
  6: 'Semantic Enhancement',
};

const CONTRIBUTION_TYPE_ICONS = {
  1: '✏️',
  2: '⭐',
  3: '📊',
  4: '🎭',
  5: '📚',
  6: '🧠',
};

export function MarketplaceStats() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [topContributors, setTopContributors] = useState<ContributorProfile[]>([]);
  const [recentContributions, setRecentContributions] = useState<TrainingDataContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.trainingData.getStats();
      setStats(response.stats);
      setTopContributors(response.top_contributors || []);
      setRecentContributions(response.recent_contributions || []);
    } catch (error) {
      console.error('Failed to load marketplace stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-white">Loading marketplace statistics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-8 text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-300 mb-2">Failed to Load Data</h3>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={loadMarketplaceData}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
          <p className="text-gray-400">
            Marketplace statistics will appear here once contributions are made.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center text-xl">
            📊
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Training Data Marketplace</h1>
            <p className="text-gray-400">
              Analytics and insights from the world's first decentralized AI training data economy
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-400 text-2xl">📚</span>
            <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded">Total</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.total_contributions.toLocaleString()}</div>
          <div className="text-sm text-blue-300">Contributions</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 text-2xl">👥</span>
            <span className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded">Active</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.total_contributors.toLocaleString()}</div>
          <div className="text-sm text-green-300">Contributors</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-400 text-2xl">🏆</span>
            <span className="text-xs text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded">DAT</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.total_rewards_distributed.toLocaleString()}</div>
          <div className="text-sm text-yellow-300">Tokens Distributed</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-400 text-2xl">⭐</span>
            <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded">Quality</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.average_quality_score.toFixed(1)}</div>
          <div className="text-sm text-purple-300">Avg Quality Score</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Contribution Types Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900 rounded-xl border border-gray-700 p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Contribution Types</h2>
          <div className="space-y-3">
            {Object.entries(stats.contributions_by_type).map(([type, count]) => {
              const typeNum = parseInt(type.replace('ContributionType::', ''));
              const typeName = CONTRIBUTION_TYPE_NAMES[typeNum as keyof typeof CONTRIBUTION_TYPE_NAMES] || type;
              const icon = CONTRIBUTION_TYPE_ICONS[typeNum as keyof typeof CONTRIBUTION_TYPE_ICONS] || '📝';
              const percentage = (count / stats.total_contributions) * 100;
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{icon}</span>
                    <span className="text-white font-medium">{typeName}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-sm w-12">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Community Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-900 rounded-xl border border-gray-700 p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Community Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-green-400 text-xl">👤</span>
                <span className="text-white">Active Contributors</span>
              </div>
              <span className="text-green-400 font-semibold">{stats.active_contributors}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-400 text-xl">🏅</span>
                <span className="text-white">Quality Contributors</span>
              </div>
              <span className="text-yellow-400 font-semibold">{stats.quality_contributors}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-blue-400 text-xl">📈</span>
                <span className="text-white">Quality Rate</span>
              </div>
              <span className="text-blue-400 font-semibold">
                {((stats.quality_contributors / stats.total_contributors) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Contributors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-900 rounded-xl border border-gray-700 p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Top Contributors</h2>
          {topContributors.length > 0 ? (
            <div className="space-y-3">
              {topContributors.slice(0, 10).map((contributor, index) => (
                <div key={contributor.address} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-500 text-black' :
                      'bg-gray-600 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium">{formatAddress(contributor.address)}</div>
                      <div className="text-xs text-gray-400">
                        {contributor.total_contributions} contributions
                        {contributor.quality_contributor_badge && (
                          <span className="ml-2 text-yellow-400">🏅</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">{contributor.total_dats_earned} DAT</div>
                    <div className="text-xs text-gray-400">
                      Quality: {contributor.average_quality_score.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">👑</div>
              <p className="text-gray-400">No contributors yet</p>
            </div>
          )}
        </motion.div>

        {/* Recent Contributions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gray-900 rounded-xl border border-gray-700 p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Recent Contributions</h2>
          {recentContributions.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentContributions.slice(0, 10).map((contribution) => {
                const typeName = CONTRIBUTION_TYPE_NAMES[contribution.contribution_type as keyof typeof CONTRIBUTION_TYPE_NAMES];
                const icon = CONTRIBUTION_TYPE_ICONS[contribution.contribution_type as keyof typeof CONTRIBUTION_TYPE_ICONS];
                
                return (
                  <div key={contribution.contribution_id} className="p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{icon}</span>
                        <span className="text-white text-sm font-medium">{typeName}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(contribution.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        By {formatAddress(contribution.contributor_address)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-400">
                          {Math.round(contribution.reward_amount / 1000)} DAT
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          contribution.validation_status === 'Validated' ? 'bg-green-500/20 text-green-300' :
                          contribution.validation_status === 'Rejected' ? 'bg-red-500/20 text-red-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {contribution.validation_status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📝</div>
              <p className="text-gray-400">No recent contributions</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}