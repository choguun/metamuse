'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import api from '@/lib/api';

interface ValidationContribution {
  contribution_id: string;
  contributor_address: string;
  muse_token_id: number;
  contribution_type: number;
  original_data: any;
  improved_data: any;
  metadata: any;
  data_hash: string;
  ipfs_hash: string;
  timestamp: string;
  quality_score: number;
  reward_amount: number;
  validation_status: string;
}

interface TrainingDataValidationProps {
  onValidationComplete?: (contributionId: string, approved: boolean) => void;
}

const CONTRIBUTION_TYPE_NAMES = {
  1: 'Conversation Correction',
  2: 'Preference Feedback', 
  3: 'Quality Rating',
  4: 'Personality Tuning',
  5: 'Conversation Curation',
  6: 'Semantic Enhancement',
};

export function TrainingDataValidation({ onValidationComplete }: TrainingDataValidationProps) {
  const { address } = useAccount();
  const [contributions, setContributions] = useState<ValidationContribution[]>([]);
  const [selectedContribution, setSelectedContribution] = useState<ValidationContribution | null>(null);
  const [validationData, setValidationData] = useState({
    approved: true,
    quality_score: 75,
    feedback: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadPendingContributions();
  }, []);

  const loadPendingContributions = async () => {
    setIsLoading(true);
    try {
      // For demo purposes, we'll fetch contributions by type and filter for pending ones
      // In production, there would be a dedicated endpoint for pending validations
      const types = [1, 2, 3, 4, 5, 6];
      const allContributions: ValidationContribution[] = [];
      
      for (const type of types) {
        try {
          const response = await api.trainingData.getByType(type, 10);
          if (response.success && response.contributions) {
            allContributions.push(...response.contributions);
          }
        } catch (error) {
          console.warn(`Failed to fetch contributions for type ${type}:`, error);
        }
      }

      // Filter for pending contributions that aren't from the current user
      const pendingContributions = allContributions.filter(
        contrib => contrib.validation_status === 'Pending' && 
                  contrib.contributor_address !== address
      );

      setContributions(pendingContributions);
    } catch (error) {
      console.error('Failed to load pending contributions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedContribution || !address) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await api.trainingData.validate({
        contribution_id: selectedContribution.contribution_id,
        validator_address: address,
        approved: validationData.approved,
        quality_score: validationData.quality_score,
        feedback: validationData.feedback,
      });

      setValidationResult({
        success: response.success,
        message: response.success 
          ? `Validation submitted successfully! New quality score: ${response.new_quality_score}`
          : 'Validation failed. Please try again.',
      });

      if (response.success) {
        // Remove the validated contribution from the list
        setContributions(prev => 
          prev.filter(contrib => contrib.contribution_id !== selectedContribution.contribution_id)
        );
        setSelectedContribution(null);
        
        if (onValidationComplete) {
          onValidationComplete(selectedContribution.contribution_id, validationData.approved);
        }
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationResult({
        success: false,
        message: error instanceof Error ? error.message : 'Validation failed',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-white">Loading pending contributions...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center text-xl">
            🔍
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Training Data Validation</h1>
            <p className="text-gray-400">
              Review and validate community contributions to improve AI training data
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Pending Contributions:</span>
            <span className="text-white font-semibold">{contributions.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Validator Reward:</span>
            <span className="text-green-400 font-semibold">1 DAT per validation</span>
          </div>
        </div>
      </div>

      {/* Validation Result */}
      <AnimatePresence>
        {validationResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-6 p-4 rounded-lg border ${
              validationResult.success
                ? 'bg-green-500/20 border-green-500/30'
                : 'bg-red-500/20 border-red-500/30'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className={validationResult.success ? 'text-green-400' : 'text-red-400'}>
                {validationResult.success ? '✅' : '❌'}
              </span>
              <span className={`font-medium ${validationResult.success ? 'text-green-300' : 'text-red-300'}`}>
                {validationResult.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {contributions.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Pending Contributions</h3>
          <p className="text-gray-400">
            All contributions have been validated! Check back later for new submissions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contributions List */}
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Pending Contributions</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {contributions.map((contribution) => (
                <div
                  key={contribution.contribution_id}
                  onClick={() => setSelectedContribution(contribution)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedContribution?.contribution_id === contribution.contribution_id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      {CONTRIBUTION_TYPE_NAMES[contribution.contribution_type as keyof typeof CONTRIBUTION_TYPE_NAMES]}
                    </span>
                    <span className="text-xs text-gray-400">
                      Muse #{contribution.muse_token_id}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-400 mb-2">
                    From: {formatAddress(contribution.contributor_address)}
                  </div>
                  
                  <div className="text-sm text-gray-300">
                    {contribution.improved_data?.content?.substring(0, 100) || 
                     JSON.stringify(contribution.improved_data).substring(0, 100)}...
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(contribution.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-green-400">
                      {Math.round(contribution.reward_amount / 1000)} DAT
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Panel */}
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            {selectedContribution ? (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Validate Contribution</h2>
                
                {/* Contribution Details */}
                <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="font-medium text-white mb-3">
                    {CONTRIBUTION_TYPE_NAMES[selectedContribution.contribution_type as keyof typeof CONTRIBUTION_TYPE_NAMES]}
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Original Data:</label>
                      <div className="text-sm text-gray-300 bg-gray-700/50 p-3 rounded max-h-24 overflow-y-auto">
                        {selectedContribution.original_data?.content || 
                         JSON.stringify(selectedContribution.original_data, null, 2)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Improved Data:</label>
                      <div className="text-sm text-gray-300 bg-gray-700/50 p-3 rounded max-h-24 overflow-y-auto">
                        {selectedContribution.improved_data?.content || 
                         JSON.stringify(selectedContribution.improved_data, null, 2)}
                      </div>
                    </div>
                    
                    {selectedContribution.metadata?.user_comment && (
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Contributor's Comment:</label>
                        <div className="text-sm text-gray-300 bg-gray-700/50 p-3 rounded">
                          {selectedContribution.metadata.user_comment}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation Form */}
                <div className="space-y-4">
                  {/* Approval Decision */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Validation Decision
                    </label>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setValidationData(prev => ({ ...prev, approved: true }))}
                        className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                          validationData.approved
                            ? 'border-green-500 bg-green-500/20 text-green-300'
                            : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        ✅ Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setValidationData(prev => ({ ...prev, approved: false }))}
                        className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                          !validationData.approved
                            ? 'border-red-500 bg-red-500/20 text-red-300'
                            : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>

                  {/* Quality Score */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Quality Score: <span className={getQualityColor(validationData.quality_score)}>
                        {validationData.quality_score}/100
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={validationData.quality_score}
                      onChange={(e) => setValidationData(prev => ({ 
                        ...prev, 
                        quality_score: parseInt(e.target.value) 
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Validation Feedback (Optional)
                    </label>
                    <textarea
                      value={validationData.feedback}
                      onChange={(e) => setValidationData(prev => ({ ...prev, feedback: e.target.value }))}
                      className="w-full h-20 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white resize-none focus:border-purple-500 focus:outline-none"
                      placeholder="Provide feedback on the contribution quality..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleValidate}
                    disabled={isValidating || !address}
                    className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isValidating || !address
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-lg transform hover:scale-105 text-white'
                    }`}
                  >
                    {isValidating ? (
                      <>
                        <span className="mr-2">⏳</span>
                        Submitting Validation...
                      </>
                    ) : !address ? (
                      <>
                        <span className="mr-2">🔒</span>
                        Connect Wallet to Validate
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🔍</span>
                        Submit Validation
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">👈</div>
                <h3 className="text-lg font-semibold text-white mb-2">Select a Contribution</h3>
                <p className="text-gray-400">
                  Choose a contribution from the list to begin validation
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}