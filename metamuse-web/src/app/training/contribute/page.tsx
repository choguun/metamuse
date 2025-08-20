'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrainingDataContribution } from '@/components/training/TrainingDataContribution';

export default function TrainingDataContributePage() {
  const router = useRouter();
  const [selectedMuseId, setSelectedMuseId] = useState('');

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div className="w-12 h-12 rounded-full bg-green-500/30 flex items-center justify-center text-xl">
              🏭
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Contribute Training Data</h1>
              <p className="text-gray-400">
                Help improve AI by contributing high-quality training data and earn DAT tokens
              </p>
            </div>
          </div>
          
          {/* Quick Navigation */}
          <div className="flex items-center space-x-4 text-sm">
            <a href="/training" className="text-blue-400 hover:text-blue-300">
              📊 Marketplace Stats
            </a>
            <a href="/training/validate" className="text-purple-400 hover:text-purple-300">
              🔍 Validate Data
            </a>
            <a href="/dats" className="text-green-400 hover:text-green-300">
              🏷️ My DATs
            </a>
          </div>
        </div>

        {/* Muse Selection */}
        <div className="mb-8 bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Select Muse for Training Data</h2>
          <div className="flex items-center space-x-4">
            <label className="text-gray-400">Muse ID:</label>
            <input
              type="number"
              min="1"
              value={selectedMuseId}
              onChange={(e) => setSelectedMuseId(e.target.value)}
              placeholder="Enter muse ID"
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
            <span className="text-sm text-gray-500">
              Choose which muse's interactions you want to improve
            </span>
          </div>
        </div>

        {/* Training Data Contribution Component */}
        {selectedMuseId && (
          <TrainingDataContribution
            museId={selectedMuseId}
            onSuccess={(contributionId, rewardAmount) => {
              // Navigate to marketplace stats or show success message
              setTimeout(() => {
                router.push('/training');
              }, 3000);
            }}
            onClose={() => {
              router.push('/training');
            }}
          />
        )}
        
        {!selectedMuseId && (
          <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-700">
            <div className="text-4xl mb-4">🏭</div>
            <h3 className="text-xl font-semibold text-white mb-2">Select a Muse to Start Contributing</h3>
            <p className="text-gray-400">
              Enter the ID of the muse you want to improve above to begin contributing training data.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}