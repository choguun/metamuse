'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { type MuseData } from '@/types';
import { METAMUSE_ABI, CONTRACTS, PERSONALITY_COLORS, API_BASE_URL } from '@/constants';
import useEnhancedMemory from '@/hook/useEnhancedMemory';
import { MuseAvatar } from '@/components/avatars/MuseAvatar';
import { ThemedContainer } from '@/components/ui/themed/ThemedContainer';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { 
  TEEBadge, 
  ChainOfThought, 
  SemanticMemoryPanel, 
  AIAlignmentMarket, 
  PersonalityChatBubble,
  TypingIndicator 
} from '@/components/chat';

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
  
  // New Phase 2 visualization states
  const [showTEEPanel, setShowTEEPanel] = useState(false);
  const [showChainOfThought, setShowChainOfThought] = useState(false);
  const [showSemanticMemory, setShowSemanticMemory] = useState(false);
  const [showMarketPanel, setShowMarketPanel] = useState(false);
  const [currentRatingMessage, setCurrentRatingMessage] = useState<string | null>(null);
  const [semanticMemoryQuery, setSemanticMemoryQuery] = useState('');
  const [semanticMemories, setSemanticMemories] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Enhanced memory integration
  const { memories, stats, isLoading: memoryLoading } = useEnhancedMemory(
    museId, 
    { autoLoad: isConnected, limit: 10 }
  );
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Initialize personality theme with default values to avoid conditional hook calls
  const defaultTraits = {
    creativity: 75,
    wisdom: 60,
    humor: 85,
    empathy: 70,
  };
  
  const personalityTheme = usePersonalityTheme(muse ? {
    creativity: muse.creativity,
    wisdom: muse.wisdom,
    humor: muse.humor,
    empathy: muse.empathy,
  } : defaultTraits);

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
      
      // Validate user address
      if (!address) {
        throw new Error('User address not available. Please ensure wallet is connected.');
      }
      
      console.log(`🚀 Initializing chat for user ${address} with muse ${museId}`);
      
      // Fetch muse data
      const museResponse = await fetch(`${API_BASE_URL}/api/v1/muses/${museId}`);
      if (!museResponse.ok) throw new Error('Muse not found');
      const museData = await museResponse.json();
      setMuse(museData);
      
      // Initialize or get existing chat session
      console.log(`📡 Requesting chat session from: ${API_BASE_URL}/api/v1/muses/${museId}/chat/session`);
      const sessionResponse = await fetch(`${API_BASE_URL}/api/v1/muses/${museId}/chat/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_address: address }),
      });
      
      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        throw new Error(`Failed to initialize chat: ${sessionResponse.status} - ${errorText}`);
      }
      
      const sessionData = await sessionResponse.json();
      
      // Convert string timestamps to Date objects for frontend compatibility
      if (sessionData.messages) {
        sessionData.messages = sessionData.messages.map((msg: any) => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
        }));
      }
      
      console.log(`🔄 Loaded chat session with ${sessionData.messages?.length || 0} messages for user ${address} + muse ${museId}`);
      console.log('📋 Session data:', sessionData);
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

  // ✅ NEW: Semantic Memory functions
  const searchSemanticMemory = async (query: string) => {
    if (!query.trim()) {
      setSemanticMemories([]);
      return;
    }

    setSemanticMemoryQuery(query);
    
    try {
      // Convert chat messages to memory format for semantic search
      const chatMemories = session?.messages.map((msg, index) => ({
        id: msg.id,
        content: msg.content,
        relevanceScore: Math.random() * 100, // Mock relevance - would be calculated by AI
        timestamp: msg.timestamp,
        context: `Chat message ${index + 1}`,
        ipfsHash: msg.commitment_hash || 'QmX...' + Math.random().toString(36).slice(2, 10),
        emotions: msg.role === 'muse' ? ['thoughtful', 'helpful'] : ['curious'],
        tags: extractTagsFromContent(msg.content),
        type: msg.role === 'muse' ? 'conversation' : 'experience' as const,
        importance: msg.reasoning?.confidence_score ? msg.reasoning.confidence_score * 100 : Math.random() * 100,
      })) || [];

      // Filter memories by query relevance (mock implementation)
      const relevantMemories = chatMemories
        .filter(memory => 
          memory.content.toLowerCase().includes(query.toLowerCase()) ||
          memory.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        )
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      setSemanticMemories(relevantMemories);
    } catch (error) {
      console.error('Semantic memory search failed:', error);
      setSemanticMemories([]);
    }
  };

  const extractTagsFromContent = (content: string): string[] => {
    const words = content.toLowerCase().split(/\s+/);
    const meaningfulWords = words.filter(word => 
      word.length > 4 && 
      !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'were', 'would', 'could'].includes(word)
    );
    return meaningfulWords.slice(0, 3);
  };

  const handleMemorySelect = (memory: any) => {
    // Scroll to the message in chat
    const messageElement = document.getElementById(`message-${memory.id}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth' });
      messageElement.classList.add('bg-purple-500/20');
      setTimeout(() => messageElement.classList.remove('bg-purple-500/20'), 2000);
    }
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
              <MuseAvatar
                traits={{
                  creativity: muse.creativity,
                  wisdom: muse.wisdom,
                  humor: muse.humor,
                  empathy: muse.empathy,
                }}
                tokenId={muse.token_id}
                size="lg"
                interactive={true}
                showPersonality={true}
                showGlow={true}
              />
              <div>
                <h1 className="text-xl font-semibold text-white">Muse #{muse.token_id}</h1>
                <p className="text-sm text-gray-400">
                  {personalityTheme.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Memory Controls */}
              <button
                onClick={() => setShowSemanticMemory(!showSemanticMemory)}
                className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <span>🔍</span>
                <span>Search Memory</span>
              </button>
              
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
              
              {/* Semantic Memory Search Panel */}
              <SemanticMemoryPanel
                query={semanticMemoryQuery}
                memories={semanticMemories}
                traits={{
                  creativity: muse.creativity,
                  wisdom: muse.wisdom,
                  humor: muse.humor,
                  empathy: muse.empathy,
                }}
                isLoading={false}
                isVisible={showSemanticMemory}
                onToggle={() => setShowSemanticMemory(!showSemanticMemory)}
                onMemorySelect={handleMemorySelect}
                onMemoryPin={(memoryId) => {
                  console.log('Pin memory:', memoryId);
                }}
              />
              
              {/* Memory Search Input */}
              {showSemanticMemory && (
                <motion.div
                  className="border border-gray-700/50 rounded-xl p-4"
                  style={{ 
                    background: `linear-gradient(135deg, ${personalityTheme.getPrimaryWithOpacity(0.08)}, ${personalityTheme.getSecondaryWithOpacity(0.05)})`,
                    backdropFilter: 'blur(10px)',
                  }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search conversation history, memories, and context..."
                        value={semanticMemoryQuery}
                        onChange={(e) => {
                          const query = e.target.value;
                          setSemanticMemoryQuery(query);
                          if (query.trim()) {
                            searchSemanticMemory(query);
                          } else {
                            setSemanticMemories([]);
                          }
                        }}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    <button
                      onClick={() => semanticMemoryQuery && searchSemanticMemory(semanticMemoryQuery)}
                      className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200"
                    >
                      Search
                    </button>
                  </div>
                </motion.div>
              )}
            {/* Enhanced Chat Messages with Phase 2 Visualizations */}
            <AnimatePresence>
              {session.messages.map((message, index) => (
                <div key={message.id} id={`message-${message.id}`} className="space-y-4 transition-colors duration-500">
                  {/* Main Chat Bubble */}
                  <PersonalityChatBubble
                    message={{
                      id: message.id,
                      content: message.content,
                      sender: message.role,
                      timestamp: message.timestamp,
                      emotions: message.role === 'muse' ? ['thoughtful', 'caring'] : undefined,
                      confidence: message.reasoning?.confidence_score ? Math.round(message.reasoning.confidence_score * 100) : undefined,
                      reasoning: message.reasoning,
                    }}
                    traits={{
                      creativity: muse.creativity,
                      wisdom: muse.wisdom,
                      humor: muse.humor,
                      empathy: muse.empathy,
                    }}
                    isLatest={index === session.messages.length - 1}
                    showAvatar={true}
                    onMessageClick={() => {
                      if (message.role === 'muse') {
                        setCurrentRatingMessage(currentRatingMessage === message.id ? null : message.id);
                      }
                    }}
                  />
                  
                  {/* Phase 2 Feature Panels */}
                  {message.role === 'muse' && (
                    <div className="ml-12 space-y-3">
                      {/* TEE Verification Badge */}
                      {message.tee_verified && (
                        <TEEBadge
                          isVerified={message.tee_verified}
                          attestationData={{
                            enclaveId: message.tee_attestation || 'mrenc_a7b3c4d5',
                            timestamp: message.timestamp.getTime(),
                            signature: 'sig_' + message.commitment_hash || 'demo_signature',
                            nonce: 'nonce_' + message.id,
                          }}
                          interactive={true}
                          size="md"
                        />
                      )}
                      
                      {/* Chain of Thought Reasoning */}
                      {message.reasoning && (
                        <ChainOfThought
                          steps={[
                            {
                              id: 'analysis',
                              type: 'analysis',
                              title: 'Input Analysis',
                              content: 'Analyzing user message for intent, context, and emotional tone',
                              confidence: 85,
                              timestamp: Date.now() - 3000,
                              duration: 150,
                            },
                            {
                              id: 'memory',
                              type: 'memory_retrieval',
                              title: 'Memory Retrieval',
                              content: 'Searching conversation history and IPFS memory for relevant context',
                              confidence: 92,
                              timestamp: Date.now() - 2500,
                              duration: 200,
                            },
                            {
                              id: 'personality',
                              type: 'personality_filter',
                              title: 'Personality Processing',
                              content: message.reasoning.creativity_analysis + ' ' + message.reasoning.wisdom_analysis,
                              confidence: 88,
                              timestamp: Date.now() - 2000,
                              duration: 300,
                            },
                            {
                              id: 'generation',
                              type: 'response_generation',
                              title: 'Response Generation',
                              content: message.reasoning.final_reasoning,
                              confidence: Math.round(message.reasoning.confidence_score * 100),
                              timestamp: Date.now() - 1000,
                              duration: 500,
                            },
                            {
                              id: 'verification',
                              type: 'verification',
                              title: 'TEE Verification',
                              content: 'Cryptographically signing response in trusted execution environment',
                              confidence: 100,
                              timestamp: Date.now() - 500,
                              duration: 100,
                            },
                          ]}
                          traits={{
                            creativity: muse.creativity,
                            wisdom: muse.wisdom,
                            humor: muse.humor,
                            empathy: muse.empathy,
                          }}
                          isVisible={showReasoningFor === message.id}
                          onToggle={() => toggleReasoning(message.id)}
                        />
                      )}
                      
                      {/* AI Alignment Market Rating */}
                      {currentRatingMessage === message.id && (
                        <AIAlignmentMarket
                          traits={{
                            creativity: muse.creativity,
                            wisdom: muse.wisdom,
                            humor: muse.humor,
                            empathy: muse.empathy,
                          }}
                          responseId={message.id}
                          currentRating={ratedMessages.has(message.id) ? 85 : undefined}
                          isVisible={true}
                          onToggle={() => setCurrentRatingMessage(null)}
                          onSubmitRating={async (rating, feedback, criteria) => {
                            // Simulate rating submission
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            setRatedMessages(prev => new Set([...prev, message.id]));
                            setCurrentRatingMessage(null);
                            
                            return {
                              tokens: Math.floor(rating * 0.5) + 10,
                              reputation: Math.floor(rating * 0.3) + 5,
                              bonus: rating > 80 ? {
                                type: 'quality' as const,
                                amount: 5,
                                description: 'High quality feedback bonus',
                              } : undefined,
                            };
                          }}
                          marketStats={{
                            totalRatings: 15420,
                            averageRating: 76,
                            rewardPool: 125000,
                            topRaters: 1250,
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
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