'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWaitForTransactionReceipt } from 'wagmi';

interface TransactionStatusProps {
  hash?: `0x${string}`;
  isLoading?: boolean;
  isSuccess?: boolean;
  error?: Error | null;
  title?: string;
  description?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

const METIS_EXPLORER_URL = 'https://hyperion-testnet-explorer.metisdevops.link';

export function TransactionStatus({
  hash,
  isLoading,
  isSuccess,
  error,
  title = "Transaction",
  description,
  onSuccess,
  onError,
  className = ""
}: TransactionStatusProps) {
  const [copied, setCopied] = useState(false);

  // Watch for transaction confirmation if hash is provided
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash: hash || undefined,
  });

  // Determine current state
  const finalIsLoading = isLoading || isConfirming;
  const finalIsSuccess = isSuccess || isConfirmed;
  const finalError = error || receiptError;

  useEffect(() => {
    if (finalIsSuccess && onSuccess) {
      onSuccess();
    }
  }, [finalIsSuccess, onSuccess]);

  useEffect(() => {
    if (finalError && onError) {
      onError(finalError);
    }
  }, [finalError, onError]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const getStatusColor = () => {
    if (finalError) return 'from-red-500/20 to-red-600/20 border-red-500/30';
    if (finalIsSuccess) return 'from-green-500/20 to-green-600/20 border-green-500/30';
    if (finalIsLoading) return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
    return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  };

  const getStatusIcon = () => {
    if (finalError) return '❌';
    if (finalIsSuccess) return '✅';
    if (finalIsLoading) return '⏳';
    return '📄';
  };

  const getStatusText = () => {
    if (finalError) return 'Failed';
    if (finalIsSuccess) return 'Confirmed';
    if (finalIsLoading) return 'Confirming...';
    return 'Pending';
  };

  const getStatusTextColor = () => {
    if (finalError) return 'text-red-300';
    if (finalIsSuccess) return 'text-green-300';
    if (finalIsLoading) return 'text-blue-300';
    return 'text-gray-300';
  };

  return (
    <AnimatePresence>
      {(hash || finalIsLoading || finalError) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className={`bg-gradient-to-r ${getStatusColor()} border rounded-xl p-4 ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{getStatusIcon()}</span>
              <div>
                <h4 className="text-white font-medium">{title}</h4>
                {description && (
                  <p className="text-gray-400 text-sm">{description}</p>
                )}
              </div>
            </div>
            <div className={`text-sm font-medium ${getStatusTextColor()}`}>
              {getStatusText()}
            </div>
          </div>

          {/* Transaction Hash */}
          {hash && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">Transaction:</span>
                <button
                  onClick={() => copyToClipboard(hash)}
                  className="text-white hover:text-blue-300 transition-colors font-mono"
                  title="Click to copy full hash"
                >
                  {truncateHash(hash)}
                </button>
                {copied && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-green-400 text-xs"
                  >
                    Copied!
                  </motion.span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <a
                  href={`${METIS_EXPLORER_URL}/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg text-purple-200 hover:text-white transition-all duration-200 text-sm"
                >
                  <span>🔍</span>
                  <span>View on Explorer</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                <button
                  onClick={() => copyToClipboard(hash)}
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-600/30 hover:bg-gray-600/40 border border-gray-500/30 rounded-lg text-gray-200 hover:text-white transition-all duration-200 text-sm"
                >
                  <span>📋</span>
                  <span>Copy Hash</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {finalIsLoading && (
            <div className="flex items-center space-x-2 mt-3">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-300 text-sm">
                {hash ? 'Waiting for confirmation...' : 'Preparing transaction...'}
              </span>
            </div>
          )}

          {/* Error Display */}
          {finalError && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <span className="text-red-400 text-sm">⚠️</span>
                <div className="text-red-200 text-sm">
                  <div className="font-medium mb-1">Transaction Failed</div>
                  <div className="text-red-300 text-xs">
                    {finalError.message || 'An unknown error occurred'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Actions */}
          {finalIsSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg"
            >
              <div className="flex items-center space-x-2 text-green-200 text-sm">
                <span>🎉</span>
                <span>Transaction confirmed successfully!</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simplified version for inline display
export function TransactionHashLink({ hash, className = "" }: { hash: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={copyToClipboard}
        className="text-blue-400 hover:text-blue-300 transition-colors font-mono text-sm"
        title="Click to copy full hash"
      >
        {truncateHash(hash)}
      </button>
      {copied && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="text-green-400 text-xs"
        >
          Copied!
        </motion.span>
      )}
      <a
        href={`${METIS_EXPLORER_URL}/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-400 hover:text-purple-300 transition-colors"
        title="View on Metis Explorer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}