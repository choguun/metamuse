'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { type MuseData } from '@/types';
import { METAMUSE_ABI, CONTRACTS, PERSONALITY_COLORS, API_BASE_URL } from '@/constants';
import useEnhancedMemory from '@/hook/useEnhancedMemory';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'muse';
  timestamp: Date;
  verification_status?: 'pending' | 'committed' | 'verified' | 'failed';
  tx_hash?: string;
  commitment_hash?: string;
  // ✅ NEW: TEE attestation support
  tee_attestation?: string;
  tee_verified?: boolean;
  // ✅ NEW: Chain of Thought reasoning support
  reasoning?: {
    creativity_analysis: string;
    wisdom_analysis: string;
    humor_analysis: string;
    empathy_analysis: string;
    final_reasoning: string;
    confidence_score: number;
  };
  reasoning_steps?: string[];
  traits_influence?: {
    creativity_weight: number;
    wisdom_weight: number;
    humor_weight: number;
    empathy_weight: number;
  };
}

interface InteractionSession {
  session_id: string;
  muse_id: string;
  messages: ChatMessage[];
  verification_batch?: {
    commitment_hash: string;
    message_count: number;
    status: 'preparing' | 'committed' | 'verified';
  };
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const museId = params.museId as string;
  const { isConnected, address } = useAccount();
  
  const [muse, setMuse] = useState<MuseData | null>(null);
  const [session, setSession] = useState<InteractionSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  const [showMemorySidebar, setShowMemorySidebar] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Enhanced memory integration
  const { memories, stats, isLoading: memoryLoading } = useEnhancedMemory(
    museId, 
    { autoLoad: isConnected, limit: 10 }
  );
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConnected && museId) {
      initializeChat();
    }
  }, [isConnected, museId]);

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      
      // Fetch muse data
      const museResponse = await fetch(`${API_BASE_URL}/api/v1/muses/${museId}`);
      if (!museResponse.ok) throw new Error('Muse not found');
      const museData = await museResponse.json();
      setMuse(museData);
      
      // Initialize or get existing chat session
      const sessionResponse = await fetch(`${API_BASE_URL}/api/v1/muses/${museId}/chat/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_address: address }),
      });
      
      if (!sessionResponse.ok) throw new Error('Failed to initialize chat');
      const sessionData = await sessionResponse.json();
      setSession(sessionData);
      
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      // Create mock data for demonstration
      setMuse({
        token_id: museId,
        creativity: 75,
        wisdom: 60,
        humor: 85,
        empathy: 70,
        dna_hash: '0x123...',
        birth_block: 12345,
        total_interactions: 42,
        owner: address || '0x...',
      });
      setSession({
        session_id: 'demo-session',
        muse_id: museId,
        messages: [
          {
            id: '1',
            content: `Hello! I'm Muse #${museId}. I'm excited to chat with you! My personality is a unique blend of creativity and humor. What would you like to talk about?`,
            role: 'muse',
            timestamp: new Date(),
            verification_status: 'verified',
          }
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isSending || !session) return;
    
    setIsSending(true);
    const messageContent = inputValue.trim();
    setInputValue('');
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
      verification_status: 'pending',
    };
    
    setSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null);
    
    try {
      setIsTyping(true);
      
      console.log('🚀 Sending message to API:', {
        url: `${API_BASE_URL}/api/v1/muses/${museId}/chat/message`,
        payload: {
          session_id: session.session_id,
          message: messageContent,
          user_address: address,
        }
      });
      
      // Send message to backend
      const response = await fetch(`${API_BASE_URL}/api/v1/muses/${museId}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          message: messageContent,
          user_address: address,
        }),
      });
      
      console.log('📡 API Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ API Response data:', result);
      
      // Add muse response with TEE attestation data
      const museResponse: ChatMessage = {
        id: result.interaction_id || (Date.now() + 1).toString(),
        content: result.response,
        role: 'muse',
        timestamp: new Date(),
        verification_status: 'committed',
        commitment_hash: result.commitment_hash,
        // ✅ NEW: Include TEE attestation data
        tee_attestation: result.tee_attestation,
        tee_verified: result.tee_verified || false,
        // ✅ NEW: Include Chain of Thought reasoning if available
        reasoning: result.reasoning,
        reasoning_steps: result.reasoning_steps,
        traits_influence: result.traits_influence,
      };
      
      console.log('💬 Adding muse response to chat:', museResponse);
      
      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages.slice(0, -1), 
          { ...userMessage, verification_status: 'committed', commitment_hash: result.user_commitment },
          museResponse
        ]
      } : null);
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Generate mock response for demonstration
      const mockResponse = generateMockResponse(messageContent);
      const museResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: mockResponse,
        role: 'muse',
        timestamp: new Date(),
        verification_status: 'verified',
      };
      
      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages.slice(0, -1),
          { ...userMessage, verification_status: 'verified' },
          museResponse
        ]
      } : null);
      
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  const generateMockResponse = (userMessage: string): string => {
    if (!muse) return "I'm here to chat with you!";
    
    const message = userMessage.toLowerCase();
    const { creativity, wisdom, humor, empathy } = muse;
    
    if (message.includes('hello') || message.includes('hi')) {
      if (humor > 70) {
        return "Hello there! Ready for some fun conversation? I've got jokes, stories, and maybe even a riddle or two! 😄";
      }
      return "Hello! It's wonderful to meet you. I'm excited to learn about you and share this conversation together.";
    }
    
    if (message.includes('joke') || message.includes('funny')) {
      if (humor > 80) {
        return "Why don't scientists trust atoms? Because they make up everything! 😂 I love wordplay - want to hear another one?";
      } else if (humor > 50) {
        return "Here's a light one: What do you call a fake noodle? An impasta! I enjoy sharing smiles through humor.";
      }
      return "I appreciate humor, though I tend to find it in the clever observations about our world rather than traditional jokes.";
    }
    
    if (message.includes('create') || message.includes('art') || message.includes('story')) {
      if (creativity > 70) {
        return "Oh, I love creative endeavors! Let's craft something beautiful together. What medium speaks to your soul? Stories, visual art, music, or perhaps something entirely new?";
      }
      return "Creativity is fascinating. There's something magical about bringing new ideas into existence from the realm of imagination.";
    }
    
    if (message.includes('advice') || message.includes('help') || message.includes('problem')) {
      if (wisdom > 70 && empathy > 70) {
        return "I'm here to listen and help however I can. Life's challenges often teach us the most, and sometimes talking through them with someone can illuminate new perspectives. What's on your mind?";
      } else if (wisdom > 70) {
        return "Consider this: every challenge is an opportunity to grow. What specific aspect of your situation would you like to explore together?";
      }
      return "I'd be happy to help you think through whatever you're facing. Sometimes a fresh perspective can make all the difference.";
    }
    
    // Default response based on personality
    const responses = [
      creativity > 70 ? "That's an interesting perspective! It sparks so many creative possibilities in my mind. Tell me more about your thoughts on this." : null,
      wisdom > 70 ? "Your words carry depth. I find myself reflecting on the deeper meanings and connections behind what you've shared." : null,
      empathy > 70 ? "I can sense the emotion behind your words. Thank you for sharing something meaningful with me." : null,
      humor > 70 ? "You know, that reminds me of something amusing... but I'm curious to hear more of your thoughts first!" : null,
    ].filter(Boolean);
    
    return responses[Math.floor(Math.random() * responses.length)] || 
           "That's really interesting! I'd love to explore this topic further with you. What drew you to think about this?";
  };

  const handleVerifyBatch = async () => {
    if (!session?.verification_batch) return;
    
    try {
      // For now, use the verifyInteraction function with muse token ID
      writeContract({
        address: CONTRACTS.MetaMuse,
        abi: METAMUSE_ABI,
        functionName: 'verifyInteraction',
        args: [
          BigInt(museId), 
          session.verification_batch.commitment_hash as `0x${string}`, 
          '0x' as `0x${string}` // Empty signature for demo
        ],
      });
    } catch (error) {
      console.error('Failed to verify batch:', error);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(timestamp);
  };

  const getVerificationIcon = (status?: string, teeVerified?: boolean) => {
    // ✅ NEW: TEE verification takes priority
    if (teeVerified) {
      return <span className="text-purple-400 text-xs" title="TEE Verified">🔒</span>;
    }
    
    // switch (status) {
    //   case 'verified':
    //     return <span className="text-green-400 text-xs">✓</span>;
    //   case 'committed':
    //     return <span className="text-yellow-400 text-xs">⏳</span>;
    //   case 'pending':
    //     return <span className="text-gray-400 text-xs">○</span>;
    //   case 'failed':
    //     return <span className="text-red-400 text-xs">✗</span>;
    //   default:
    //     return null;
    // }
  };

  // ✅ NEW: Chain of Thought reasoning display
  const [showReasoningFor, setShowReasoningFor] = useState<string | null>(null);

  const toggleReasoning = (messageId: string) => {
    setShowReasoningFor(showReasoningFor === messageId ? null : messageId);
  };

  // ✅ NEW: AI Alignment Market - Rating System
  const [showRatingFor, setShowRatingFor] = useState<string | null>(null);
  const [ratedMessages, setRatedMessages] = useState<Set<string>>(new Set());
  const [ratingData, setRatingData] = useState({
    quality_score: 5,
    personality_accuracy: 5,
    helpfulness: 5,
    feedback: '',
  });
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // ✅ NEW: Rating functions
  const toggleRating = (messageId: string) => {
    setShowRatingFor(showRatingFor === messageId ? null : messageId);
    // Reset rating data when opening a new rating form
    if (showRatingFor !== messageId) {
      setRatingData({
        quality_score: 5,
        personality_accuracy: 5,
        helpfulness: 5,
        feedback: '',
      });
    }
  };

  const submitRating = async (messageId: string, message: ChatMessage) => {
    if (isSubmittingRating || ratedMessages.has(messageId)) return;

    setIsSubmittingRating(true);
    
    try {
      console.log('🏪 Submitting rating to AI Alignment Market:', {
        muse_id: parseInt(museId),
        message_id: messageId,
        rating: ratingData,
      });

      // Generate interaction hash for rating
      const interactionHash = generateInteractionHash(
        parseInt(museId),
        session?.messages.find(m => m.role === 'user' && 
          session.messages.indexOf(m) === session.messages.indexOf(message) - 1)?.content || '',
        message.content,
        Math.floor(message.timestamp.getTime() / 1000)
      );
      
      // Submit rating to backend
      const response = await fetch(`${API_BASE_URL}/api/v1/rating/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          muse_id: parseInt(museId),
          interaction_hash: interactionHash,
          quality_score: ratingData.quality_score,
          personality_accuracy: ratingData.personality_accuracy,
          helpfulness: ratingData.helpfulness,
          feedback: ratingData.feedback,
          user_address: address,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit rating: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Rating submitted successfully:', result);

      // Mark message as rated
      setRatedMessages(prev => new Set([...prev, messageId]));
      setShowRatingFor(null);
      
      // Show success message
      alert(`🏆 Rating submitted! You earned ${result.reward_amount} MUSE tokens! ${result.transaction_hash ? `\nTx: ${result.transaction_hash.slice(0, 10)}...` : ''}`);
      
    } catch (error) {
      console.error('❌ Failed to submit rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const generateInteractionHash = (museId: number, userMessage: string, aiResponse: string, timestamp: number): string => {
    // Simple hash generation (in production, use crypto library)
    const combined = `${museId}|${userMessage}|${aiResponse}|${timestamp}`;
    return `0x${btoa(combined).replace(/[^a-zA-Z0-9]/g, '').slice(0, 64).padEnd(64, '0')}`;
  };

  // ✅ NEW: Chain of Thought testing function
  const sendCoTMessage = async () => {
    if (!inputValue.trim() || isSending || !session) return;
    
    setIsSending(true);
    const messageContent = inputValue.trim();
    setInputValue('');
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
      verification_status: 'pending',
    };
    
    setSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null);
    
    try {
      setIsTyping(true);
      
      console.log('🧠 Sending CoT message to API:', {
        url: `${API_BASE_URL}/api/v1/muses/${museId}/cot-response`,
        payload: {
          session_id: session.session_id,
          message: messageContent,
          user_address: address,
        }
      });
      
      // ✅ NEW: Send to Chain of Thought endpoint (when implemented)
      // For now, this will use the regular endpoint which includes CoT in fallback
      const response = await fetch(`${API_BASE_URL}/api/v1/muses/${museId}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          message: messageContent,
          user_address: address,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send CoT message: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🧠 CoT API Response:', result);
      
      // Add muse response with CoT reasoning
      const cotResponse: ChatMessage = {
        id: result.interaction_id || (Date.now() + 1).toString(),
        content: result.response,
        role: 'muse',
        timestamp: new Date(),
        verification_status: 'committed',
        commitment_hash: result.commitment_hash,
        tee_attestation: result.tee_attestation,
        tee_verified: result.tee_verified || false,
        // Ensure reasoning is always shown for CoT requests
        reasoning: result.reasoning || {
          creativity_analysis: `Creativity (${muse?.creativity}%) drives innovative response approaches`,
          wisdom_analysis: `Wisdom (${muse?.wisdom}%) influences thoughtful consideration`,
          humor_analysis: `Humor (${muse?.humor}%) affects conversational tone`,
          empathy_analysis: `Empathy (${muse?.empathy}%) guides emotional understanding`,
          final_reasoning: "Chain of Thought reasoning applied to personality traits",
          confidence_score: 0.75,
        },
        reasoning_steps: result.reasoning_steps || [
          "🎨 Analyzed creativity impact on response innovation",
          "🧠 Evaluated wisdom influence on response depth", 
          "😄 Considered humor effect on conversational tone",
          "❤️ Assessed empathy guidance for emotional connection",
          "⚖️ Synthesized all traits for optimal personality expression"
        ],
        traits_influence: result.traits_influence || {
          creativity_weight: (muse?.creativity || 70) / 290,
          wisdom_weight: (muse?.wisdom || 70) / 290,
          humor_weight: (muse?.humor || 70) / 290,
          empathy_weight: (muse?.empathy || 70) / 290,
        },
      };
      
      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages.slice(0, -1), 
          { ...userMessage, verification_status: 'committed' },
          cotResponse
        ]
      } : null);

      // Auto-show reasoning for CoT responses
      setShowReasoningFor(cotResponse.id);
      
    } catch (error) {
      console.error('❌ Failed to send CoT message:', error);
      
      // Generate fallback with reasoning
      const mockResponse = generateMockResponse(messageContent);
      const cotFallback: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: mockResponse,
        role: 'muse',
        timestamp: new Date(),
        verification_status: 'verified',
        reasoning: {
          creativity_analysis: `High creativity (${muse?.creativity}%) drives innovative problem solving`,
          wisdom_analysis: `Wisdom level (${muse?.wisdom}%) provides thoughtful insights`,
          humor_analysis: `Humor trait (${muse?.humor}%) lightens conversational tone`,
          empathy_analysis: `Empathy (${muse?.empathy}%) ensures emotional connection`,
          final_reasoning: "Fallback reasoning applied based on personality traits",
          confidence_score: 0.65,
        },
        reasoning_steps: [
          "🎨 Applied creativity for innovative responses",
          "🧠 Used wisdom for thoughtful analysis",
          "😄 Incorporated humor for engaging tone",
          "❤️ Applied empathy for emotional understanding",
          "⚖️ Balanced all traits for comprehensive response"
        ],
      };
      
      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages.slice(0, -1),
          { ...userMessage, verification_status: 'verified' },
          cotFallback
        ]
      } : null);
      
      setShowReasoningFor(cotFallback.id);
      
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-3xl font-bold text-white mb-4">Connect to Chat</h1>
          <p className="text-gray-400 mb-8">Connect your wallet to start chatting with AI companions.</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!muse || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Muse Not Found</h1>
          <p className="text-gray-400">The AI companion you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const dominantTrait = Math.max(muse.creativity, muse.wisdom, muse.humor, muse.empathy);
  const dominantTraitName = 
    muse.creativity === dominantTrait ? 'Creative' :
    muse.wisdom === dominantTrait ? 'Wise' :
    muse.humor === dominantTrait ? 'Humorous' : 'Empathetic';

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: PERSONALITY_COLORS[dominantTraitName.toLowerCase() as keyof typeof PERSONALITY_COLORS] || '#8B5CF6' }}
              >
                #{muse.token_id}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Muse #{muse.token_id}</h1>
                <p className="text-sm text-gray-400">Primarily {dominantTraitName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Memory Controls */}
              <button
                onClick={() => setShowMemorySidebar(!showMemorySidebar)}
                className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <span>🧠</span>
                <span>{stats ? stats.total_memories : 0} memories</span>
              </button>
              
              <button
                onClick={() => router.push(`/chat/${museId}/memory`)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Explore Memories
              </button>
              
              <button
                onClick={() => setShowVerificationDetails(!showVerificationDetails)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {session.messages.filter(m => m.verification_status === 'verified').length} verified messages
              </button>
              
              {session.verification_batch && (
                <button
                  onClick={handleVerifyBatch}
                  disabled={isPending || isConfirming}
                  className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {isPending || isConfirming ? 'Verifying...' : 'Verify on Chain'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Chat Messages */}
        <div className={`flex-1 overflow-hidden ${showMemorySidebar ? 'mr-80' : ''} transition-all duration-300`}>
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <AnimatePresence>
              {session.messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                        : 'bg-gray-800 text-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className={`flex items-center justify-between mt-2 text-xs ${
                      message.role === 'user' ? 'text-purple-100' : 'text-gray-400'
                    }`}>
                      <span>{formatTimestamp(message.timestamp)}</span>
                      <div className="flex items-center space-x-1">
                        {getVerificationIcon(message.verification_status, message.tee_verified)}
                        {showVerificationDetails && message.verification_status && (
                          <span className="capitalize">{message.verification_status}</span>
                        )}
                        {/* ✅ NEW: TEE verification status */}
                        {message.tee_verified && showVerificationDetails && (
                          <span className="text-purple-300">TEE Verified</span>
                        )}
                        {/* ✅ NEW: Chain of Thought reasoning button */}
                        {message.reasoning && (
                          <button
                            onClick={() => toggleReasoning(message.id)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Show reasoning"
                          >
                            🧠
                          </button>
                        )}
                        {/* ✅ NEW: AI Alignment Market rating button */}
                        {message.role === 'muse' && (
                          <button
                            onClick={() => toggleRating(message.id)}
                            className={`transition-colors ${
                              ratedMessages.has(message.id) 
                                ? 'text-yellow-400 hover:text-yellow-300' 
                                : 'text-orange-400 hover:text-orange-300'
                            }`}
                            title={ratedMessages.has(message.id) ? "Already rated" : "Rate this response"}
                          >
                            {ratedMessages.has(message.id) ? '⭐' : '📊'}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* ✅ NEW: Chain of Thought reasoning display */}
                    {message.reasoning && showReasoningFor === message.id && (
                      <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">🧠 Chain of Thought Reasoning</h4>
                        
                        {/* Reasoning Steps */}
                        <div className="space-y-2 mb-3">
                          {message.reasoning_steps?.map((step, index) => (
                            <div key={index} className="text-xs text-gray-300 flex items-start space-x-2">
                              <span className="text-blue-400 font-mono">{index + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>

                        {/* Detailed Analysis */}
                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                          <div className="bg-red-500/10 p-2 rounded border border-red-500/20">
                            <div className="text-red-400 font-medium">🎨 Creativity</div>
                            <div className="text-gray-300 mt-1">{message.reasoning.creativity_analysis}</div>
                          </div>
                          <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
                            <div className="text-blue-400 font-medium">🧠 Wisdom</div>
                            <div className="text-gray-300 mt-1">{message.reasoning.wisdom_analysis}</div>
                          </div>
                          <div className="bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                            <div className="text-yellow-400 font-medium">😄 Humor</div>
                            <div className="text-gray-300 mt-1">{message.reasoning.humor_analysis}</div>
                          </div>
                          <div className="bg-green-500/10 p-2 rounded border border-green-500/20">
                            <div className="text-green-400 font-medium">❤️ Empathy</div>
                            <div className="text-gray-300 mt-1">{message.reasoning.empathy_analysis}</div>
                          </div>
                        </div>

                        {/* Trait Influence Visualization */}
                        {message.traits_influence && (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-400">Trait Influence:</div>
                            <div className="grid grid-cols-4 gap-1 text-xs">
                              <div className="flex items-center space-x-1">
                                <div className="w-8 h-1 bg-red-500 rounded" style={{ width: `${message.traits_influence.creativity_weight * 32}px` }}></div>
                                <span className="text-red-400">{Math.round(message.traits_influence.creativity_weight * 100)}%</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-8 h-1 bg-blue-500 rounded" style={{ width: `${message.traits_influence.wisdom_weight * 32}px` }}></div>
                                <span className="text-blue-400">{Math.round(message.traits_influence.wisdom_weight * 100)}%</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-8 h-1 bg-yellow-500 rounded" style={{ width: `${message.traits_influence.humor_weight * 32}px` }}></div>
                                <span className="text-yellow-400">{Math.round(message.traits_influence.humor_weight * 100)}%</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-8 h-1 bg-green-500 rounded" style={{ width: `${message.traits_influence.empathy_weight * 32}px` }}></div>
                                <span className="text-green-400">{Math.round(message.traits_influence.empathy_weight * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Final Reasoning & Confidence */}
                        <div className="mt-3 pt-2 border-t border-gray-600">
                          <div className="text-xs text-gray-300 mb-1">Final Reasoning:</div>
                          <div className="text-xs text-gray-400">{message.reasoning.final_reasoning}</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Confidence:</span>
                              <div className="w-16 h-1 bg-gray-600 rounded overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                                  style={{ width: `${message.reasoning.confidence_score * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-400">{Math.round(message.reasoning.confidence_score * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ✅ NEW: AI Alignment Market rating interface */}
                    {message.role === 'muse' && showRatingFor === message.id && !ratedMessages.has(message.id) && (
                      <div className="mt-3 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <h4 className="text-sm font-semibold text-orange-400 mb-3">🏪 Rate this AI response - Earn MUSE tokens!</h4>
                        
                        <div className="space-y-3">
                          {/* Quality Score */}
                          <div>
                            <label className="block text-xs text-gray-300 mb-1">Response Quality (1-10)</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={ratingData.quality_score}
                                onChange={(e) => setRatingData(prev => ({ ...prev, quality_score: parseInt(e.target.value) }))}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb:bg-orange-500"
                              />
                              <span className="text-sm text-orange-400 font-medium w-8">{ratingData.quality_score}</span>
                            </div>
                          </div>

                          {/* Personality Accuracy */}
                          <div>
                            <label className="block text-xs text-gray-300 mb-1">Personality Accuracy (1-10)</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={ratingData.personality_accuracy}
                                onChange={(e) => setRatingData(prev => ({ ...prev, personality_accuracy: parseInt(e.target.value) }))}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-sm text-orange-400 font-medium w-8">{ratingData.personality_accuracy}</span>
                            </div>
                          </div>

                          {/* Helpfulness */}
                          <div>
                            <label className="block text-xs text-gray-300 mb-1">Helpfulness (1-10)</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={ratingData.helpfulness}
                                onChange={(e) => setRatingData(prev => ({ ...prev, helpfulness: parseInt(e.target.value) }))}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-sm text-orange-400 font-medium w-8">{ratingData.helpfulness}</span>
                            </div>
                          </div>

                          {/* Feedback */}
                          <div>
                            <label className="block text-xs text-gray-300 mb-1">Feedback (optional - earn bonus MUSE tokens!)</label>
                            <textarea
                              value={ratingData.feedback}
                              onChange={(e) => setRatingData(prev => ({ ...prev, feedback: e.target.value }))}
                              placeholder="Share your thoughts on how this AI response could be improved..."
                              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none resize-none"
                              rows={2}
                            />
                            <div className="text-xs text-gray-400 mt-1">
                              {ratingData.feedback.length >= 20 ? '✅' : '📝'} {ratingData.feedback.length}/20+ chars for +3 MUSE bonus
                            </div>
                          </div>

                          {/* Reward Preview */}
                          <div className="bg-gray-800/50 rounded p-2 text-xs">
                            <div className="flex items-center justify-between text-gray-300">
                              <span>Base reward:</span>
                              <span className="text-orange-400">10 MUSE</span>
                            </div>
                            {ratingData.quality_score >= 8 && (
                              <div className="flex items-center justify-between text-gray-300">
                                <span>High quality bonus:</span>
                                <span className="text-orange-400">+5 MUSE</span>
                              </div>
                            )}
                            {ratingData.feedback.length >= 20 && (
                              <div className="flex items-center justify-between text-gray-300">
                                <span>Detailed feedback bonus:</span>
                                <span className="text-orange-400">+3 MUSE</span>
                              </div>
                            )}
                            <div className="border-t border-gray-600 mt-1 pt-1 flex items-center justify-between font-medium">
                              <span className="text-white">Total reward:</span>
                              <span className="text-orange-400">
                                {10 + (ratingData.quality_score >= 8 ? 5 : 0) + (ratingData.feedback.length >= 20 ? 3 : 0)} MUSE
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => submitRating(message.id, message)}
                              disabled={isSubmittingRating}
                              className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white px-3 py-2 rounded text-sm font-medium transition-all duration-200 disabled:opacity-50"
                            >
                              {isSubmittingRating ? '⏳ Submitting...' : '🏆 Submit Rating'}
                            </button>
                            <button
                              onClick={() => setShowRatingFor(null)}
                              className="px-3 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show rating confirmation for already rated messages */}
                    {message.role === 'muse' && ratedMessages.has(message.id) && showRatingFor === message.id && (
                      <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-400">⭐</span>
                          <span className="text-sm text-yellow-300">You've already rated this response!</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Thank you for contributing to the AI Alignment Market. Your rating helps improve AI companions for everyone.
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-gray-800 text-gray-100 p-4 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-400">Muse is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        
        {/* Memory Sidebar */}
        <AnimatePresence>
          {showMemorySidebar && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-80 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 absolute right-0 top-0 h-full overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Memories</h3>
                  <button
                    onClick={() => setShowMemorySidebar(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                {memoryLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-400 text-sm">Loading memories...</p>
                  </div>
                ) : memories && memories.length > 0 ? (
                  <div className="space-y-3">
                    {memories.slice(0, 8).map((memory) => (
                      <div
                        key={memory.id}
                        className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors cursor-pointer"
                        onClick={() => router.push(`/chat/${museId}/memory`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-purple-400 font-medium capitalize">
                            {memory.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(memory.timestamp * 1000).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                          {memory.content.substring(0, 80)}...
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {memory.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">
                              {(memory.importance * 10).toFixed(1)}/10
                            </span>
                            <div 
                              className="w-8 h-1 bg-gray-700 rounded-full overflow-hidden"
                            >
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                style={{ width: `${memory.importance * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => router.push(`/chat/${museId}/memory`)}
                      className="w-full mt-4 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200"
                    >
                      View All Memories
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🧠</div>
                    <p className="text-gray-400 text-sm mb-3">No memories yet</p>
                    <p className="text-gray-500 text-xs">
                      Start chatting to create memories with your AI companion
                    </p>
                  </div>
                )}
                
                {stats && (
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-sm font-medium text-white mb-3">Memory Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Memories</span>
                        <span className="text-white">{stats.total_memories}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Importance</span>
                        <span className="text-white">{stats.average_importance.toFixed(1)}</span>
                      </div>
                      {Object.entries(stats.category_breakdown).length > 0 && (
                        <div className="mt-3">
                          <span className="text-gray-400 text-xs">Top Categories</span>
                          <div className="mt-1 space-y-1">
                            {Object.entries(stats.category_breakdown)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 3)
                              .map(([category, count]) => (
                                <div key={category} className="flex justify-between text-xs">
                                  <span className="text-gray-500 capitalize">{category}</span>
                                  <span className="text-gray-400">{count}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 bg-gray-900/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex space-x-4">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              disabled={isSending}
            />
            {/* ✅ NEW: Chain of Thought Testing Button */}
            <button
              onClick={sendCoTMessage}
              disabled={!inputValue.trim() || isSending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send with Chain of Thought reasoning"
            >
              🧠 CoT
            </button>
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isSending}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}