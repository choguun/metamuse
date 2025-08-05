'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { MuseTraits } from '@/types';

interface RatingCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  icon: string;
}

interface MarketReward {
  tokens: number;
  reputation: number;
  bonus?: {
    type: 'accuracy' | 'consistency' | 'early_adopter' | 'quality';
    amount: number;
    description: string;
  };
}

interface AIAlignmentMarketProps {
  traits: MuseTraits;
  responseId: string;
  currentRating?: number;
  isVisible: boolean;
  onToggle: () => void;
  onSubmitRating: (rating: number, feedback: string, criteria: Record<string, number>) => Promise<MarketReward>;
  marketStats?: {
    totalRatings: number;
    averageRating: number;
    rewardPool: number;
    topRaters: number;
  };
}

const ratingCriteria: RatingCriteria[] = [
  {
    id: 'helpfulness',
    name: 'Helpfulness',
    description: 'How useful and relevant was this response?',
    weight: 0.3,
    icon: '🎯',
  },
  {
    id: 'accuracy',
    name: 'Accuracy',
    description: 'How factually correct and reliable was the information?',
    weight: 0.25,
    icon: '✅',
  },
  {
    id: 'personality_alignment',
    name: 'Personality Fit',
    description: 'How well did the response match the expected personality?',
    weight: 0.2,
    icon: '🎭',
  },
  {
    id: 'creativity',
    name: 'Creativity',
    description: 'How original and innovative was the response?',
    weight: 0.15,
    icon: '✨',
  },
  {
    id: 'clarity',
    name: 'Clarity',
    description: 'How clear and easy to understand was the response?',
    weight: 0.1,
    icon: '💡',
  },
];

export function AIAlignmentMarket({
  traits,
  responseId,
  currentRating,
  isVisible,
  onToggle,
  onSubmitRating,
  marketStats,
}: AIAlignmentMarketProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [overallRating, setOverallRating] = useState(currentRating || 0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReward, setShowReward] = useState<MarketReward | null>(null);
  const [animatingCriteria, setAnimatingCriteria] = useState<string | null>(null);
  
  const theme = usePersonalityTheme(traits);

  const calculateOverallRating = useCallback((criteriaRatings: Record<string, number>) => {
    let weightedSum = 0;
    let totalWeight = 0;
    
    ratingCriteria.forEach(criteria => {
      const rating = criteriaRatings[criteria.id] || 0;
      weightedSum += rating * criteria.weight;
      totalWeight += criteria.weight;
    });
    
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }, []);

  const handleCriteriaRating = (criteriaId: string, rating: number) => {
    const newRatings = { ...ratings, [criteriaId]: rating };
    setRatings(newRatings);
    setOverallRating(calculateOverallRating(newRatings));
    setAnimatingCriteria(criteriaId);
    setTimeout(() => setAnimatingCriteria(null), 500);
  };

  const handleSubmit = async () => {
    if (overallRating === 0) return;
    
    setIsSubmitting(true);
    try {
      const reward = await onSubmitRating(overallRating, feedback, ratings);
      setShowReward(reward);
      setTimeout(() => setShowReward(null), 5000);
    } catch (error) {
      console.error('Rating submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return '#10b981'; // Green
    if (rating >= 60) return '#3b82f6'; // Blue
    if (rating >= 40) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 80) return 'Excellent';
    if (rating >= 60) return 'Good';
    if (rating >= 40) return 'Fair';
    if (rating >= 20) return 'Poor';
    return 'Very Poor';
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
            className="w-3 h-3 rounded-full"
            style={{ background: `linear-gradient(135deg, #f59e0b, #10b981)` }}
            animate={{
              boxShadow: [
                '0 0 10px #f59e0b40',
                '0 0 20px #10b98160',
                '0 0 10px #f59e0b40',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="font-medium">AI Alignment Market</span>
          <span className="text-xs bg-gradient-to-r from-yellow-600 to-green-600 text-white px-2 py-0.5 rounded-full">
            🏆 Rate & Earn
          </span>
        </div>
        
        {currentRating && (
          <div className="flex items-center space-x-1">
            <span className="text-xs" style={{ color: getRatingColor(currentRating) }}>
              {currentRating}/100
            </span>
          </div>
        )}
      </motion.button>

      {/* Rating Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="border border-gray-700/50 rounded-xl p-6 space-y-6"
            style={{ 
              background: `linear-gradient(135deg, ${theme.getPrimaryWithOpacity(0.08)}, ${theme.getSecondaryWithOpacity(0.05)})`,
              backdropFilter: 'blur(10px)',
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Rate This Response</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Help improve AI alignment and earn rewards for quality feedback
              </p>
            </div>

            {/* Market Stats */}
            {marketStats && (
              <motion.div
                className="grid grid-cols-4 gap-4 p-4 bg-gray-800/30 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-center">
                  <div className="text-gray-400 text-xs">Total Ratings</div>
                  <div className="text-white font-semibold">{marketStats.totalRatings.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-xs">Avg Rating</div>
                  <div className="text-green-400 font-semibold">{marketStats.averageRating}/100</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-xs">Reward Pool</div>
                  <div className="text-yellow-400 font-semibold">{marketStats.rewardPool.toLocaleString()} AMT</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-xs">Top Raters</div>
                  <div className="text-purple-400 font-semibold">{marketStats.topRaters}</div>
                </div>
              </motion.div>
            )}

            {/* Overall Rating Display */}
            <motion.div
              className="text-center"
              animate={{
                scale: overallRating > 0 ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-700"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={getRatingColor(overallRating)}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 283" }}
                    animate={{ 
                      strokeDasharray: `${(overallRating / 100) * 283} 283`,
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-white">{overallRating}</div>
                  <div className="text-xs text-gray-400">/ 100</div>
                </div>
              </div>
              <div className="text-sm font-medium" style={{ color: getRatingColor(overallRating) }}>
                {getRatingLabel(overallRating)}
              </div>
            </motion.div>

            {/* Rating Criteria */}
            <div className="space-y-4">
              <h4 className="text-white font-medium text-center">Detailed Ratings</h4>
              {ratingCriteria.map((criteria, index) => (
                <motion.div
                  key={criteria.id}
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{criteria.icon}</span>
                      <span className="text-white font-medium">{criteria.name}</span>
                      <span className="text-xs text-gray-400">({Math.round(criteria.weight * 100)}%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400 w-8">
                        {ratings[criteria.id] || 0}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-2">{criteria.description}</p>
                  
                  {/* Rating Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ratings[criteria.id] || 0}
                      onChange={(e) => handleCriteriaRating(criteria.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${getRatingColor(ratings[criteria.id] || 0)} 0%, ${getRatingColor(ratings[criteria.id] || 0)} ${ratings[criteria.id] || 0}%, #374151 ${ratings[criteria.id] || 0}%, #374151 100%)`,
                      }}
                    />
                    
                    {/* Animated feedback */}
                    {animatingCriteria === criteria.id && (
                      <motion.div
                        className="absolute -top-8 text-xs font-medium px-2 py-1 rounded bg-gray-800 text-white"
                        style={{ 
                          left: `${ratings[criteria.id] || 0}%`,
                          transform: 'translateX(-50%)',
                          color: getRatingColor(ratings[criteria.id] || 0),
                        }}
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.8 }}
                      >
                        {ratings[criteria.id] || 0}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feedback Text Area */}
            <div className="space-y-2">
              <label className="text-white font-medium">Additional Feedback (Optional)</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share specific insights about this response to help improve AI alignment..."
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-400">
                Quality feedback earns bonus rewards! Be specific and constructive.
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              disabled={overallRating === 0 || isSubmitting}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: overallRating > 0 
                  ? 'linear-gradient(135deg, #f59e0b, #10b981)' 
                  : '#374151',
              }}
              whileHover={overallRating > 0 ? { scale: 1.02 } : {}}
              whileTap={overallRating > 0 ? { scale: 0.98 } : {}}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Submitting Rating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span>Submit Rating & Earn Rewards</span>
                </div>
              )}
            </motion.button>

            {/* Reward Popup */}
            <AnimatePresence>
              {showReward && (
                <motion.div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-gradient-to-r from-yellow-500 to-green-500 p-6 rounded-xl text-center max-w-sm mx-4"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <motion.div
                      className="text-4xl mb-4"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ duration: 0.5, repeat: 2 }}
                    >
                      🏆
                    </motion.div>
                    
                    <h3 className="text-white font-bold text-lg mb-2">Reward Earned!</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="text-white">
                        <span className="font-semibold">{showReward.tokens}</span> AMT Tokens
                      </div>
                      <div className="text-white">
                        <span className="font-semibold">+{showReward.reputation}</span> Reputation
                      </div>
                      
                      {showReward.bonus && (
                        <motion.div
                          className="bg-white/20 rounded-lg p-2 mt-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="text-yellow-200 font-semibold">
                            🎉 Bonus: +{showReward.bonus.amount} AMT
                          </div>
                          <div className="text-white text-xs">
                            {showReward.bonus.description}
                          </div>
                        </motion.div>
                      )}
                    </div>
                    
                    <p className="text-white/80 text-sm">
                      Thank you for contributing to AI alignment!
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}