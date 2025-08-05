'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { METAMUSE_ABI, CONTRACTS, PERSONALITY_COLORS, TRAIT_DESCRIPTIONS, API_BASE_URL } from '@/constants';
import { type MuseTraits } from '@/types';
import { PersonalitySlider } from '@/components/ui/PersonalitySlider';
import { MusePreview } from '@/components/ui/MusePreview';
import { MuseAvatar } from '@/components/avatars/MuseAvatar';
import { ThemedContainer } from '@/components/ui/themed/ThemedContainer';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';

export default function CreateMuse() {
  const { isConnected, address } = useAccount();
  const [step, setStep] = useState(1);
  const [traits, setTraits] = useState<MuseTraits>({
    creativity: 50,
    wisdom: 50,
    humor: 50,
    empathy: 50,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Initialize personality theme at top level to avoid hook violations
  const personalityTheme = usePersonalityTheme(traits);

  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleTraitChange = (trait: keyof MuseTraits, value: number) => {
    setTraits(prev => ({ ...prev, [trait]: value }));
  };

  const handleCreateMuse = async () => {
    if (!isConnected) return;
    
    setIsCreating(true);
    try {
      // First, prepare the muse on the backend
      const response = await fetch(`${API_BASE_URL}/api/v1/muses/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(traits),
      });
      
      if (!response.ok) {
        throw new Error('Failed to prepare muse');
      }

      // Then create the NFT on blockchain
      writeContract({
        address: CONTRACTS.MetaMuse,
        abi: METAMUSE_ABI,
        functionName: 'createMuse',
        args: [traits.creativity, traits.wisdom, traits.humor, traits.empathy],
      });
      
    } catch (error) {
      console.error('Error creating muse:', error);
      setIsCreating(false);
    }
  };

  const handlePreviewInteraction = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/muses/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(traits),
      });
      
      if (response.ok) {
        setIsPreviewOpen(true);
      }
    } catch (error) {
      console.error('Error preparing preview:', error);
    }
  };

  const getTraitDescription = (trait: keyof MuseTraits, value: number) => {
    const descriptions = TRAIT_DESCRIPTIONS[trait];
    if (value <= 33) return descriptions.low;
    if (value <= 66) return descriptions.medium;
    return descriptions.high;
  };

  const totalTraits = Object.values(traits).reduce((sum, value) => sum + value, 0);
  const averageTrait = totalTraits / 4;

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-6">
            Connect Your Wallet to Create a Muse
          </h1>
          <p className="text-gray-400 mb-8">
            You need to connect your wallet to create and own your AI companion.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Muse Created Successfully!
          </h1>
          <p className="text-gray-400 mb-8">
            Your AI companion has been minted on the blockchain. You can now start chatting!
          </p>
          <button
            onClick={() => {
              // Navigate to the new muse - we'd need to extract token ID from transaction
              window.location.href = '/gallery';
            }}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
          >
            View My Muses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= stepNumber
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step > stepNumber ? 'bg-purple-500' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <span className="text-gray-400">
              Step {step} of 3: {step === 1 ? 'Define Personality' : step === 2 ? 'Preview & Adjust' : 'Create Muse'}
            </span>
          </div>
        </div>

        {/* Step 1: Personality Design */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                Design Your Muse&apos;s Personality
              </h1>
              <p className="text-xl text-gray-300">
                Customize the four core traits that will define your AI companion&apos;s behavior and responses.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(traits).map(([trait, value]) => (
                <div key={trait} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                  <PersonalitySlider
                    trait={trait as keyof MuseTraits}
                    value={value}
                    onChange={(newValue) => handleTraitChange(trait as keyof MuseTraits, newValue)}
                    color={PERSONALITY_COLORS[trait as keyof typeof PERSONALITY_COLORS]}
                  />
                  <p className="text-sm text-gray-400 mt-3">
                    {getTraitDescription(trait as keyof MuseTraits, value)}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep(2)}
                disabled={averageTrait < 10}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Preview
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                Preview Your Muse
              </h1>
              <p className="text-xl text-gray-300">
                Review your muse&apos;s personality and see how it will behave in conversations.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enhanced Personality Overview */}
              <ThemedContainer
                traits={traits}
                variant="glass"
                intensity="normal"
                animated={true}
              >
                <div className="text-center mb-6">
                  <MuseAvatar
                    traits={traits}
                    tokenId="preview"
                    size="xl"
                    interactive={true}
                    showPersonality={true}
                    showGlow={true}
                    className="mx-auto mb-4"
                  />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {personalityTheme.name}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {personalityTheme.description}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(traits).map(([trait, value]) => {
                    const traitColor = personalityTheme.gradient[Object.keys(traits).indexOf(trait)] || personalityTheme.primary;
                    
                    return (
                      <motion.div 
                        key={trait} 
                        className="flex items-center justify-between"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Object.keys(traits).indexOf(trait) * 0.1 }}
                      >
                        <span className="text-gray-300 capitalize font-medium">{trait}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 h-2.5 bg-gray-700/50 rounded-full overflow-hidden relative">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: traitColor,
                                background: `linear-gradient(90deg, ${traitColor}80, ${traitColor})`,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ delay: Object.keys(traits).indexOf(trait) * 0.1 + 0.5, duration: 0.8, ease: "easeOut" }}
                            />
                            {/* Glow effect for high values */}
                            {value > 70 && (
                              <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                  background: `linear-gradient(90deg, transparent, ${traitColor}40, transparent)`,
                                  boxShadow: `0 0 8px ${traitColor}60`,
                                }}
                                animate={{
                                  opacity: [0.5, 1, 0.5],
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              />
                            )}
                          </div>
                          <span 
                            className="text-white font-bold w-8 text-center"
                            style={{ color: traitColor }}
                          >
                            {value}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ThemedContainer>

              {/* Enhanced Sample Responses */}
              <ThemedContainer
                traits={traits}
                variant="glass"
                intensity="subtle"
                animated={true}
              >
                <h3 className="text-xl font-semibold text-white mb-6">✨ Sample Responses</h3>
                <div className="space-y-4">
                  <motion.div 
                    className="rounded-lg p-4 border border-opacity-20"
                    style={{ 
                      backgroundColor: `${personalityTheme.getPrimaryWithOpacity(0.1)}`,
                      borderColor: personalityTheme.primary,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-sm text-gray-400 mb-2 flex items-center">
                      <span className="mr-2">👤</span>
                      User: &quot;Tell me a joke&quot;
                    </p>
                    <p className="text-white leading-relaxed">
                      {traits.humor > 66
                        ? "Why don't scientists trust atoms? Because they make up everything! 😄 *bounces with excitement* Oh, I've got tons more where that came from!"
                        : traits.humor > 33
                        ? "Here's a light one: What do you call a fake noodle? An impasta! *chuckles softly* Not too bad, right?"
                        : "I could share a humorous observation, though I tend to keep things more serious and focused. Perhaps we could discuss something meaningful instead?"}
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    className="rounded-lg p-4 border border-opacity-20"
                    style={{ 
                      backgroundColor: `${personalityTheme.getSecondaryWithOpacity(0.1)}`,
                      borderColor: personalityTheme.secondary,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-sm text-gray-400 mb-2 flex items-center">
                      <span className="mr-2">👤</span>
                      User: &quot;I&apos;m feeling stressed&quot;
                    </p>
                    <p className="text-white leading-relaxed">
                      {traits.empathy > 66
                        ? "I can sense that weight you're carrying. *offers virtual warmth* Let's take a moment together - what's been on your mind lately? I'm here to listen and support you through this. 💙"
                        : traits.empathy > 33
                        ? "That sounds challenging. What's causing the stress? I'd like to help you work through it step by step."
                        : "Stress is common in today's world. Have you considered specific strategies like time management or prioritization to address the root causes?"}
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    className="rounded-lg p-4 border border-opacity-20"
                    style={{ 
                      backgroundColor: `${personalityTheme.getAccentWithOpacity(0.1)}`,
                      borderColor: personalityTheme.accent,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <p className="text-sm text-gray-400 mb-2 flex items-center">
                      <span className="mr-2">👤</span>
                      User: &quot;What&apos;s the meaning of life?&quot;
                    </p>
                    <p className="text-white leading-relaxed">
                      {traits.wisdom > 66
                        ? "Ah, the eternal question that has captivated minds for millennia. *contemplates deeply* Perhaps meaning isn't found, but created through our connections, growth, and the love we share..."
                        : traits.creativity > 66
                        ? "Life is like a blank canvas waiting for you to paint your unique masterpiece! *gestures expansively* Every experience adds another brushstroke to your story."
                        : "That's a profound philosophical question. Different perspectives throughout history have offered various interpretations. What aspects resonate most with you?"}
                    </p>
                  </motion.div>
                </div>
              </ThemedContainer>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setStep(1)}
                className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Back to Edit
              </button>
              <button
                onClick={handlePreviewInteraction}
                className="border border-purple-500 hover:border-purple-400 text-purple-400 hover:text-purple-300 px-8 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Test Interaction
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Create Muse
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Creation */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="text-center space-y-8"
          >
            <div className="mb-12">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                Mint Your Muse
              </h1>
              <p className="text-xl text-gray-300">
                Create your AI companion as an NFT on the blockchain. This will establish ownership and enable verifiable interactions.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-white mb-6">Transaction Details</h3>
              <div className="space-y-4 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-white">Ethereum</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gas Fee:</span>
                  <span className="text-white">~0.01 ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Wallet:</span>
                  <span className="text-white text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setStep(2)}
                disabled={isPending || isConfirming}
                className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
              >
                Back to Preview
              </button>
              <button
                onClick={handleCreateMuse}
                disabled={isPending || isConfirming}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {isPending || isConfirming ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isPending ? 'Confirm in Wallet...' : 'Creating Muse...'}</span>
                  </>
                ) : (
                  <span>Create My Muse</span>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Preview Modal */}
        {isPreviewOpen && (
          <MusePreview
            traits={traits}
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}
      </div>
    </div>
  );
}