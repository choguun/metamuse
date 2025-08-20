'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { TransactionStatus } from './TransactionStatus';

interface TransactionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash?: string;
  transactionType: string;
  title: string;
  description: string;
  additionalDetails?: {
    datId?: string;
    ipfsHash?: string;
    contractAddress?: string;
    tokenId?: string;
  };
}

export function TransactionResultModal({
  isOpen,
  onClose,
  transactionHash,
  transactionType,
  title,
  description,
  additionalDetails,
}: TransactionResultModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    <p className="text-gray-400 text-sm">{description}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Transaction Status */}
                <TransactionStatus
                  hash={transactionHash as `0x${string}` | undefined}
                  isLoading={false}
                  isSuccess={!!transactionHash}
                  error={undefined}
                  title={`${transactionType} Transaction`}
                  description="View your transaction on the blockchain"
                  className=""
                />

                {/* Additional Details */}
                {additionalDetails && (
                  <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                    <h3 className="text-white font-medium">Transaction Details</h3>
                    
                    {additionalDetails.datId && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">DAT ID:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-mono text-sm">
                            {additionalDetails.datId}
                          </span>
                          <button
                            onClick={() => copyToClipboard(additionalDetails.datId!)}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                            title="Copy DAT ID"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    )}

                    {additionalDetails.ipfsHash && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">IPFS Hash:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-mono text-sm">
                            {additionalDetails.ipfsHash.substring(0, 12)}...{additionalDetails.ipfsHash.slice(-8)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(additionalDetails.ipfsHash!)}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                            title="Copy IPFS Hash"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    )}

                    {additionalDetails.contractAddress && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Contract:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-mono text-sm">
                            {additionalDetails.contractAddress.substring(0, 8)}...{additionalDetails.contractAddress.slice(-6)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(additionalDetails.contractAddress!)}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                            title="Copy Contract Address"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    )}

                    {additionalDetails.tokenId && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Token ID:</span>
                        <span className="text-white font-mono">#{additionalDetails.tokenId}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Copy Success Indicator */}
                <AnimatePresence>
                  {copied && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center space-x-2 text-green-400"
                    >
                      <span>✅</span>
                      <span className="text-sm">Copied to clipboard!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center p-6 border-t border-gray-700">
                <div className="text-gray-400 text-sm">
                  🎉 Transaction completed successfully!
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  ✅ Got It!
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}