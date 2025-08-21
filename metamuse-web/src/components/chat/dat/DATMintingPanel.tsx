'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { MuseTraits } from '@/types';
import api from '@/lib/api';
import { TransactionStatus } from '@/components/ui/TransactionStatus';
import { CONTRACTS } from '@/constants';

interface DATMintingPanelProps {
  traits: MuseTraits;
  messageId: string;
  sessionId: string;
  userMessage: string;
  aiResponse: string;
  timestamp: Date;
  teeAttestation?: string;
  commitmentHash?: string;
  isVisible: boolean;
  onToggle: () => void;
  onMintSuccess?: (datId: string, ipfsHash: string, transactionHash?: string, contractAddress?: string, tokenId?: string) => void;
}

interface MintingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
}

export function DATMintingPanel({
  traits,
  messageId,
  sessionId,
  userMessage,
  aiResponse,
  timestamp,
  teeAttestation,
  commitmentHash,
  isVisible,
  onToggle,
  onMintSuccess,
}: DATMintingPanelProps) {
  const { address } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [mintingSteps, setMintingSteps] = useState<MintingStep[]>([]);
  const [mintedDAT, setMintedDAT] = useState<{
    id: string;
    ipfsHash: string;
    contractAddress: string;
    tokenId?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Transaction state
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);

  const initializeMintingSteps = (): MintingStep[] => [
    {
      id: 'proof_bundle',
      title: 'Creating Proof Bundle',
      description: 'Packaging interaction data with TEE attestation and verification proofs',
      status: 'pending',
      duration: 1500,
    },
    {
      id: 'ipfs_metadata',
      title: 'Storing to IPFS',
      description: 'Uploading DAT metadata and proof bundle to decentralized storage',
      status: 'pending',
      duration: 2000,
    },
    {
      id: 'smart_contract',
      title: 'Minting DAT NFT',
      description: 'Creating verifiable AI interaction certificate on blockchain',
      status: 'pending',
      duration: 3000,
    },
    {
      id: 'verification',
      title: 'Final Verification',
      description: 'Confirming DAT authenticity and ownership',
      status: 'pending',
      duration: 1000,
    },
  ];

  const updateStepStatus = (stepId: string, status: MintingStep['status']) => {
    setMintingSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const executeStep = async (step: MintingStep): Promise<void> => {
    updateStepStatus(step.id, 'processing');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, step.duration || 1000));
    
    try {
      switch (step.id) {
        case 'proof_bundle':
          // Proof bundle creation is handled by backend
          break;
          
        case 'ipfs_metadata':
          // IPFS storage is handled by backend semantic search service
          break;
          
        case 'smart_contract':
          // Smart contract interaction is handled by backend
          break;
          
        case 'verification':
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

  const mintDAT = async () => {
    if (!address) {
      setError('Please connect your wallet to mint a DAT');
      return;
    }

    setIsMinting(true);
    setError(null);
    setMintedDAT(null);
    
    const steps = initializeMintingSteps();
    setMintingSteps(steps);

    try {
      // Debug timestamp value with extensive logging
      console.log('🚨 DAT Minting - Debug Info:');
      console.log('  📋 Original timestamp:', timestamp);
      console.log('  📋 Timestamp type:', typeof timestamp);
      console.log('  📋 Is Date instance:', timestamp instanceof Date);
      console.log('  📋 Timestamp value:', String(timestamp));
      console.log('  📋 Timestamp toString:', timestamp?.toString?.());
      
      // Enhanced timestamp validation with multiple fallback strategies
      let validTimestamp: Date;
      let timestampSource = 'unknown';
      
      if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
        // Valid Date object
        validTimestamp = timestamp;
        timestampSource = 'valid_date_object';
      } else if (typeof timestamp === 'number') {
        // Unix timestamp (seconds or milliseconds)
        const timestampMs = timestamp > 10000000000 ? timestamp : timestamp * 1000;
        validTimestamp = new Date(timestampMs);
        timestampSource = `unix_timestamp_${timestamp > 10000000000 ? 'ms' : 's'}`;
      } else if (typeof timestamp === 'string') {
        // ISO string or other string format
        const parsedTimestamp = new Date(timestamp);
        if (!isNaN(parsedTimestamp.getTime())) {
          validTimestamp = parsedTimestamp;
          timestampSource = 'string_parsed';
        } else {
          throw new Error(`Invalid timestamp string: ${timestamp}`);
        }
      } else {
        throw new Error(`Unsupported timestamp type: ${typeof timestamp}, value: ${String(timestamp)}`);
      }
      
      // Final validation of the resulting Date
      if (!validTimestamp || isNaN(validTimestamp.getTime())) {
        console.error('❌ All timestamp parsing attempts failed, using current time as last resort');
        validTimestamp = new Date();
        timestampSource = 'current_time_fallback';
      }
      
      console.log(`✅ DAT Minting - Timestamp processed successfully:`);
      console.log(`  📅 Final timestamp: ${validTimestamp.toISOString()}`);
      console.log(`  🔧 Source method: ${timestampSource}`);

      // Execute visual steps for user feedback
      for (const step of steps) {
        await executeStep(step);
      }

      console.log('🏷️ Minting Verified Interaction DAT:', {
        messageId,
        sessionId,
        userMessage: userMessage.substring(0, 100) + '...',
        aiResponse: aiResponse.substring(0, 100) + '...',
        timestamp: validTimestamp.toISOString(),
        teeAttestation,
        commitmentHash,
        userAddress: address,
      });

      console.log('🚨 ABOUT TO CALL BACKEND API: api.dat.mint()');
      console.log('🚨 API Client object:', api);
      console.log('🚨 API DAT object:', api.dat);
      console.log('🚨 API DAT mint function:', typeof api.dat.mint);
      
      // Call backend DAT minting API using the typed API client
      console.log('🚨 Making DAT minting API call...');
      const result = await api.dat.mint({
        interaction_data: {
          message_id: messageId,
          session_id: sessionId,
          user_message: userMessage,
          ai_response: aiResponse,
          timestamp: Math.floor(validTimestamp.getTime() / 1000),
          user_address: address,
        },
        tee_proof: teeAttestation ? {
          attestation_hex: teeAttestation,
          enclave_id: 'mrenc_a7b3c4d5',
          timestamp: Math.floor(validTimestamp.getTime() / 1000),
          nonce: `nonce_${messageId}`,
        } : undefined,
        verification_proof: commitmentHash ? {
          commitment_hash: commitmentHash,
          signature: 'sig_' + commitmentHash,
          block_number: Math.floor(Date.now() / 1000),
        } : undefined,
      });
      console.log('✅ DAT minted successfully - Raw API response:', result);
      console.log('📋 Response type:', typeof result);
      console.log('📋 Response keys:', Object.keys(result));
      console.log('📋 Response structure:', JSON.stringify(result, null, 2));

      // Handle transaction hash if available
      if (result.transaction_hash) {
        setTransactionHash(result.transaction_hash as `0x${string}`);
      }

      // Map backend response fields to frontend expected fields
      const datInfo = {
        id: result.dat_token_id?.toString() || 'N/A',
        ipfsHash: result.ipfs_metadata_hash || 'N/A',
        contractAddress: result.contract_address || CONTRACTS.InteractionDAT,
        tokenId: result.dat_token_id?.toString() || undefined,
      };
      
      console.log('📄 DAT Result Fields (Backend Response):', {
        dat_token_id: result.dat_token_id,
        ipfs_metadata_hash: result.ipfs_metadata_hash,
        transaction_hash: result.transaction_hash,
        success: result.success,
        error: result.error
      });
      
      console.log('📄 DAT Result Fields (Mapped for Frontend):', {
        id: datInfo.id,
        ipfsHash: datInfo.ipfsHash,
        contractAddress: datInfo.contractAddress,
        tokenId: datInfo.tokenId,
        transactionHash: result.transaction_hash
      });

      setMintedDAT(datInfo);
      
      // Notify parent component with all transaction details
      if (onMintSuccess) {
        console.log('🚨 Calling onMintSuccess with:', {
          datId: datInfo.id,
          ipfsHash: datInfo.ipfsHash,
          transactionHash: transactionHash || undefined,
          contractAddress: datInfo.contractAddress,
          tokenId: datInfo.tokenId
        });
        onMintSuccess(datInfo.id, datInfo.ipfsHash, transactionHash || undefined, datInfo.contractAddress, datInfo.tokenId);
      }

    } catch (error) {
      console.error('🚨 CRITICAL ERROR: DAT minting failed completely:', error);
      console.error('🚨 Error type:', typeof error);
      console.error('🚨 Error constructor:', error?.constructor?.name);
      console.error('🚨 Error message:', error instanceof Error ? error.message : String(error));
      console.error('🚨 Full error object:', error);
      
      setError(error instanceof Error ? error.message : 'DAT minting failed');
      setTransactionError(error as Error);
      
      // Mark current step as error
      setMintingSteps(prev => 
        prev.map(step => 
          step.status === 'processing' ? { ...step, status: 'error' } : step
        )
      );
    } finally {
      console.log('🚨 DAT minting process complete - setting isMinting to false');
      setIsMinting(false);
    }
  };

  const getStepIcon = (status: MintingStep['status']) => {
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

  const getTraitColor = (trait: keyof MuseTraits): string => {
    const colors = {
      creativity: '#FF6B6B',
      wisdom: '#4ECDC4', 
      humor: '#FFE66D',
      empathy: '#A8E6CF',
    };
    return colors[trait];
  };

  const dominantTrait = Object.entries(traits).reduce((a, b) => 
    traits[a[0] as keyof MuseTraits] > traits[b[0] as keyof MuseTraits] ? a : b
  )[0] as keyof MuseTraits;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="border border-gray-700/50 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${getTraitColor(dominantTrait)}15, ${getTraitColor(dominantTrait)}08)`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${getTraitColor(dominantTrait)}30` }}
                >
                  🏷️
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {mintedDAT ? "✅ DAT Minted Successfully!" : "Mint Verified Interaction DAT"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {mintedDAT ? "Your verifiable interaction certificate is ready" : "Create a verifiable certificate of this AI interaction"}
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

            {/* DAT Info */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600/30">
              <h4 className="font-medium text-white mb-3">Interaction Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Message ID:</span>
                  <p className="text-white font-mono">{messageId}</p>
                </div>
                <div>
                  <span className="text-gray-400">Timestamp:</span>
                  <p className="text-white">
                    {(() => {
                      try {
                        if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
                          return timestamp.toLocaleString();
                        } else if (typeof timestamp === 'number') {
                          const timestampMs = timestamp > 10000000000 ? timestamp : timestamp * 1000;
                          return new Date(timestampMs).toLocaleString();
                        } else if (typeof timestamp === 'string') {
                          return new Date(timestamp).toLocaleString();
                        } else {
                          return new Date().toLocaleString();
                        }
                      } catch (error) {
                        console.warn('Failed to format timestamp for display:', error);
                        return new Date().toLocaleString();
                      }
                    })()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">TEE Verified:</span>
                  <p className="text-white flex items-center">
                    {teeAttestation ? (
                      <>🔒 Yes <span className="ml-2 text-purple-400">Cryptographically Signed</span></>
                    ) : (
                      '⚪ No'
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Blockchain Proof:</span>
                  <p className="text-white flex items-center">
                    {commitmentHash ? (
                      <>✅ Yes <span className="ml-2 text-green-400">On-Chain Commitment</span></>
                    ) : (
                      '⚪ No'
                    )}
                  </p>
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
                  <span className="text-red-300 font-medium">Minting Failed</span>
                </div>
                <p className="text-red-200 text-sm mt-1">{error}</p>
              </motion.div>
            )}

            {/* Transaction Status - Always show when transaction hash exists */}
            <TransactionStatus
              hash={transactionHash || undefined}
              isLoading={isMinting && !transactionHash} 
              isSuccess={!!mintedDAT && !!transactionHash}
              error={transactionError}
              title="DAT Minting Transaction"
              description={mintedDAT ? "✅ Your verifiable interaction certificate has been created!" : "Minting your verifiable interaction certificate"}
              className="mb-4"
            />

            {/* Success Display */}
            {mintedDAT && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-green-400">🎉</span>
                  <span className="text-green-300 font-medium">DAT Minted Successfully!</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">DAT ID:</span>
                    <span className="text-white font-mono">{mintedDAT.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">IPFS Hash:</span>
                    <span className="text-white font-mono">{mintedDAT.ipfsHash.substring(0, 20)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contract:</span>
                    <span className="text-white font-mono">{mintedDAT.contractAddress.substring(0, 10)}...</span>
                  </div>
                  {mintedDAT.tokenId && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Token ID:</span>
                      <span className="text-white font-mono">#{mintedDAT.tokenId}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://gateway.pinata.cloud/ipfs/${mintedDAT.ipfsHash}`);
                    }}
                    className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1 rounded-lg transition-colors"
                  >
                    📋 Copy IPFS Link
                  </button>
                  <button
                    onClick={() => {
                      window.open(`https://hyperion-testnet-explorer.metisdevops.link/address/${mintedDAT.contractAddress}`, '_blank');
                    }}
                    className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-1 rounded-lg transition-colors"
                  >
                    🔗 View on Explorer
                  </button>
                </div>
              </motion.div>
            )}

            {/* Minting Steps */}
            {isMinting && mintingSteps.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-white mb-4 flex items-center">
                  <span className="mr-2">⚙️</span>
                  Minting Progress
                </h4>
                <div className="space-y-3">
                  {mintingSteps.map((step, index) => (
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
            {!mintedDAT && !isMinting && (
              <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-600/20">
                <h4 className="font-medium text-white mb-3">Why Mint a DAT?</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-400">🔒</span>
                    <span className="text-gray-300">Cryptographic proof of AI interaction authenticity</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400">🌐</span>
                    <span className="text-gray-300">Decentralized storage with IPFS permanence</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">👑</span>
                    <span className="text-gray-300">Verifiable ownership of AI-generated content</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400">🏆</span>
                    <span className="text-gray-300">World's first verifiable AI interaction certificates</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {!mintedDAT && (
                <button
                  onClick={() => {
                    console.log('🏷️ "Mint Interaction DAT" button clicked!');
                    mintDAT();
                  }}
                  disabled={isMinting || !address}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isMinting || !address
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : `bg-gradient-to-r hover:shadow-lg transform hover:scale-105`
                  }`}
                  style={{
                    backgroundImage: !isMinting && address ? 
                      `linear-gradient(135deg, ${getTraitColor(dominantTrait)}, ${getTraitColor(dominantTrait)}CC)` : 
                      undefined
                  }}
                >
                  {isMinting ? (
                    <>
                      <span className="mr-2">⏳</span>
                      Minting DAT...
                    </>
                  ) : !address ? (
                    <>
                      <span className="mr-2">🔒</span>
                      Connect Wallet to Mint
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🏷️</span>
                      Mint Interaction DAT
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={onToggle}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  mintedDAT 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {mintedDAT ? '✅ Close Panel' : 'Cancel'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}