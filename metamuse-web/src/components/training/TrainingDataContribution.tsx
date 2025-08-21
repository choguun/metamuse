'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import api from '@/lib/api';

interface TrainingDataContributionProps {
  museId: string;
  originalMessage?: string;
  improvedMessage?: string;
  onSuccess?: (contributionId: string, rewardAmount: number) => void;
  onClose?: () => void;
}

export enum ContributionType {
  ConversationCorrection = 1,
  PreferenceFeedback = 2,
  QualityRating = 3,
  PersonalityTuning = 4,
  ConversationCuration = 5,
  SemanticEnhancement = 6,
}

const CONTRIBUTION_TYPES = [
  {
    id: ContributionType.ConversationCorrection,
    name: 'Conversation Correction',
    description: 'Improve AI responses by providing corrections',
    icon: '✏️',
    multiplier: 1.2,
    color: '#FF6B6B',
  },
  {
    id: ContributionType.PreferenceFeedback,
    name: 'Preference Feedback',
    description: 'Share preferences to guide AI behavior',
    icon: '⭐',
    multiplier: 1.0,
    color: '#4ECDC4',
  },
  {
    id: ContributionType.QualityRating,
    name: 'Quality Rating',
    description: 'Rate AI response quality and helpfulness',
    icon: '📊',
    multiplier: 1.1,
    color: '#45B7D1',
  },
  {
    id: ContributionType.PersonalityTuning,
    name: 'Personality Tuning',
    description: 'Fine-tune muse personality traits',
    icon: '🎭',
    multiplier: 1.5,
    color: '#96CEB4',
  },
  {
    id: ContributionType.ConversationCuration,
    name: 'Conversation Curation',
    description: 'Curate valuable conversation examples',
    icon: '📚',
    multiplier: 1.3,
    color: '#FFEAA7',
  },
  {
    id: ContributionType.SemanticEnhancement,
    name: 'Semantic Enhancement',
    description: "Enhance AI's semantic understanding",
    icon: '🧠',
    multiplier: 1.25,
    color: '#DDA0DD',
  },
];

const IMPROVEMENT_TYPES = [
  'grammar',
  'accuracy',
  'creativity',
  'empathy',
  'coherence',
  'helpfulness',
  'factual_correction',
  'tone_adjustment',
  'clarity',
  'engagement',
];

export function TrainingDataContribution({
  museId,
  originalMessage = '',
  improvedMessage = '',
  onSuccess,
  onClose,
}: TrainingDataContributionProps) {
  const { address } = useAccount();
  const [selectedType, setSelectedType] = useState<ContributionType>(ContributionType.ConversationCorrection);
  const [formData, setFormData] = useState({
    original_data: originalMessage,
    improved_data: improvedMessage,
    user_comment: '',
    difficulty_level: 5,
    improvement_type: 'accuracy',
    reference_urls: [''],
    tags: [''],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    contribution_id?: string;
    reward_amount?: number;
    reward_calculation?: any;
    error?: string;
  } | null>(null);

  const selectedTypeInfo = CONTRIBUTION_TYPES.find(t => t.id === selectedType)!;
  const baseReward = 10;
  const estimatedReward = Math.round(baseReward * selectedTypeInfo.multiplier);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setResult({ success: false, error: 'Please connect your wallet' });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await api.trainingData.contribute({
        contributor_address: address,
        muse_token_id: parseInt(museId),
        contribution_type: selectedType,
        original_data: { content: formData.original_data },
        improved_data: { content: formData.improved_data },
        metadata: {
          user_comment: formData.user_comment,
          difficulty_level: formData.difficulty_level,
          improvement_type: formData.improvement_type,
          reference_urls: formData.reference_urls.filter(url => url.trim()),
          tags: formData.tags.filter(tag => tag.trim()),
        },
      });

      setResult({
        success: response.success,
        contribution_id: response.contribution_id,
        reward_amount: response.reward_amount,
        reward_calculation: response.reward_calculation,
      });

      if (response.success && onSuccess) {
        onSuccess(response.contribution_id, response.reward_amount);
      }
    } catch (error) {
      console.error('Training data contribution failed:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Contribution failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateArrayField = (field: 'reference_urls' | 'tags', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const addArrayField = (field: 'reference_urls' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayField = (field: 'reference_urls' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: `${selectedTypeInfo.color}30` }}
          >
            🏭
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Contribute Training Data</h2>
            <p className="text-sm text-gray-400">
              Help improve AI by contributing high-quality training data and earn DAT tokens
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Success/Error Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-6 p-4 rounded-lg border ${
              result.success
                ? 'bg-green-500/20 border-green-500/30'
                : 'bg-red-500/20 border-red-500/30'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                {result.success ? '🎉' : '❌'}
              </span>
              <span className={`font-medium ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                {result.success ? 'Contribution Successful!' : 'Contribution Failed'}
              </span>
            </div>
            {result.success && result.reward_calculation && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Contribution ID:</span>
                  <span className="text-white font-mono">{result.contribution_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">DAT Tokens Earned:</span>
                  <span className="text-green-300 font-medium">{Math.round((result.reward_amount || 0) / 1000)} DAT</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {result.reward_calculation.reasoning.map((reason: string, i: number) => (
                    <div key={i}>• {reason}</div>
                  ))}
                </div>
              </div>
            )}
            {result.error && (
              <p className="text-red-200 text-sm">{result.error}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contribution Type Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Contribution Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CONTRIBUTION_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedType === type.id
                    ? `border-opacity-100 bg-opacity-20`
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                style={{
                  borderColor: selectedType === type.id ? type.color : undefined,
                  backgroundColor: selectedType === type.id ? `${type.color}20` : undefined,
                }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-xl">{type.icon}</span>
                  <span className="font-medium text-white">{type.name}</span>
                  <span className="text-xs text-green-400 ml-auto">
                    {type.multiplier}x reward
                  </span>
                </div>
                <p className="text-sm text-gray-400">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Original Data */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Original AI Response
          </label>
          <textarea
            value={formData.original_data}
            onChange={(e) => setFormData(prev => ({ ...prev, original_data: e.target.value }))}
            className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white resize-none focus:border-blue-500 focus:outline-none"
            placeholder="Paste the original AI response that needs improvement..."
            required
          />
        </div>

        {/* Improved Data */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Improved Version
          </label>
          <textarea
            value={formData.improved_data}
            onChange={(e) => setFormData(prev => ({ ...prev, improved_data: e.target.value }))}
            className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white resize-none focus:border-blue-500 focus:outline-none"
            placeholder="Provide your improved version of the AI response..."
            required
          />
        </div>

        {/* User Comment */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Explanation of Improvements
          </label>
          <textarea
            value={formData.user_comment}
            onChange={(e) => setFormData(prev => ({ ...prev, user_comment: e.target.value }))}
            className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white resize-none focus:border-blue-500 focus:outline-none"
            placeholder="Explain what you improved and why..."
          />
        </div>

        {/* Additional Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Difficulty Level: {formData.difficulty_level}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.difficulty_level}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Easy</span>
              <span>Hard</span>
            </div>
          </div>

          {/* Improvement Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Improvement Category
            </label>
            <select
              value={formData.improvement_type}
              onChange={(e) => setFormData(prev => ({ ...prev, improvement_type: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              {IMPROVEMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reference URLs */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Reference URLs (Optional)
          </label>
          {formData.reference_urls.map((url, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateArrayField('reference_urls', index, e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                placeholder="https://example.com/reference"
              />
              {formData.reference_urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayField('reference_urls', index)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('reference_urls')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            + Add Reference URL
          </button>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Tags
          </label>
          {formData.tags.map((tag, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <input
                type="text"
                value={tag}
                onChange={(e) => updateArrayField('tags', index, e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                placeholder="e.g., conversation, humor, technical"
              />
              {formData.tags.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayField('tags', index)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('tags')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            + Add Tag
          </button>
        </div>

        {/* Reward Preview */}
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600/30">
          <h4 className="font-medium text-white mb-2">Estimated Reward</h4>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Base: {baseReward} DAT × {selectedTypeInfo.multiplier}x multiplier
            </div>
            <div className="text-lg font-bold text-green-400">
              ~{estimatedReward} DAT tokens
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Final reward may vary based on quality score and validation
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting || !address || !formData.original_data || !formData.improved_data}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isSubmitting || !address || !formData.original_data || !formData.improved_data
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r hover:shadow-lg transform hover:scale-105'
            }`}
            style={{
              backgroundImage: isSubmitting || !address || !formData.original_data || !formData.improved_data ? 
                undefined : 
                `linear-gradient(135deg, ${selectedTypeInfo.color}, ${selectedTypeInfo.color}CC)`
            }}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">⏳</span>
                Contributing...
              </>
            ) : !address ? (
              <>
                <span className="mr-2">🔒</span>
                Connect Wallet to Contribute
              </>
            ) : (
              <>
                <span className="mr-2">🏭</span>
                Contribute Training Data
              </>
            )}
          </button>
          
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}