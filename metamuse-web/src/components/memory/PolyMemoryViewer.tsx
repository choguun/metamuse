'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEnhancedMemory from '@/hook/useEnhancedMemory';
import { memoryHelpers, type MemoryCategory, type MemoryEntry } from '@/lib/api-memory-enhanced';

interface MemoryViewerProps {
  museId: string;
  className?: string;
}

export default function MemoryViewer({ museId, className = '' }: MemoryViewerProps) {
  const {
    memories,
    stats,
    availableTags,
    isLoading,
    error,
    currentFilter,
    searchMemories,
    getByCategory,
    getByTag,
    getImportantMemories,
    applyFilter,
    clearFilter,
    clearError,
    groupedByDate,
  } = useEnhancedMemory(museId);

  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'categories' | 'tags'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'semantic' | 'keyword'>('keyword');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [importanceFilter, setImportanceFilter] = useState(0);

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchMemories(query, searchType);
    } else {
      await clearFilter();
    }
  };

  // Handle category filter
  const handleCategoryFilter = async (category: MemoryCategory | null) => {
    setSelectedCategory(category);
    if (category) {
      await getByCategory(category);
    } else {
      await clearFilter();
    }
  };

  // Handle tag selection
  const handleTagToggle = async (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    
    if (newTags.length > 0) {
      await applyFilter({ tags: newTags });
    } else {
      await clearFilter();
    }
  };

  // Handle importance filter
  const handleImportanceFilter = async (minImportance: number) => {
    setImportanceFilter(minImportance);
    if (minImportance > 0) {
      await getImportantMemories(minImportance);
    } else {
      await clearFilter();
    }
  };

  // Group memories for timeline view
  const timelineData = useMemo(() => {
    return Object.entries(groupedByDate)
      .map(([date, memories]) => ({
        date,
        memories,
        count: memories.length,
        avgImportance: memories.reduce((sum, m) => sum + m.importance, 0) / memories.length,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [groupedByDate]);

  // Category statistics
  const categoryStats = useMemo(() => {
    if (!stats) return [];
    
    return Object.entries(stats.category_breakdown)
      .map(([category, count]) => ({
        category: category as MemoryCategory,
        count,
        percentage: (count / stats.total_memories) * 100,
        color: memoryHelpers.getCategoryColor(category as MemoryCategory),
        icon: memoryHelpers.getCategoryIcon(category as MemoryCategory),
      }))
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  // Tag cloud data
  const tagCloudData = useMemo(() => {
    if (!stats) return [];
    
    return Object.entries(stats.top_tags)
      .map(([tag, count]) => ({
        tag,
        count,
        size: Math.max(12, Math.min(24, (count / Math.max(...Object.values(stats.top_tags))) * 20 + 12)),
      }))
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-400 font-semibold">Memory System Error</h3>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
          <button 
            onClick={clearError}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Memory System</h2>
          {stats && (
            <div className="text-sm text-gray-400">
              {stats.total_memories} memories • Avg importance: {stats.average_importance.toFixed(1)}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex space-x-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'semantic' | 'keyword')}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="keyword">Keyword</option>
            <option value="semantic">Semantic</option>
          </select>
        </div>

        {/* View Mode Tabs */}
        <div className="flex space-x-2">
          {['list', 'timeline', 'categories', 'tags'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/50">
        <div className="flex flex-wrap gap-4">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Category:</span>
            <select
              value={selectedCategory || ''}
              onChange={(e) => handleCategoryFilter(e.target.value as MemoryCategory || null)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            >
              <option value="">All Categories</option>
              <option value="emotional">🔴 Emotional</option>
              <option value="learning">🔵 Learning</option>
              <option value="creative">🟣 Creative</option>
              <option value="problem_solving">🟠 Problem Solving</option>
              <option value="personal">🔴 Personal</option>
              <option value="factual">🟢 Factual</option>
              <option value="conversation">⚪ Conversation</option>
            </select>
          </div>

          {/* Importance Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Min Importance:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={importanceFilter}
              onChange={(e) => handleImportanceFilter(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-gray-400 min-w-[2rem]">
              {importanceFilter.toFixed(1)}
            </span>
          </div>

          {/* Clear Filters */}
          {(selectedCategory || selectedTags.length > 0 || importanceFilter > 0 || searchQuery) && (
            <button
              onClick={async () => {
                setSelectedCategory(null);
                setSelectedTags([]);
                setImportanceFilter(0);
                setSearchQuery('');
                await clearFilter();
              }}
              className="text-sm text-purple-400 hover:text-purple-300 underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500/30 hover:bg-purple-500/30"
              >
                {tag} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-400">Loading memories...</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'list' && (
              <MemoryList key="list" memories={memories} />
            )}
            {viewMode === 'timeline' && (
              <MemoryTimeline key="timeline" data={timelineData} />
            )}
            {viewMode === 'categories' && (
              <CategoryView 
                key="categories" 
                stats={categoryStats} 
                onCategoryClick={handleCategoryFilter}
              />
            )}
            {viewMode === 'tags' && (
              <TagCloud 
                key="tags" 
                data={tagCloudData} 
                selectedTags={selectedTags}
                onTagClick={handleTagToggle}
              />
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// Memory List Component
function MemoryList({ memories }: { memories: MemoryEntry[] }) {
  if (memories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-4">🧠</div>
        <p>No memories found matching your criteria.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {memories.map((memory) => (
        <MemoryCard key={memory.id} memory={memory} />
      ))}
    </motion.div>
  );
}

// Memory Card Component
function MemoryCard({ memory }: { memory: MemoryEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const importance = memoryHelpers.getImportanceBadge(memory.importance);
  
  return (
    <motion.div
      layout
      className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">
            {memoryHelpers.getCategoryIcon(memory.category)}
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <span 
                className="px-2 py-1 rounded text-xs font-medium"
                style={{ 
                  backgroundColor: `${memoryHelpers.getCategoryColor(memory.category)}20`,
                  color: memoryHelpers.getCategoryColor(memory.category),
                  border: `1px solid ${memoryHelpers.getCategoryColor(memory.category)}30`
                }}
              >
                {memory.category}
              </span>
              <span 
                className="px-2 py-1 rounded text-xs font-medium border"
                style={{ 
                  backgroundColor: `${importance.color}20`,
                  color: importance.color,
                  borderColor: `${importance.color}30`
                }}
              >
                {importance.text}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {memoryHelpers.formatTimestamp(memory.timestamp)}
            </div>
          </div>
        </div>
        
        {memory.emotional_tone && (
          <div className="text-lg">
            {memoryHelpers.getSentimentEmoji(memory.emotional_tone.sentiment)}
          </div>
        )}
      </div>

      {/* Memory Content */}
      <div className="space-y-3">
        <div>
          <div className="text-sm text-gray-400 mb-1">User:</div>
          <div className="text-gray-200 text-sm leading-relaxed">
            {memory.content}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-400 mb-1">AI Response:</div>
          <div className="text-gray-300 text-sm leading-relaxed">
            {isExpanded ? memory.ai_response : `${memory.ai_response.slice(0, 200)}${memory.ai_response.length > 200 ? '...' : ''}`}
          </div>
          {memory.ai_response.length > 200 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-purple-400 hover:text-purple-300 text-xs mt-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-700">
          {memory.tags.map(tag => (
            <span
              key={tag}
              className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Emotional Tone Details */}
      {memory.emotional_tone && isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Emotional Analysis:</div>
          <div className="flex items-center space-x-4 text-xs">
            <span className="text-gray-300">
              Sentiment: {memory.emotional_tone.sentiment > 0 ? '+' : ''}{memory.emotional_tone.sentiment.toFixed(2)}
            </span>
            <span className="text-gray-300">
              Energy: {(memory.emotional_tone.energy_level * 100).toFixed(0)}%
            </span>
            {memory.emotional_tone.emotions.length > 0 && (
              <span className="text-gray-300">
                Primary: {memory.emotional_tone.emotions[0][0]}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Timeline Component
function MemoryTimeline({ data }: { data: Array<{ date: string; memories: MemoryEntry[]; count: number; avgImportance: number }> }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {data.map(({ date, memories, count, avgImportance }) => (
        <div key={date} className="border-l-2 border-purple-500 pl-6 pb-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-3 h-3 bg-purple-500 rounded-full -ml-[1.375rem] border-2 border-gray-900"></div>
            <div>
              <div className="text-white font-medium">{new Date(date).toLocaleDateString()}</div>
              <div className="text-sm text-gray-400">
                {count} memories • Avg importance: {avgImportance.toFixed(1)}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {memories.slice(0, 3).map(memory => (
              <div key={memory.id} className="bg-gray-800 rounded p-3 text-sm">
                <div className="text-gray-300 mb-1">{memory.content.slice(0, 100)}...</div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span>{memoryHelpers.getCategoryIcon(memory.category)} {memory.category}</span>
                  <span>•</span>
                  <span>Importance: {memory.importance.toFixed(1)}</span>
                </div>
              </div>
            ))}
            {memories.length > 3 && (
              <div className="text-sm text-gray-400">
                + {memories.length - 3} more memories
              </div>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// Category View Component
function CategoryView({ 
  stats, 
  onCategoryClick 
}: { 
  stats: Array<{ category: MemoryCategory; count: number; percentage: number; color: string; icon: string }>;
  onCategoryClick: (category: MemoryCategory) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {stats.map(({ category, count, percentage, color, icon }) => (
        <button
          key={category}
          onClick={() => onCategoryClick(category)}
          className="bg-gray-800 hover:bg-gray-750 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{icon}</span>
            <span className="text-2xl font-bold text-white">{count}</span>
          </div>
          <div className="space-y-2">
            <div className="text-white font-medium capitalize">{category.replace('_', ' ')}</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: color 
                }}
              />
            </div>
            <div className="text-sm text-gray-400">{percentage.toFixed(1)}% of memories</div>
          </div>
        </button>
      ))}
    </motion.div>
  );
}

// Tag Cloud Component
function TagCloud({ 
  data, 
  selectedTags, 
  onTagClick 
}: { 
  data: Array<{ tag: string; count: number; size: number }>;
  selectedTags: string[];
  onTagClick: (tag: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-wrap gap-3 justify-center"
    >
      {data.map(({ tag, count, size }) => (
        <button
          key={tag}
          onClick={() => onTagClick(tag)}
          className={`px-3 py-1 rounded-full border transition-all hover:scale-105 ${
            selectedTags.includes(tag)
              ? 'bg-purple-500 text-white border-purple-400'
              : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-500'
          }`}
          style={{ fontSize: `${size}px` }}
        >
          #{tag}
          <span className="ml-1 text-xs opacity-70">({count})</span>
        </button>
      ))}
    </motion.div>
  );
}