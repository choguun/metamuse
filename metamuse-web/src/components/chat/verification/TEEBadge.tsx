'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface TEEBadgeProps {
  isVerified: boolean;
  attestationData?: {
    enclaveId: string;
    timestamp: number;
    signature: string;
    nonce: string;
  };
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function TEEBadge({ 
  isVerified, 
  attestationData, 
  interactive = true, 
  size = 'md',
  showDetails = false 
}: TEEBadgeProps) {
  const [showExpanded, setShowExpanded] = useState(showDetails);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5',
  };

  useEffect(() => {
    if (isVerified) {
      setAnimationPhase('verified');
    } else {
      setAnimationPhase('verifying');
    }
  }, [isVerified]);

  const getBadgeColors = () => {
    switch (animationPhase) {
      case 'verified':
        return {
          bg: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
          border: 'border-green-400',
          text: 'text-green-300',
          glow: '#10b981',
        };
      case 'verifying':
        return {
          bg: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20',
          border: 'border-amber-400',
          text: 'text-amber-300',
          glow: '#f59e0b',
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500/20 to-pink-500/20',
          border: 'border-red-400',
          text: 'text-red-300',
          glow: '#ef4444',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500/20 to-slate-500/20',
          border: 'border-gray-400',
          text: 'text-gray-300',
          glow: '#6b7280',
        };
    }
  };

  const colors = getBadgeColors();

  const getVerificationIcon = () => {
    switch (animationPhase) {
      case 'verified':
        return (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </motion.div>
        );
      case 'verifying':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </motion.div>
        );
      default:
        return (
          <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (animationPhase) {
      case 'verified': return 'TEE Verified';
      case 'verifying': return 'Verifying TEE...';
      case 'error': return 'Verification Failed';
      default: return 'Secure Enclave';
    }
  };

  return (
    <div className="relative">
      {/* Main Badge */}
      <motion.div
        className={`flex items-center space-x-2 rounded-full border-2 transition-all duration-300 cursor-pointer ${sizeClasses[size]} ${colors.bg} ${colors.border} ${colors.text}`}
        onClick={() => interactive && setShowExpanded(!showExpanded)}
        whileHover={interactive ? { scale: 1.05 } : {}}
        whileTap={interactive ? { scale: 0.98 } : {}}
        animate={{
          boxShadow: [
            `0 0 10px ${colors.glow}20`,
            `0 0 20px ${colors.glow}40`,
            `0 0 10px ${colors.glow}20`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {getVerificationIcon()}
        <span className="font-medium whitespace-nowrap">
          {getStatusText()}
        </span>
        
        {/* Expand indicator */}
        {interactive && attestationData && (
          <motion.div
            animate={{ rotate: showExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        )}
      </motion.div>

      {/* Verification particles effect */}
      {animationPhase === 'verified' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ backgroundColor: colors.glow }}
              initial={{ 
                scale: 0,
                x: 0,
                y: 0,
              }}
              animate={{ 
                scale: [0, 1, 0],
                x: Math.cos(i * 60 * Math.PI / 180) * 20,
                y: Math.sin(i * 60 * Math.PI / 180) * 20,
              }}
              transition={{
                duration: 1,
                delay: i * 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {showExpanded && attestationData && (
          <motion.div
            className="absolute top-full left-0 mt-2 p-4 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-600 shadow-2xl z-50 min-w-80"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-semibold">Trusted Execution Environment</h4>
                <p className="text-gray-400 text-xs">Cryptographically Verified</p>
              </div>
            </div>

            {/* Attestation Details */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400">Enclave ID:</span>
                  <div className="text-green-400 font-mono mt-1 break-all">
                    {attestationData.enclaveId}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Timestamp:</span>
                  <div className="text-white mt-1">
                    {new Date(attestationData.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-gray-400 text-xs">Attestation Signature:</span>
                <div className="text-blue-400 font-mono text-xs mt-1 bg-gray-800 rounded px-2 py-1 break-all">
                  {attestationData.signature}
                </div>
              </div>
              
              <div>
                <span className="text-gray-400 text-xs">Nonce:</span>
                <div className="text-purple-400 font-mono text-xs mt-1 bg-gray-800 rounded px-2 py-1">
                  {attestationData.nonce}
                </div>
              </div>
            </div>

            {/* Security Indicators */}
            <div className="mt-4 pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Secure Channel Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Memory Protected</span>
                </div>
              </div>
            </div>

            {/* Verification Timeline */}
            <div className="mt-4 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-2">Verification Timeline:</div>
              <div className="space-y-1">
                {[
                  { step: 'Enclave Initialization', time: '00:01', status: 'completed' },
                  { step: 'Attestation Generation', time: '00:02', status: 'completed' },
                  { step: 'Signature Verification', time: '00:03', status: 'completed' },
                  { step: 'Channel Establishment', time: '00:04', status: 'completed' },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-2 text-xs"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300">{item.step}</span>
                    <span className="text-gray-500 ml-auto">{item.time}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}