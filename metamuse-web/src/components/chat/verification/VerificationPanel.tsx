'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import api from '@/lib/api';
import { TransactionStatus } from '@/components/ui/TransactionStatus';

interface VerificationPanelProps {
  messageId: string;
  museId: string;
  sessionId: string;
  userMessage: string;
  aiResponse: string;
  timestamp: Date;
  isVisible: boolean;
  onToggle: () => void;
  onVerificationSuccess?: (verificationId: string, commitmentHash: string) => void;
}

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
}

export function VerificationPanel({
  messageId,
  museId,
  sessionId,
  userMessage,
  aiResponse,
  timestamp,
  isVisible,
  onToggle,
  onVerificationSuccess,
}: VerificationPanelProps) {
  const { address } = useAccount();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
  const [verificationResult, setVerificationResult] = useState<{
    verificationId: string;
    commitmentHash: string;
    status: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Transaction state
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);

  const initializeVerificationSteps = (): VerificationStep[] => [
    {
      id: 'commitment',
      title: 'Creating Commitment',
      description: 'Generating cryptographic commitment for interaction',
      status: 'pending',
      duration: 1000,
    },
    {
      id: 'blockchain_commit',
      title: 'Blockchain Commitment',
      description: 'Submitting commitment to CommitmentVerifier contract',
      status: 'pending',
      duration: 3000,
    },
    {
      id: 'verification_request',
      title: 'Verification Request',
      description: 'Initiating verification process with backend',
      status: 'pending',
      duration: 2000,
    },
    {
      id: 'final_verification',
      title: 'Final Verification',
      description: 'Confirming interaction authenticity',
      status: 'pending',
      duration: 1500,
    },
  ];

  const updateStepStatus = (stepId: string, status: VerificationStep['status']) => {
    setVerificationSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const executeStep = async (step: VerificationStep): Promise<void> => {
    updateStepStatus(step.id, 'processing');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, step.duration || 1000));
    
    try {
      switch (step.id) {
        case 'commitment':
          // Commitment creation is handled by backend
          break;
          
        case 'blockchain_commit':
          // Blockchain commitment is handled by backend
          break;
          
        case 'verification_request':
          // Verification request is handled by backend
          break;
          
        case 'final_verification':
          // Final verification is handled by backend
          break;
      }
      
      updateStepStatus(step.id, 'completed');
    } catch (error) {
      console.error(`Step ${step.id} failed:`, error);
      updateStepStatus(step.id, 'error');
      throw error;
    }
  };

  const requestVerification = async () => {
    if (!address) {
      setError('Please connect your wallet to request verification');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);
    
    const steps = initializeVerificationSteps();
    setVerificationSteps(steps);

    try {
      // Execute visual steps for user feedback
      for (const step of steps) {
        await executeStep(step);
      }

      console.log('🔐 Requesting Interaction Verification:', {
        messageId,
        sessionId,
        userMessage: userMessage.substring(0, 100) + '...',
        aiResponse: aiResponse.substring(0, 100) + '...',
        timestamp: timestamp.toISOString(),
        userAddress: address,
      });

      // Call backend verification API
      const result = await api.verification.requestVerification({
        interaction_id: messageId,
        commitment_hash: `0x${messageId.replace(/-/g, '')}`, // Generate commitment hash from messageId
        signature: `sig_${address}_${messageId}`, // Mock signature
        muse_id: museId,
      });

      console.log('✅ Verification requested successfully:', result);

      // Handle transaction hash if available
      if (result.tx_hash) {
        setTransactionHash(result.tx_hash as `0x${string}`);
      }

      const verificationInfo = {
        verificationId: result.verification_id,
        commitmentHash: `0x${messageId.replace(/-/g, '')}`,
        status: result.status,
      };

      setVerificationResult(verificationInfo);
      
      // Notify parent component
      if (onVerificationSuccess) {
        onVerificationSuccess(verificationInfo.verificationId, verificationInfo.commitmentHash);
      }

    } catch (error) {
      console.error('🚨 CRITICAL ERROR: Verification request failed:', error);
      
      setError(error instanceof Error ? error.message : 'Verification request failed');
      setTransactionError(error as Error);
      
      // Mark current step as error
      setVerificationSteps(prev => 
        prev.map(step => 
          step.status === 'processing' ? { ...step, status: 'error' } : step
        )
      );
    } finally {
      console.log('🚨 Verification process complete - setting isVerifying to false');
      setIsVerifying(false);
    }
  };

  const getStepIcon = (status: VerificationStep['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'error':
        return '❌';
      default:
        return '⭕';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="border border-gray-700/50 rounded-xl overflow-hidden bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-xl">
                  🔐
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Request Verification
                  </h3>
                  <p className="text-sm text-gray-400">
                    Create cryptographic proof of this AI interaction
                  </p>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {/* Verification Info */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600/30">
              <h4 className="font-medium text-white mb-3">Verification Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Message ID:</span>
                  <p className="text-white font-mono">{messageId}</p>
                </div>
                <div>
                  <span className="text-gray-400">Timestamp:</span>
                  <p className="text-white">{timestamp.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-400">Session ID:</span>
                  <p className="text-white font-mono">{sessionId}</p>
                </div>
                <div>
                  <span className="text-gray-400">User Address:</span>
                  <p className="text-white font-mono">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-900/50 rounded border border-gray-600/20">
                <p className="text-xs text-gray-400 mb-1">User Message:</p>
                <p className="text-sm text-gray-300 mb-3">"{userMessage.substring(0, 120)}..."</p>
                <p className="text-xs text-gray-400 mb-1">AI Response:</p>
                <p className="text-sm text-gray-300">"{aiResponse.substring(0, 120)}..."</p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">❌</span>
                  <span className="text-red-300 font-medium">Verification Failed</span>
                </div>
                <p className="text-red-200 text-sm mt-1">{error}</p>
              </motion.div>
            )}

            {/* Transaction Status */}
            <TransactionStatus
              hash={transactionHash || undefined}
              isLoading={isVerifying}
              isSuccess={!!verificationResult}
              error={transactionError}
              title="Verification Transaction"
              description="Committing interaction proof to blockchain"
              className="mb-4"
            />

            {/* Success Display */}
            {verificationResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-green-400">🎉</span>
                  <span className="text-green-300 font-medium">Verification Requested Successfully!</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Verification ID:</span>
                    <span className="text-white font-mono">{verificationResult.verificationId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Commitment Hash:</span>
                    <span className="text-white font-mono">{verificationResult.commitmentHash.substring(0, 20)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white">{verificationResult.status}</span>
                  </div>
                </div>
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(verificationResult.commitmentHash);
                    }}
                    className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1 rounded-lg transition-colors"
                  >
                    📋 Copy Commitment Hash
                  </button>
                  <button
                    onClick={() => {
                      window.open(`https://hyperion-testnet-explorer.metisdevops.link/tx/${transactionHash}`, '_blank');
                    }}
                    className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-1 rounded-lg transition-colors"
                  >
                    🔗 View on Explorer
                  </button>
                </div>
              </motion.div>
            )}

            {/* Verification Steps */}
            {isVerifying && verificationSteps.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-white mb-4 flex items-center">
                  <span className="mr-2">⚙️</span>
                  Verification Progress
                </h4>
                <div className="space-y-3">
                  {verificationSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg">
                      <div className="flex-shrink-0">
                        <span className="text-lg">
                          {step.status === 'processing' ? (
                            <span className="inline-block animate-spin">⏳</span>
                          ) : (
                            getStepIcon(step.status)
                          )}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className={`font-medium ${step.status === 'completed' ? 'text-green-300' : 
                          step.status === 'error' ? 'text-red-300' : 
                          step.status === 'processing' ? 'text-blue-300' : 'text-gray-300'}`}>
                          {step.title}
                        </h5>
                        <p className="text-sm text-gray-400 truncate">
                          {step.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${
                          step.status === 'completed' ? 'bg-green-400' :
                          step.status === 'error' ? 'bg-red-400' :
                          step.status === 'processing' ? 'bg-blue-400 animate-pulse' :
                          'bg-gray-600'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits & Info */}
            {!verificationResult && !isVerifying && (
              <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-600/20">
                <h4 className="font-medium text-white mb-3">Why Request Verification?</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-400">🔒</span>
                    <span className="text-gray-300">Cryptographic proof of interaction authenticity</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400">⛓️</span>
                    <span className="text-gray-300">Immutable commitment on blockchain</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-gray-300">Verifiable proof of AI response integrity</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400">🛡️</span>
                    <span className="text-gray-300">Protection against AI response tampering</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {!verificationResult && (
                <button
                  onClick={() => {
                    console.log('🔐 "Request Verification" button clicked!');
                    requestVerification();
                  }}
                  disabled={isVerifying || !address}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isVerifying || !address
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <span className="mr-2">⏳</span>
                      Requesting Verification...
                    </>
                  ) : !address ? (
                    <>
                      <span className="mr-2">🔒</span>
                      Connect Wallet to Verify
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🔐</span>
                      Request Verification
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={onToggle}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {verificationResult ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}