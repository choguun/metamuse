'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PromptTemplate,
  TemplateCategory,
  TemplateListResponse,
  MuseTraits,
} from '@/types';
import { API_BASE_URL } from '@/constants';

interface TemplateSelectorProps {
  onTemplateSelected: (template: PromptTemplate) => void;
  currentTraits?: MuseTraits;
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateSelector({ 
  onTemplateSelected, 
  currentTraits, 
  isOpen, 
  onClose 
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load templates
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, selectedCategory]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = selectedCategory === 'all' 
        ? `${API_BASE_URL}/api/v1/templates`
        : `${API_BASE_URL}/api/v1/templates/category/${selectedCategory}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load templates');

      const data: TemplateListResponse = await response.json();
      setTemplates(data.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  // Filter templates based on search
  const filteredTemplates = templates.filter(template => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Calculate compatibility score with current traits
  const getCompatibilityScore = (template: PromptTemplate): number => {
    if (!currentTraits || !template.compatible_traits.length) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    for (const range of template.compatible_traits) {
      const traitValue = currentTraits[range.trait_name as keyof MuseTraits];
      if (typeof traitValue === 'number') {
        // Calculate how well the trait fits within the compatible range
        if (traitValue >= range.min_value && traitValue <= range.max_value) {
          const optimalValue = range.optimal_value || (range.min_value + range.max_value) / 2;
          const distance = Math.abs(traitValue - optimalValue);
          const maxDistance = Math.max(optimalValue - range.min_value, range.max_value - optimalValue);
          const score = Math.max(0, 100 - (distance / maxDistance) * 100);
          totalScore += score;
          totalWeight += 1;
        }
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 50; // Default neutral score
  };

  // Sort templates by compatibility and usage
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (currentTraits) {
      const scoreA = getCompatibilityScore(a);
      const scoreB = getCompatibilityScore(b);
      if (Math.abs(scoreA - scoreB) > 10) {
        return scoreB - scoreA; // Higher compatibility first
      }
    }
    return b.usage_count - a.usage_count; // Then by popularity
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-2xl border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Choose a Template</h2>
            <p className="text-gray-400 mt-1">
              Select a pre-built template or browse community creations
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-700 space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all' as const, label: 'All Templates' },
              { key: TemplateCategory.COMPANION, label: 'Companion' },
              { key: TemplateCategory.MENTOR, label: 'Mentor' },
              { key: TemplateCategory.CREATIVE, label: 'Creative' },
              { key: TemplateCategory.PROFESSIONAL, label: 'Professional' },
              { key: TemplateCategory.CUSTOM, label: 'Custom' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-400">Loading templates...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">{error}</div>
              <button
                onClick={loadTemplates}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence>
                {sortedTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    compatibilityScore={currentTraits ? getCompatibilityScore(template) : undefined}
                    onSelect={() => {
                      onTemplateSelected(template);
                      onClose();
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && !error && sortedTemplates.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>No templates found matching your criteria.</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-purple-400 hover:text-purple-300"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface TemplateCardProps {
  template: PromptTemplate;
  compatibilityScore?: number;
  onSelect: () => void;
}

function TemplateCard({ template, compatibilityScore, onSelect }: TemplateCardProps) {
  const getCategoryColor = (category: TemplateCategory) => {
    switch (category) {
      case TemplateCategory.COMPANION: return 'bg-green-500/20 text-green-400 border-green-500/30';
      case TemplateCategory.MENTOR: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case TemplateCategory.CREATIVE: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case TemplateCategory.PROFESSIONAL: return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent Match', color: 'text-green-400' };
    if (score >= 60) return { label: 'Good Match', color: 'text-blue-400' };
    if (score >= 40) return { label: 'Fair Match', color: 'text-yellow-400' };
    return { label: 'Poor Match', color: 'text-red-400' };
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer group"
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
              {template.name}
            </h3>
            {!template.is_custom && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                Official
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm line-clamp-2">{template.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm">
          <span className={`px-2 py-1 rounded-full border text-xs ${getCategoryColor(template.category)}`}>
            {template.category}
          </span>
          <div className="flex items-center text-gray-400">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{template.rating.toFixed(1)}</span>
          </div>
          <div className="text-gray-400">
            {template.usage_count} uses
          </div>
        </div>

        {compatibilityScore !== undefined && (
          <div className="text-right">
            <div className={`text-sm font-medium ${getCompatibilityLabel(compatibilityScore).color}`}>
              {getCompatibilityLabel(compatibilityScore).label}
            </div>
            <div className="text-xs text-gray-400">
              {Math.round(compatibilityScore)}% compatible
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {template.tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 4 && (
            <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded">
              +{template.tags.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Variables */}
      {template.variables.length > 0 && (
        <div className="text-xs text-gray-400 mb-4">
          <span className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            {template.variables.length} customizable variable{template.variables.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Action */}
      <button className="w-full py-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-colors group-hover:border-purple-400">
        Select Template
      </button>
    </motion.div>
  );
}