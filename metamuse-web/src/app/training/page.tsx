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
      </div>
    </div>
  );
}