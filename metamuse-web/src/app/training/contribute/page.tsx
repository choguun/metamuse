'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrainingDataContribution } from '@/components/training/TrainingDataContribution';

export default function TrainingDataContributePage() {
  const router = useRouter();
  const [selectedMuseId, setSelectedMuseId] = useState('1');

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
            <select
              value={selectedMuseId}
              onChange={(e) => setSelectedMuseId(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="1">Muse #1 (Test)</option>
              <option value="2">Muse #2 (Demo)</option>
              <option value="3">Muse #3 (Example)</option>
            </select>
            <span className="text-sm text-gray-500">
              Choose which muse's interactions you want to improve
            </span>
          </div>
        </div>

        {/* Training Data Contribution Component */}
        <TrainingDataContribution
          museId={selectedMuseId}
          originalMessage="This is a sample AI response that could be improved. It's factually correct but could be more engaging and personality-driven."
          improvedMessage="Here's my improved version with better personality, more engaging tone, and enhanced creativity while maintaining accuracy."
          onSuccess={(contributionId, rewardAmount) => {
            console.log('Contribution successful:', { contributionId, rewardAmount });
            // Navigate to marketplace stats or show success message
            setTimeout(() => {
              router.push('/training');
            }, 3000);
          }}
          onClose={() => {
            router.push('/training');
          }}
        />

        {/* Testing Instructions */}
        <div className="mt-8 bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🧪 Testing Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            
            <div className="space-y-3">
              <h4 className="text-white font-medium">Contribution Types to Test:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>✏️ <strong>Conversation Correction</strong> - Fix grammar/accuracy (1.2x reward)</li>
                <li>⭐ <strong>Preference Feedback</strong> - Share behavioral preferences (1.0x reward)</li>
                <li>📊 <strong>Quality Rating</strong> - Rate response helpfulness (1.1x reward)</li>
                <li>🎭 <strong>Personality Tuning</strong> - Enhance personality traits (1.5x reward)</li>
                <li>📚 <strong>Conversation Curation</strong> - Curate valuable examples (1.3x reward)</li>
                <li>🧠 <strong>Semantic Enhancement</strong> - Improve understanding (1.25x reward)</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-white font-medium">Form Features to Test:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>📝 Original/improved data input fields</li>
                <li>🎯 Difficulty level slider (1-10)</li>
                <li>📂 Improvement category selection</li>
                <li>🔗 Reference URLs (optional)</li>
                <li>🏷️ Tags for categorization</li>
                <li>💰 Real-time reward estimation</li>
                <li>📊 Detailed reward calculation breakdown</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">
              <strong>Note:</strong> Make sure the backend API is running on port 8080 and you have a wallet connected. 
              The contribution will be stored on IPFS and may take a few seconds to process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}