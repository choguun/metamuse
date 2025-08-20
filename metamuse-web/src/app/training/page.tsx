'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MarketplaceStats } from '@/components/training/MarketplaceStats';

export default function TrainingDataMarketplacePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center text-xl">
                🏭
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Training Data Marketplace</h1>
                <p className="text-gray-400">World's first decentralized AI improvement economy</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a
                href="/training/contribute"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                🏭 Contribute Data
              </a>
              <a
                href="/training/validate"
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                🔍 Validate Data
              </a>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
              <div className="text-blue-400 text-xl mb-2">🏆</div>
              <div className="text-lg font-bold text-white">100% Complete</div>
              <div className="text-xs text-blue-300">DAT Integration</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4">
              <div className="text-green-400 text-xl mb-2">🔥</div>
              <div className="text-lg font-bold text-white">Live & Ready</div>
              <div className="text-xs text-green-300">Backend API</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4">
              <div className="text-purple-400 text-xl mb-2">🧠</div>
              <div className="text-lg font-bold text-white">6 Types</div>
              <div className="text-xs text-purple-300">Contribution Categories</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4">
              <div className="text-yellow-400 text-xl mb-2">💰</div>
              <div className="text-lg font-bold text-white">Dynamic</div>
              <div className="text-xs text-yellow-300">DAT Rewards</div>
            </div>
          </div>
        </motion.div>
        
        {/* Marketplace Statistics Dashboard */}
        <MarketplaceStats />
        
        {/* Testing Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gray-900 rounded-xl border border-gray-700 p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">🧪 Testing Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Frontend Components</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <span className="text-green-400">✅</span>
                  <span className="text-gray-300">
                    <a href="/training/contribute" className="text-blue-400 hover:text-blue-300">
                      /training/contribute
                    </a> - Training data contribution interface
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-400">✅</span>
                  <span className="text-gray-300">
                    <a href="/training/validate" className="text-blue-400 hover:text-blue-300">
                      /training/validate
                    </a> - Community validation interface
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-400">✅</span>
                  <span className="text-gray-300">
                    <a href="/dats" className="text-blue-400 hover:text-blue-300">
                      /dats
                    </a> - DAT portfolio and collection
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-400">✅</span>
                  <span className="text-gray-300">
                    <a href="/training" className="text-blue-400 hover:text-blue-300">
                      /training
                    </a> - Marketplace analytics dashboard
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Backend Prerequisites</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <span className="text-yellow-400">⚡</span>
                  <span className="text-gray-300">Backend API running on port 8080</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-yellow-400">🔗</span>
                  <span className="text-gray-300">Wallet connected (for contribution/validation)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-yellow-400">🏷️</span>
                  <span className="text-gray-300">Test muse NFT for interactions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-yellow-400">💾</span>
                  <span className="text-gray-300">IPFS configuration (Pinata keys)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-blue-300 font-medium mb-2">🚀 Quick Start Testing</h4>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Start backend: <code className="bg-gray-800 px-2 py-1 rounded">cd metamuse-api && cargo run</code></li>
              <li>Start frontend: <code className="bg-gray-800 px-2 py-1 rounded">cd metamuse-web && npm run dev</code></li>
              <li>Connect wallet in frontend</li>
              <li>Navigate to training marketplace routes</li>
              <li>Test contribution and validation workflows</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </div>
  );
}