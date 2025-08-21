'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import MemoryViewer from '@/components/memory/PolyMemoryViewer';
import useEnhancedMemory from '@/hook/useEnhancedMemory';
import { memoryHelpers } from '@/lib/api-memory-enhanced';

export default function MemoryPage() {
  const params = useParams();
  const museId = params.museId as string;
  const { isConnected } = useAccount();
  const [showInsights, setShowInsights] = useState(false);
  
  const {
    stats,
    memories,
    isLoading,
    error,
    refresh,
  } = useEnhancedMemory(museId, { autoLoad: isConnected });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">🧠</div>
          <h1 className="text-3xl font-bold text-white mb-4">Memory Explorer</h1>
          <p className="text-gray-400 mb-8">Connect your wallet to explore AI companion memories.</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">#{museId}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Memory Explorer</h1>
                <p className="text-gray-400">Muse #{museId} • AI Companion Memories</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowInsights(!showInsights)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showInsights 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {showInsights ? 'Hide' : 'Show'} Insights
              </button>
              
              <button
                onClick={refresh}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Memory Insights Sidebar */}
          <motion.div
            initial={false}
            animate={{ 
              width: showInsights ? 'auto' : 0,
              opacity: showInsights ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className={`lg:col-span-1 ${showInsights ? 'block' : 'hidden lg:block'}`}
          >
            <MemoryInsights museId={museId} stats={stats} memories={memories} />
          </motion.div>

          {/* Main Memory Viewer */}
          <div className={`${showInsights ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <MemoryViewer museId={museId} className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Memory Insights Component
function MemoryInsights({ 
  museId, 
  stats, 
  memories 
}: { 
  museId: string;
  stats: any;
  memories: any[];
}) {
  if (!stats || memories.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Memory Insights</h3>
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">🧠</div>
          <p className="text-sm">No memories to analyze yet</p>
        </div>
      </div>
    );
  }

  // Calculate additional insights
  const recentMemories = memories.slice(0, 10);
  const highImportanceMemories = memories.filter(m => m.importance > 0.7);
  const emotionalMemories = memories.filter(m => m.category === 'emotional');
  const learningMemories = memories.filter(m => m.category === 'learning');
  
  // Most common tags
  const tagFrequency = memories.reduce((acc, memory) => {
    memory.tags.forEach((tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const topTags = Object.entries(tagFrequency)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5);

  // Emotional analysis
  const emotionalDistribution = memories.reduce((acc, memory) => {
    if (memory.emotional_tone?.emotions) {
      memory.emotional_tone.emotions.forEach(([emotion, intensity]: [string, number]) => {
        acc[emotion] = Math.max(acc[emotion] || 0, intensity);
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const topEmotions = Object.entries(emotionalDistribution)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Overview</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Memories</span>
            <span className="text-white font-medium">{stats.total_memories}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Avg Importance</span>
            <span className="text-white font-medium">{stats.average_importance.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">High Priority</span>
            <span className="text-white font-medium">{highImportanceMemories.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Recent Activity</span>
            <span className="text-white font-medium">{recentMemories.length} this week</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
        <div className="space-y-3">
          {Object.entries(stats.category_breakdown).map(([category, count]) => {
            const percentage = ((count as number) / stats.total_memories) * 100;
            const color = memoryHelpers.getCategoryColor(category as any);
            const icon = memoryHelpers.getCategoryIcon(category as any);
            
            return (
              <div key={category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-2 text-gray-300">
                    <span>{icon}</span>
                    <span className="capitalize">{category.replace('_', ' ')}</span>
                  </span>
                  <span className="text-gray-400">{count as number}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: color 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Tags */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {topTags.map(([tag, count]) => (
            <span
              key={tag}
              className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500/30"
            >
              #{tag} ({count as number})
            </span>
          ))}
        </div>
      </div>

      {/* Emotional Analysis */}
      {topEmotions.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Emotional Insights</h3>
          <div className="space-y-3">
            {topEmotions.map(([emotion, intensity]) => (
              <div key={emotion} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 capitalize">{emotion}</span>
                  <span className="text-gray-400">{((intensity as number) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                    style={{ width: `${(intensity as number) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory Health */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Memory Health</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Learning Progress</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${(learningMemories.length / memories.length) * 100}%` }}
                />
              </div>
              <span className="text-white text-sm">{learningMemories.length}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Emotional Depth</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-pink-500"
                  style={{ width: `${(emotionalMemories.length / memories.length) * 100}%` }}
                />
              </div>
              <span className="text-white text-sm">{emotionalMemories.length}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Critical Memories</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-red-500"
                  style={{ width: `${(highImportanceMemories.length / memories.length) * 100}%` }}
                />
              </div>
              <span className="text-white text-sm">{highImportanceMemories.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors">
            🔍 Search Important Memories
          </button>
          <button className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors">
            📊 Export Memory Data
          </button>
          <button className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors">
            🧹 Memory Cleanup
          </button>
          <button className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors">
            📈 Memory Analytics
          </button>
        </div>
      </div>
    </div>
  );
}