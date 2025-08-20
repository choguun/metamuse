'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import api from '@/lib/api';

interface DAT {
  dat_id: string;
  ipfs_hash: string;
  contract_address: string;
  token_id: string;
  interaction_data: {
    message_id: string;
    session_id: string;
    user_message: string;
    ai_response: string;
    timestamp: number;
    user_address: string;
  };
  tee_verified: boolean;
  blockchain_verified: boolean;
  created_at: number;
}

interface DATStats {
  total_dats_minted: number;
  total_tee_verified: number;
  total_blockchain_verified: number;
  active_users: number;
  total_ipfs_storage: number;
}

export default function DATPortfolioPage() {
  const { address, isConnected } = useAccount();
  const [userDATs, setUserDATs] = useState<DAT[]>([]);
  const [platformStats, setPlatformStats] = useState<DATStats | null>(null);
  const [selectedDAT, setSelectedDAT] = useState<DAT | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      loadUserDATs();
    }
    loadPlatformStats();
  }, [address, isConnected]);

  const loadUserDATs = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.dat.getUserDATs(address);
      setUserDATs(response.dats || []);
    } catch (error) {
      console.error('Failed to load user DATs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load DATs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlatformStats = async () => {
    try {
      const stats = await api.dat.getStats();
      setPlatformStats(stats);
    } catch (error) {
      console.error('Failed to load platform stats:', error);
    }
  };

  const verifyDAT = async (datId: string) => {
    try {
      const result = await api.dat.verify(datId);
      console.log('DAT verification result:', result);
      // Update the DAT status in the list
      setUserDATs(prev => prev.map(dat => 
        dat.dat_id === datId 
          ? { ...dat, tee_verified: result.verification_details.tee_verified, blockchain_verified: result.verification_details.blockchain_verified }
          : dat
      ));
    } catch (error) {
      console.error('DAT verification failed:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatStorage = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-xl border border-gray-700 p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to view your DAT collection and portfolio statistics.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center text-xl">
              🏷️
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">DAT Portfolio</h1>
              <p className="text-gray-400">
                Your collection of Data Anchoring Tokens - verifiable AI interaction certificates
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Connected:</span>
              <span className="text-white font-mono">{formatAddress(address!)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">DATs Owned:</span>
              <span className="text-purple-400 font-semibold">{userDATs.length}</span>
            </div>
          </div>
        </div>

        {/* Platform Statistics */}
        {platformStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4"
            >
              <div className="text-blue-400 text-xl mb-2">📊</div>
              <div className="text-lg font-bold text-white">{platformStats.total_dats_minted.toLocaleString()}</div>
              <div className="text-xs text-blue-300">Total DATs Minted</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4"
            >
              <div className="text-green-400 text-xl mb-2">🔒</div>
              <div className="text-lg font-bold text-white">{platformStats.total_tee_verified.toLocaleString()}</div>
              <div className="text-xs text-green-300">TEE Verified</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4"
            >
              <div className="text-purple-400 text-xl mb-2">⛓️</div>
              <div className="text-lg font-bold text-white">{platformStats.total_blockchain_verified.toLocaleString()}</div>
              <div className="text-xs text-purple-300">Blockchain Verified</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4"
            >
              <div className="text-yellow-400 text-xl mb-2">👥</div>
              <div className="text-lg font-bold text-white">{platformStats.active_users.toLocaleString()}</div>
              <div className="text-xs text-yellow-300">Active Users</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 rounded-xl p-4"
            >
              <div className="text-cyan-400 text-xl mb-2">💾</div>
              <div className="text-lg font-bold text-white">{formatStorage(platformStats.total_ipfs_storage)}</div>
              <div className="text-xs text-cyan-300">IPFS Storage</div>
            </motion.div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-white">Loading your DAT collection...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">❌</span>
              <span className="text-red-300 font-medium">Error Loading DATs</span>
            </div>
            <p className="text-red-200 text-sm mt-1">{error}</p>
            <button
              onClick={loadUserDATs}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* DAT Collection */}
        {!isLoading && !error && (
          <>
            {userDATs.length === 0 ? (
              <div className="bg-gray-900 rounded-xl border border-gray-700 p-12 text-center">
                <div className="text-6xl mb-4">🏷️</div>
                <h3 className="text-xl font-semibold text-white mb-2">No DATs Yet</h3>
                <p className="text-gray-400 mb-6">
                  Start chatting with muses and mint DATs to build your collection of verifiable AI interactions.
                </p>
                <a
                  href="/explore"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <span className="mr-2">💬</span>
                  Start Chatting
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* DAT List */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Your DAT Collection</h2>
                    <span className="text-sm text-gray-400">{userDATs.length} DATs</span>
                  </div>
                  
                  <div className="space-y-4">
                    {userDATs.map((dat, index) => (
                      <motion.div
                        key={dat.dat_id || `dat-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedDAT(dat)}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedDAT?.dat_id === dat.dat_id
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-gray-700 hover:border-gray-600 bg-gray-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
                              🏷️
                            </div>
                            <div>
                              <h3 className="font-medium text-white">DAT #{dat.token_id}</h3>
                              <p className="text-xs text-gray-400">{dat.dat_id}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {dat.tee_verified && (
                              <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded" title="TEE Verified">
                                🔒 TEE
                              </span>
                            )}
                            {dat.blockchain_verified && (
                              <span className="text-blue-400 text-xs bg-blue-500/20 px-2 py-1 rounded" title="Blockchain Verified">
                                ⛓️ Chain
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-gray-300 mb-2">
                          "{dat.interaction_data?.user_message?.substring(0, 80) || 'No message preview available'}..."
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{formatDate(dat.created_at)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              verifyDAT(dat.dat_id);
                            }}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            🔍 Verify
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* DAT Details Panel */}
                <div className="lg:col-span-1">
                  <h2 className="text-xl font-semibold text-white mb-4">DAT Details</h2>
                  
                  {selectedDAT ? (
                    <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center text-xl">
                          🏷️
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">DAT #{selectedDAT.token_id}</h3>
                          <p className="text-sm text-gray-400">Verified AI Interaction</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Verification Status */}
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2">Verification Status</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                              <span className="text-gray-400 text-sm">TEE Attestation:</span>
                              <span className={`text-sm ${selectedDAT.tee_verified ? 'text-green-400' : 'text-gray-500'}`}>
                                {selectedDAT.tee_verified ? '✅ Verified' : '⚪ Not Verified'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                              <span className="text-gray-400 text-sm">Blockchain Proof:</span>
                              <span className={`text-sm ${selectedDAT.blockchain_verified ? 'text-blue-400' : 'text-gray-500'}`}>
                                {selectedDAT.blockchain_verified ? '✅ Verified' : '⚪ Not Verified'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Interaction Data */}
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2">Interaction Data</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">User Message:</label>
                              <div className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded max-h-20 overflow-y-auto">
                                {selectedDAT.interaction_data?.user_message || 'No user message available'}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">AI Response:</label>
                              <div className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded max-h-20 overflow-y-auto">
                                {selectedDAT.interaction_data?.ai_response || 'No AI response available'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2">Metadata</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Created:</span>
                              <span className="text-white">{formatDate(selectedDAT.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Session ID:</span>
                              <span className="text-white font-mono">{selectedDAT.interaction_data?.session_id || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">IPFS Hash:</span>
                              <span className="text-white font-mono">{selectedDAT.ipfs_hash?.substring(0, 20) || 'N/A'}...</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              if (selectedDAT.ipfs_hash) {
                                navigator.clipboard.writeText(`https://gateway.pinata.cloud/ipfs/${selectedDAT.ipfs_hash}`);
                              }
                            }}
                            className="flex-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-2 rounded-lg transition-colors"
                          >
                            📋 Copy IPFS Link
                          </button>
                          <button
                            onClick={() => {
                              if (selectedDAT.contract_address) {
                                window.open(`https://hyperion-testnet-explorer.metisdevops.link/address/${selectedDAT.contract_address}`, '_blank');
                              }
                            }}
                            className="flex-1 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-2 rounded-lg transition-colors"
                          >
                            🔗 View Contract
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-900 rounded-xl border border-gray-700 p-8 text-center">
                      <div className="text-4xl mb-3">👈</div>
                      <h3 className="text-lg font-semibold text-white mb-2">Select a DAT</h3>
                      <p className="text-gray-400">
                        Click on a DAT from your collection to view detailed information
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}