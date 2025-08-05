'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { MuseTraits } from '@/types';

interface MemoryResult {
  id: string;
  content: string;
  relevanceScore: number;
  timestamp: Date;
  context: string;
  ipfsHash: string;
  emotions?: string[];
  tags?: string[];
  type: 'conversation' | 'experience' | 'knowledge' | 'preference';
  importance: number;
}

interface SemanticMemoryPanelProps {
  query: string;
  memories: MemoryResult[];
  traits: MuseTraits;
  isLoading: boolean;
  isVisible: boolean;
  onToggle: () => void;
  onMemorySelect: (memory: MemoryResult) => void;
  onMemoryPin?: (memoryId: string) => void;
}

export function SemanticMemoryPanel({ 
  query, 
  memories, 
  traits,
  isLoading, 
  isVisible,
  onToggle,
  onMemorySelect,
  onMemoryPin
}: SemanticMemoryPanelProps) {
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'recency' | 'importance'>('relevance');
  const [filterType, setFilterType] = useState<'all' | MemoryResult['type']>('all');
  const theme = usePersonalityTheme(traits);

  const getMemoryTypeIcon = (type: MemoryResult['type']) => {
    switch (type) {
      case 'conversation':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'experience':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'knowledge':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'preference':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
    }
  };

  const getMemoryTypeColor = (type: MemoryResult['type']) => {
    switch (type) {
      case 'conversation': return theme.gradient[0] || '#3b82f6';
      case 'experience': return theme.gradient[1] || '#8b5cf6';
      case 'knowledge': return theme.gradient[2] || '#f59e0b';
      case 'preference': return theme.gradient[3] || '#10b981';
      default: return theme.primary;
    }
  };

  const getSortedAndFilteredMemories = () => {
    let filtered = memories;
    
    if (filterType !== 'all') {
      filtered = memories.filter(memory => memory.type === filterType);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        case 'recency':
          const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
          const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
          return bTime - aTime;
        case 'importance':
          return b.importance - a.importance;
        default:
          return 0;
      }
    });
  };

  const handleMemoryClick = (memory: MemoryResult) => {
    setSelectedMemory(selectedMemory === memory.id ? null : memory.id);
    onMemorySelect(memory);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className="flex items-center space-x-3 text-sm text-gray-400 hover:text-white transition-colors mb-3 p-2 rounded-lg hover:bg-gray-800/50 w-full"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <motion.div
          animate={{ rotate: isVisible ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
        
        <div className="flex items-center space-x-2 flex-1">
          <motion.div
            animate={{ 
              background: isLoading 
                ? `conic-gradient(from 0deg, ${theme.primary}, ${theme.secondary}, ${theme.accent}, ${theme.primary})`
                : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
            }}
            transition={{ duration: 2, repeat: isLoading ? Infinity : 0 }}
            className="w-3 h-3 rounded-full"
          />
          <span className="font-medium">Semantic Memory</span>
          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">
            {memories.length} memories
          </span>
        </div>
        
        {isLoading && (
          <motion.div
            className="text-xs text-blue-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Searching...
          </motion.div>
        )}
      </motion.button>

      {/* Memory Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="border border-gray-700/50 rounded-xl p-4 space-y-4"
            style={{ 
              background: `linear-gradient(135deg, ${theme.getPrimaryWithOpacity(0.08)}, ${theme.getSecondaryWithOpacity(0.05)})`,
              backdropFilter: 'blur(10px)',
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Search Query Display */}
            {query && (
              <motion.div
                className="flex items-center space-x-2 p-3 rounded-lg border border-gray-700/30"
                style={{ backgroundColor: `${theme.primary}10` }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-gray-300 text-sm">Searching for:</span>
                <span className="text-white font-medium">"{query}"</span>
              </motion.div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between space-x-4">
              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="relevance">Relevance</option>
                  <option value="recency">Recent</option>
                  <option value="importance">Importance</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="all">All</option>
                  <option value="conversation">Conversation</option>
                  <option value="experience">Experience</option>
                  <option value="knowledge">Knowledge</option>
                  <option value="preference">Preference</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <motion.div
                    className="w-12 h-12 border-4 border-transparent rounded-full mx-auto mb-4"
                    style={{ 
                      borderTopColor: theme.primary,
                      borderRightColor: theme.secondary,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className="text-gray-400 text-sm">Searching memory networks...</p>
                  <p className="text-gray-500 text-xs mt-1">Analyzing {memories.length} memory fragments</p>
                </div>
              </div>
            ) : (
              /* Memory Results */
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {getSortedAndFilteredMemories().map((memory, index) => (
                    <motion.div
                      key={memory.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedMemory === memory.id
                          ? 'border-opacity-60 shadow-lg'
                          : 'border-gray-600/30 hover:border-gray-500/50'
                      }`}
                      style={{
                        backgroundColor: selectedMemory === memory.id 
                          ? `${getMemoryTypeColor(memory.type)}20` 
                          : `${getMemoryTypeColor(memory.type)}08`,
                        borderColor: selectedMemory === memory.id
                          ? getMemoryTypeColor(memory.type)
                          : undefined,
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleMemoryClick(memory)}
                      whileHover={{ scale: 1.01 }}
                    >
                      {/* Memory Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {/* Type Icon */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ 
                              backgroundColor: `${getMemoryTypeColor(memory.type)}30`,
                              color: getMemoryTypeColor(memory.type),
                            }}
                          >
                            {getMemoryTypeIcon(memory.type)}
                          </div>
                          
                          {/* Memory Type & Timestamp */}
                          <div>
                            <div className="text-xs font-medium capitalize" style={{ color: getMemoryTypeColor(memory.type) }}>
                              {memory.type}
                            </div>
                            <div className="text-xs text-gray-400">
                              {memory.timestamp instanceof Date 
                                ? memory.timestamp.toLocaleDateString() 
                                : new Date(memory.timestamp).toLocaleDateString()
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* Relevance Score */}
                        <div className="flex items-center space-x-2">
                          {/* Relevance Circle */}
                          <div className="relative w-10 h-10">
                            <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-gray-600"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <motion.path
                                stroke={getMemoryTypeColor(memory.type)}
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${memory.relevanceScore}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                initial={{ strokeDasharray: "0, 100" }}
                                animate={{ strokeDasharray: `${memory.relevanceScore}, 100` }}
                                transition={{ delay: index * 0.05 + 0.3, duration: 0.8 }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {Math.round(memory.relevanceScore)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-col space-y-1">
                            {onMemoryPin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMemoryPin(memory.id);
                                }}
                                className="text-gray-400 hover:text-yellow-400 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Memory Content Preview */}
                      <p className="text-gray-200 text-sm line-clamp-3 mb-3 leading-relaxed">
                        {memory.content}
                      </p>
                      
                      {/* Memory Metadata */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-4">
                          {/* Context */}
                          <div className="text-gray-400">
                            Context: <span className="text-gray-300">{memory.context}</span>
                          </div>
                          
                          {/* Importance */}
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-400">Importance:</span>
                            <div className="flex space-x-0.5">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    i < Math.floor(memory.importance / 20) 
                                      ? 'bg-yellow-400' 
                                      : 'bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* IPFS Hash */}
                        <div className="flex items-center space-x-1 text-blue-400 font-mono">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span>{memory.ipfsHash.slice(0, 8)}...</span>
                        </div>
                      </div>
                      
                      {/* Tags & Emotions */}
                      {(memory.tags || memory.emotions) && (
                        <div className="mt-3 pt-3 border-t border-gray-700/30">
                          <div className="flex flex-wrap gap-2">
                            {memory.emotions?.map((emotion, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded-full text-xs"
                                style={{
                                  backgroundColor: `${getMemoryTypeColor(memory.type)}20`,
                                  color: getMemoryTypeColor(memory.type),
                                }}
                              >
                                😊 {emotion}
                              </span>
                            ))}
                            {memory.tags?.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* No Results */}
                {getSortedAndFilteredMemories().length === 0 && !isLoading && (
                  <motion.div
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-gray-400">No memories found matching your query</p>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Summary Stats */}
            {!isLoading && memories.length > 0 && (
              <motion.div
                className="pt-4 border-t border-gray-700/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="grid grid-cols-4 gap-4 text-center text-xs">
                  <div>
                    <div className="text-gray-400">Total</div>
                    <div className="text-white font-semibold">{memories.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Avg Relevance</div>
                    <div 
                      className="font-semibold"
                      style={{ color: theme.primary }}
                    >
                      {Math.round(memories.reduce((acc, m) => acc + m.relevanceScore, 0) / memories.length)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">High Relevance</div>
                    <div className="text-white font-semibold">
                      {memories.filter(m => m.relevanceScore > 80).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">IPFS Stored</div>
                    <div className="text-blue-400 font-semibold">
                      {memories.filter(m => m.ipfsHash).length}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}