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
            console.log('Validation completed:', { contributionId, approved });
            setValidatedCount(prev => prev + 1);
            
            // Show success message
            const message = approved ? 
              `✅ Contribution ${contributionId} approved! You earned 1 DAT token.` :
              `❌ Contribution ${contributionId} rejected. Feedback provided to contributor.`;
            
            // You could show a toast notification here
            console.log(message);
          }}
        />

        {/* Testing Instructions */}
        <div className="mt-8 bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🧪 Validation Testing Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            
            <div className="space-y-3">
              <h4 className="text-white font-medium">Validation Features to Test:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>📋 <strong>Pending Contributions List</strong> - View all pending validations</li>
                <li>👁️ <strong>Side-by-side Comparison</strong> - Original vs improved data</li>
                <li>✅❌ <strong>Approve/Reject System</strong> - Binary validation decision</li>
                <li>📊 <strong>Quality Scoring</strong> - 0-100 quality assessment slider</li>
                <li>💬 <strong>Validation Feedback</strong> - Optional feedback for contributors</li>
                <li>🎯 <strong>Real-time Updates</strong> - Live contribution status changes</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-white font-medium">Testing Workflow:</h4>
              <ol className="space-y-1 text-gray-300 list-decimal list-inside">
                <li>Connect wallet to access validation interface</li>
                <li>Review pending contributions from left panel</li>
                <li>Click contribution to view details in right panel</li>
                <li>Compare original vs improved data carefully</li>
                <li>Set quality score using the slider (0-100)</li>
                <li>Choose approve ✅ or reject ❌</li>
                <li>Optional: Add validation feedback</li>
                <li>Submit validation to earn 1 DAT token</li>
                <li>Contribution moves from pending to validated</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                <strong>💡 Tip:</strong> You can only validate contributions from other users, not your own. 
                Each validation earns you 1 DAT token regardless of approve/reject decision.
              </p>
            </div>
            
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-300 text-sm">
                <strong>🎯 Quality Guidelines:</strong> Rate based on improvement quality, accuracy, 
                creativity enhancement, and alignment with muse personality traits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}