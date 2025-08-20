'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrainingDataValidation } from '@/components/training/TrainingDataValidation';

export default function TrainingDataValidationPage() {
  const router = useRouter();
  const [validatedCount, setValidatedCount] = useState(0);

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
            <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center text-xl">
              🔍
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Validate Training Data</h1>
              <p className="text-gray-400">
                Review and validate community contributions to improve AI training data quality
              </p>
            </div>
          </div>
          
          {/* Quick Navigation */}
          <div className="flex items-center space-x-4 text-sm">
            <a href="/training" className="text-blue-400 hover:text-blue-300">
              📊 Marketplace Stats
            </a>
            <a href="/training/contribute" className="text-green-400 hover:text-green-300">
              🏭 Contribute Data
            </a>
            <a href="/dats" className="text-purple-400 hover:text-purple-300">
              🏷️ My DATs
            </a>
          </div>
        </div>

        {/* Validation Stats */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4">
            <div className="text-purple-400 text-xl mb-2">🔍</div>
            <div className="text-lg font-bold text-white">{validatedCount}</div>
            <div className="text-xs text-purple-300">Validations Complete</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
            <div className="text-blue-400 text-xl mb-2">💰</div>
            <div className="text-lg font-bold text-white">{validatedCount} DAT</div>
            <div className="text-xs text-blue-300">Tokens Earned</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4">
            <div className="text-green-400 text-xl mb-2">⭐</div>
            <div className="text-lg font-bold text-white">85%</div>
            <div className="text-xs text-green-300">Quality Score Avg</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4">
            <div className="text-yellow-400 text-xl mb-2">🏆</div>
            <div className="text-lg font-bold text-white">Top 10%</div>
            <div className="text-xs text-yellow-300">Validator Ranking</div>
          </div>
        </div>

        {/* Training Data Validation Component */}
        <TrainingDataValidation
          onValidationComplete={(contributionId, approved) => {
            setValidatedCount(prev => prev + 1);
            
            // Show success message
            const message = approved ? 
              `✅ Contribution ${contributionId} approved! You earned 1 DAT token.` :
              `❌ Contribution ${contributionId} rejected. Feedback provided to contributor.`;
            
            // You could show a toast notification here instead
          }}
        />

      </div>
    </div>
  );
}