'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { type MuseData } from '@/types';
import { METAMUSE_ABI, CONTRACTS, PERSONALITY_COLORS, API_BASE_URL } from '@/constants';
import useEnhancedMemory from '@/hook/useEnhancedMemory';
import api from '@/lib/api';
import { MuseAvatar } from '@/components/avatars/MuseAvatar';
import { ThemedContainer } from '@/components/ui/themed/ThemedContainer';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { 
  TEEBadge, 
  ChainOfThought, 
  SemanticMemoryPanel, 
  AIAlignmentMarket, 
  PersonalityChatBubble,
  TypingIndicator,
  DATMintingPanel
} from '@/components/chat';
import { TransactionStatus } from '@/components/ui/TransactionStatus';
import { TransactionResultModal } from '@/components/ui/TransactionResultModal';
import dynamic from 'next/dynamic';

// Dynamic import of the chat page to prevent SSR issues
const DynamicClientOnlyChatPage = dynamic(() => Promise.resolve(ClientOnlyChatPage), {
  ssr: false,
  loading: () => (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading chat...</p>
      </div>
    </div>
  ),
});

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
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

// Client-only wrapper for wagmi-dependent chat functionality
function ClientOnlyChatPage() {
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
  
  // New Phase 2 visualization states with persistence
  const [showTEEPanel, setShowTEEPanel] = useState(false);
  const [showChainOfThought, setShowChainOfThought] = useState(false);
  const [showSemanticMemory, setShowSemanticMemory] = useState(false);
  const [showMarketPanel, setShowMarketPanel] = useState(false);
  const [currentRatingMessage, setCurrentRatingMessage] = useState<string | null>(() => {
    // Restore rating panel state from sessionStorage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`ratingPanel-${museId}`);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [semanticMemoryQuery, setSemanticMemoryQuery] = useState('');
  const [semanticMemories, setSemanticMemories] = useState<any[]>([]);
  const [marketStats, setMarketStats] = useState<{
    totalRatings: number;
    averageRating: number;
    rewardPool: number;
    topRaters: number;
  } | undefined>(undefined);
  
  // Transaction state for rating submissions
  const [ratingTransactionHash, setRatingTransactionHash] = useState<`0x${string}` | null>(null);
  const [ratingTransactionError, setRatingTransactionError] = useState<Error | null>(null);
  const [showRatingTransaction, setShowRatingTransaction] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Enhanced memory integration
  const { memories, stats, isLoading: memoryLoading, error: memoryError } = useEnhancedMemory(
    museId, 
    { autoLoad: isConnected }
  );

  // Debug memory state
  useEffect(() => {
    if (memories) {
      console.log('💾 Memory state updated:', {
        count: memories.length,
        memories: memories.slice(0, 3), // Show first 3 for debugging
        stats,
        loading: memoryLoading,
        error: memoryError
      });
    }
  }, [memories, stats, memoryLoading, memoryError]);
  
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
      fetchMarketStats();
    }
  }, [isConnected, museId]);


  const fetchMarketStats = async () => {
    try {
      const stats = await api.rating.getPlatformStats();
      setMarketStats({
        totalRatings: stats.total_ratings,
        averageRating: 76, // We'll calculate this from muse stats if needed
        rewardPool: stats.total_rewards_distributed,
        topRaters: stats.total_users,
      });
    } catch (error) {
      console.error('Failed to fetch market stats:', error);
      setMarketStats(undefined);
    }
  };

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
      
      // Enhanced timestamp processing with comprehensive validation
      if (sessionData.messages) {
        sessionData.messages = sessionData.messages.map((msg: any) => {
          let timestamp: Date;
          let conversionMethod = 'unknown';
          
          console.log(`🔍 Processing message timestamp - Type: ${typeof msg.timestamp}, Value:`, msg.timestamp);
          
          if (msg.timestamp instanceof Date && !isNaN(msg.timestamp.getTime())) {
            // Valid Date object
            timestamp = msg.timestamp;
            conversionMethod = 'valid_date_object';
          } else if (typeof msg.timestamp === 'number') {
            // Unix timestamp (seconds or milliseconds)
            const timestampMs = msg.timestamp > 10000000000 ? msg.timestamp : msg.timestamp * 1000;
            timestamp = new Date(timestampMs);
            conversionMethod = `unix_${msg.timestamp > 10000000000 ? 'ms' : 's'}`;
          } else if (typeof msg.timestamp === 'string') {
            // ISO string or other string format
            const parsedTimestamp = new Date(msg.timestamp);
            if (!isNaN(parsedTimestamp.getTime())) {
              timestamp = parsedTimestamp;
              conversionMethod = 'string_parsed';
            } else {
              console.warn(`⚠️ Invalid timestamp string for message ${msg.id}:`, msg.timestamp);
              timestamp = new Date();
              conversionMethod = 'fallback_current';
            }
          } else {
            // Invalid or unsupported format
            console.warn(`⚠️ Unsupported timestamp type for message ${msg.id}:`, typeof msg.timestamp, msg.timestamp);
            timestamp = new Date();
            conversionMethod = 'fallback_unsupported';
          }
          
          // Final validation of the resulting Date
          if (!timestamp || isNaN(timestamp.getTime())) {
            console.error(`❌ All timestamp conversion failed for message ${msg.id}, using current time as last resort`);
            timestamp = new Date();
            conversionMethod = 'fallback_failed';
          }
          
          console.log(`✅ Message ${msg.id} timestamp processed: ${timestamp.toISOString()} (method: ${conversionMethod})`);
          
          return {
            ...msg,
            timestamp,
            _timestamp_conversion: conversionMethod, // Debug info
          };
        });
      }
      
      console.log(`🔄 Loaded chat session with ${sessionData.messages?.length || 0} messages for user ${address} + muse ${museId}`);
      console.log('📋 Session data:', sessionData);
      setSession(sessionData);
      
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      // Show error state - no mock data
      setMuse(null);
      setSession(null);
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
        role: 'assistant',
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
      
      // Update user message with error status
      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages.slice(0, -1),
          { ...userMessage, verification_status: 'failed' }
        ]
      } : null);
      
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
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

  // ✅ NEW: DAT status indicator
  const getDATStatusIcon = (message: ChatMessage) => {
    if (mintedDATs.has(message.id)) {
      return <span className="text-green-400 text-xs ml-2" title="DAT Minted">🏷️</span>;
    }
    if (datMintingInProgress.has(message.id)) {
      return <span className="text-yellow-400 text-xs ml-2" title="DAT Minting in Progress">⏳</span>;
    }
    if (isEligibleForDAT(message)) {
      return <span className="text-blue-400 text-xs ml-2" title="Eligible for DAT - Click to mint">📜</span>;
    }
    return null;
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
        relevanceScore: msg.reasoning?.confidence_score ? msg.reasoning.confidence_score * 100 : 50,
        timestamp: msg.timestamp,
        context: `Chat message ${index + 1}`,
        ipfsHash: msg.commitment_hash || undefined,
        emotions: msg.role === 'assistant' ? ['thoughtful', 'helpful'] : ['curious'],
        tags: extractTagsFromContent(msg.content),
        type: msg.role === 'assistant' ? 'conversation' : 'experience' as const,
        importance: msg.reasoning?.confidence_score ? msg.reasoning.confidence_score * 100 : 50,
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
  const [ratedMessages, setRatedMessages] = useState<Set<string>>(() => {
    // Restore rated messages state from localStorage (persistent across sessions)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`ratedMessages-${museId}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [ratingData, setRatingData] = useState({
    quality_score: 5,
    personality_accuracy: 5,
    helpfulness: 5,
    feedback: '',
  });
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // ✅ NEW: DAT Minting System with persistence
  const [showDATMintingFor, setShowDATMintingFor] = useState<string | null>(() => {
    // Restore DAT minting panel state from sessionStorage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`datPanel-${museId}`);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [mintedDATs, setMintedDATs] = useState<Set<string>>(() => {
    // Restore minted DATs state from localStorage (persistent across sessions)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`mintedDATs-${museId}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [datMintingInProgress, setDATMintingInProgress] = useState<Set<string>>(new Set());

  // Transaction Result Modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionResult, setTransactionResult] = useState<{
    hash?: string;
    type: string;
    title: string;
    description: string;
    details?: {
      datId?: string;
      ipfsHash?: string;
      contractAddress?: string;
      tokenId?: string;
    };
  } | null>(null);

  // Toast notification state
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  } | null>(null);

  // ✅ NEW: All useEffects after state declarations to prevent initialization errors
  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastNotification({ message, type, visible: true });
    setTimeout(() => {
      setToastNotification(prev => prev ? { ...prev, visible: false } : null);
      setTimeout(() => setToastNotification(null), 300);
    }, 3000);
  };

  // ✅ NEW: Persist panel states to prevent disappearing on refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentRatingMessage) {
        sessionStorage.setItem(`ratingPanel-${museId}`, JSON.stringify(currentRatingMessage));
      } else {
        sessionStorage.removeItem(`ratingPanel-${museId}`);
      }
    }
  }, [currentRatingMessage, museId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (showDATMintingFor) {
        sessionStorage.setItem(`datPanel-${museId}`, JSON.stringify(showDATMintingFor));
      } else {
        sessionStorage.removeItem(`datPanel-${museId}`);
      }
    }
  }, [showDATMintingFor, museId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ratedMessages-${museId}`, JSON.stringify(Array.from(ratedMessages)));
    }
  }, [ratedMessages, museId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mintedDATs-${museId}`, JSON.stringify(Array.from(mintedDATs)));
    }
  }, [mintedDATs, museId]);

  // ✅ NEW: Rating functions with persistence
  const toggleRating = (messageId: string) => {
    const newValue = showRatingFor === messageId ? null : messageId;
    setShowRatingFor(newValue);
    // Also update the persistent current rating message state
    setCurrentRatingMessage(newValue);
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

      // Generate interaction hash for rating with robust timestamp handling
      let messageTimestamp: Date;
      try {
        if (message.timestamp instanceof Date && !isNaN(message.timestamp.getTime())) {
          messageTimestamp = message.timestamp;
        } else if (typeof message.timestamp === 'number') {
          const timestampMs = message.timestamp > 10000000000 ? message.timestamp : message.timestamp * 1000;
          messageTimestamp = new Date(timestampMs);
        } else if (typeof message.timestamp === 'string') {
          const parsedTimestamp = new Date(message.timestamp);
          messageTimestamp = !isNaN(parsedTimestamp.getTime()) ? parsedTimestamp : new Date();
        } else {
          messageTimestamp = new Date();
        }
      } catch (error) {
        console.warn('Rating timestamp conversion failed, using current time:', error);
        messageTimestamp = new Date();
      }
      
      const interactionHash = generateInteractionHash(
        parseInt(museId),
        session?.messages.find(m => m.role === 'user' && 
          session.messages.indexOf(m) === session.messages.indexOf(message) - 1)?.content || '',
        message.content,
        Math.floor(messageTimestamp.getTime() / 1000)
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

      // Handle transaction hash if available
      if (result.transaction_hash) {
        setRatingTransactionHash(result.transaction_hash as `0x${string}`);
        setShowRatingTransaction(true);
      }

      // Mark message as rated
      setRatedMessages(prev => new Set([...prev, messageId]));
      setShowRatingFor(null);
      
    } catch (error) {
      console.error('❌ Failed to submit rating:', error);
      setRatingTransactionError(error as Error);
      setShowRatingTransaction(true);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const generateInteractionHash = (museId: number, userMessage: string, aiResponse: string, timestamp: number): string => {
    // Simple hash generation (in production, use crypto library)
    const combined = `${museId}|${userMessage}|${aiResponse}|${timestamp}`;
    return `0x${btoa(combined).replace(/[^a-zA-Z0-9]/g, '').slice(0, 64).padEnd(64, '0')}`;
  };

  // ✅ NEW: DAT Minting functions


  const handleDATMintStart = (messageId: string) => {
    setDATMintingInProgress(prev => new Set([...prev, messageId]));
  };


  const handleDATMintSuccess = (messageId: string, datId: string, ipfsHash: string, transactionHash?: string, contractAddress?: string, tokenId?: string) => {
    console.log('✅ DAT minted successfully:', { messageId, datId, ipfsHash, transactionHash });
    setMintedDATs(prev => new Set([...prev, messageId]));
    
    // Show immediate toast notification for quick feedback
    showToast('🎉 DAT minted successfully! Transaction details available.', 'success');
    
    // Close the DAT panel and show prominent transaction modal instead
    setShowDATMintingFor(null);
    
    // Show transaction result modal with prominent display
    setTransactionResult({
      hash: transactionHash,
      type: 'DAT Minting',
      title: 'DAT Minted Successfully! 🎉',
      description: 'Your verifiable AI interaction certificate has been created on the blockchain',
      details: {
        datId,
        ipfsHash,
        contractAddress,
        tokenId,
      }
    });
    setShowTransactionModal(true);
    
    setDATMintingInProgress(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
  };

  const isEligibleForDAT = (message: ChatMessage): boolean => {
    // DATs can only be minted for AI responses 
    // More permissive eligibility - any AI response can potentially be minted as DAT
    return message.role === 'assistant' && 
           !mintedDATs.has(message.id) &&
           !datMintingInProgress.has(message.id) &&
           typeof message.content === 'string' && // Must be string content
           message.content.trim().length > 0; // Not empty
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
        role: 'assistant',
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
      
      // Update user message with error status
      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages.slice(0, -1),
          { ...userMessage, verification_status: 'failed' }
        ]
      } : null);
      
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
                <span>{stats?.total_memories || memories?.length || 0} memories</span>
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
                      sender: message.role === 'assistant' ? 'muse' : 'user',
                      timestamp: message.timestamp,
                      emotions: message.role === 'assistant' ? ['thoughtful', 'caring'] : undefined,
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
                      if (message.role === 'assistant') {
                        // Cycle through different panel states: none -> rating -> DAT -> none
                        if (!currentRatingMessage && !showDATMintingFor) {
                          setCurrentRatingMessage(message.id);
                        } else if (currentRatingMessage === message.id) {
                          if (isEligibleForDAT(message)) {
                            setCurrentRatingMessage(null);
                            setShowDATMintingFor(message.id);
                          } else {
                            setCurrentRatingMessage(null);
                          }
                        } else if (showDATMintingFor === message.id) {
                          console.log('🚨 User clicked to close DAT panel for message:', message.id);
                          setShowDATMintingFor(null);
                        } else {
                          // Close other panels and open rating for this message
                          console.log('🚨 Closing DAT panel to open rating for message:', message.id);
                          setCurrentRatingMessage(message.id);
                          setShowDATMintingFor(null);
                        }
                      }
                    }}
                  />
                  
                  {/* Phase 2 Feature Panels */}
                  {message.role === 'assistant' && (
                    <div className="ml-12 space-y-3">
                      
                      {/* ✅ NEW: DAT & Verification Status Bar */}
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-2">
                          {getVerificationIcon(message.verification_status, message.tee_verified)}
                          {getDATStatusIcon(message)}
                        </div>
                        
                        {/* Interactive action buttons */}
                        <div className="flex items-center space-x-3">
                          {/* Step indicators for user guidance */}
                          {!ratedMessages.has(message.id) && currentRatingMessage !== message.id && showDATMintingFor !== message.id && (
                            <span className="text-xs text-gray-500">Step 1: Rate → Step 2: Mint DAT</span>
                          )}
                          {currentRatingMessage === message.id && (
                            <span className="text-xs text-blue-300 animate-pulse">Step 1: Complete Rating → Step 2: Click "Mint DAT"</span>
                          )}
                          {showDATMintingFor === message.id && (
                            <span className="text-xs text-green-300 animate-pulse">Step 2: Click "Mint Interaction DAT" button below</span>
                          )}
                          {message.role === 'assistant' && (
                            <div className="flex items-center space-x-2">
                              {!ratedMessages.has(message.id) && currentRatingMessage !== message.id && showDATMintingFor !== message.id && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent message click handler
                                    setCurrentRatingMessage(message.id);
                                  }}
                                  className="text-xs px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
                                  title="Rate this response"
                                >
                                  💫 Rate Response
                                </button>
                              )}
                            </div>
                          )}
                          {isEligibleForDAT(message) && currentRatingMessage === message.id && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent message click handler
                                setCurrentRatingMessage(null);
                                setShowDATMintingFor(message.id);
                              }}
                              className="text-xs px-3 py-1 bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 rounded-lg transition-colors"
                              title="Mint this interaction as a DAT certificate"
                            >
                              🏷️ Mint DAT
                            </button>
                          )}
                          {isEligibleForDAT(message) && ratedMessages.has(message.id) && currentRatingMessage !== message.id && showDATMintingFor !== message.id && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent message click handler
                                setShowDATMintingFor(message.id);
                              }}
                              className="text-xs px-3 py-1 bg-green-500/30 hover:bg-green-500/40 text-green-200 rounded-lg transition-colors"
                              title="Message already rated - mint DAT certificate"
                            >
                              🏷️ Mint DAT
                            </button>
                          )}
                          {ratedMessages.has(message.id) && !mintedDATs.has(message.id) && showDATMintingFor !== message.id && (
                            <span className="text-xs px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg" title="Response has been rated">
                              ⭐ Rated
                            </span>
                          )}
                          {mintedDATs.has(message.id) && (
                            <span className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded-lg" title="DAT Certificate Available">
                              ✅ DAT Minted
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* TEE Verification Badge */}
                      {message.tee_verified && (
                        <TEEBadge
                          isVerified={message.tee_verified}
                          attestationData={{
                            enclaveId: message.tee_attestation || 'mrenc_a7b3c4d5',
                            timestamp: (() => {
                              try {
                                if (message.timestamp instanceof Date && !isNaN(message.timestamp.getTime())) {
                                  return message.timestamp.getTime();
                                } else if (typeof message.timestamp === 'number') {
                                  const timestampMs = message.timestamp > 10000000000 ? message.timestamp : message.timestamp * 1000;
                                  return timestampMs;
                                } else if (typeof message.timestamp === 'string') {
                                  const parsedTimestamp = new Date(message.timestamp);
                                  return !isNaN(parsedTimestamp.getTime()) ? parsedTimestamp.getTime() : Date.now();
                                } else {
                                  return Date.now();
                                }
                              } catch (error) {
                                console.warn('TEE badge timestamp conversion failed:', error);
                                return Date.now();
                              }
                            })(),
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
                          onToggle={() => {
                            setCurrentRatingMessage(null);
                          }}
                          onSubmitRating={async (rating, feedback, criteria) => {
                            try {
                              // Convert 0-100 scale to 1-10 scale for backend
                              const scaleRating = (value: number) => Math.max(1, Math.min(10, Math.round(value / 10)));
                              
                              const ratingData = {
                                muse_id: parseInt(museId as string),
                                interaction_hash: message.id,
                                quality_score: scaleRating(criteria.helpfulness || rating),
                                personality_accuracy: scaleRating(criteria.personality_alignment || rating),
                                helpfulness: scaleRating(criteria.accuracy || rating),
                                feedback: feedback || '',
                                user_address: address || '',
                              };
                              
                              console.log('Submitting rating:', ratingData);
                              
                              // Submit rating to backend API
                              const result = await api.rating.submitRating(ratingData);
                              console.log('Rating API result:', result);

                              // Handle transaction hash if available
                              if (result.transaction_hash) {
                                setRatingTransactionHash(result.transaction_hash as `0x${string}`);
                                setShowRatingTransaction(true);
                              }

                              setRatedMessages(prev => new Set([...prev, message.id]));
                              
                              // Convert backend response to expected format
                              const rewardData = {
                                tokens: result.reward_amount,
                                reputation: Math.floor(result.reward_amount * 0.3) + 5,
                                bonus: result.reward_amount >= 15 ? {
                                  type: 'quality' as const,
                                  amount: Math.floor(result.reward_amount * 0.2),
                                  description: 'High quality feedback bonus',
                                } : undefined,
                              };
                              
                              console.log('Reward data for modal:', rewardData);
                              
                              // Close rating panel after a brief delay to allow modal to show
                              setTimeout(() => {
                                setCurrentRatingMessage(null);
                              }, 2000); // Close after 2 seconds to show success
                              
                              return rewardData;
                            } catch (error) {
                              console.error('Rating submission failed:', error);
                              
                              // Set transaction error state
                              setRatingTransactionError(error as Error);
                              setShowRatingTransaction(true);
                              
                              // Fallback to simulation on error
                              setRatedMessages(prev => new Set([...prev, message.id]));
                              setCurrentRatingMessage(null);
                              
                              return {
                                tokens: Math.floor(rating * 0.5) + 10,
                                reputation: Math.floor(rating * 0.3) + 5,
                                bonus: rating > 80 ? {
                                  type: 'quality' as const,
                                  amount: 5,
                                  description: 'Network error - simulated reward',
                                } : undefined,
                              };
                            }
                          }}
                          marketStats={marketStats}
                        />
                      )}
                      
                      {/* Rating Transaction Status */}
                      {showRatingTransaction && (
                        <div className="mt-4">
                          <TransactionStatus
                            hash={ratingTransactionHash || undefined}
                            isLoading={isSubmittingRating}
                            isSuccess={!!ratingTransactionHash && !ratingTransactionError}
                            error={ratingTransactionError}
                            title="Rating Submission"
                            description={ratingTransactionHash ? "Your rating has been recorded on-chain!" : undefined}
                            onSuccess={() => {
                              setTimeout(() => {
                                setShowRatingTransaction(false);
                                setRatingTransactionHash(null);
                                setRatingTransactionError(null);
                              }, 5000);
                            }}
                            className="max-w-2xl"
                          />
                        </div>
                      )}
                      
                      {/* ✅ NEW: DAT Minting Panel */}
                      {isEligibleForDAT(message) && showDATMintingFor === message.id && (
                        <DATMintingPanel
                          traits={{
                            creativity: muse.creativity,
                            wisdom: muse.wisdom,
                            humor: muse.humor,
                            empathy: muse.empathy,
                          }}
                          messageId={message.id}
                          sessionId={session?.session_id || ''}
                          userMessage={
                            // Find the user message that corresponds to this AI response
                            session?.messages.find((msg, idx) => 
                              msg.role === 'user' && 
                              session.messages[idx + 1]?.id === message.id
                            )?.content || 'Previous user message'
                          }
                          aiResponse={message.content}
                          timestamp={(() => {
                            console.log('🔍 Chat Page - Passing timestamp to DAT Panel:', message.timestamp);
                            console.log('🔍 Chat Page - Message timestamp type:', typeof message.timestamp);
                            console.log('🔍 Chat Page - Message timestamp instanceof Date:', message.timestamp instanceof Date);
                            return message.timestamp;
                          })()}
                          teeAttestation={message.tee_attestation}
                          commitmentHash={message.commitment_hash}
                          isVisible={true}
                          onToggle={() => {
                            console.log('🚨 User manually closed DAT panel for message:', message.id);
                            setShowDATMintingFor(null);
                          }}
                          onMintSuccess={(datId, ipfsHash, transactionHash, contractAddress, tokenId) => 
                            handleDATMintSuccess(message.id, datId, ipfsHash, transactionHash, contractAddress, tokenId)
                          }
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
                        <span className="text-white">{stats?.total_memories || memories?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Importance</span>
                        <span className="text-white">{stats?.average_importance?.toFixed(1) || '0.0'}</span>
                      </div>
                      {stats?.category_breakdown && Object.entries(stats.category_breakdown).length > 0 && (
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
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
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

      {/* Transaction Result Modal - Prominent popup for transaction display */}
      {transactionResult && (
        <TransactionResultModal
          isOpen={showTransactionModal}
          onClose={() => {
            setShowTransactionModal(false);
            setTransactionResult(null);
          }}
          transactionHash={transactionResult.hash}
          transactionType={transactionResult.type}
          title={transactionResult.title}
          description={transactionResult.description}
          additionalDetails={transactionResult.details}
        />
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: toastNotification.visible ? 1 : 0, y: toastNotification.visible ? 0 : -50, scale: toastNotification.visible ? 1 : 0.9 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 p-4 rounded-xl shadow-2xl border ${
              toastNotification.type === 'success' 
                ? 'bg-green-900/90 border-green-600/50 text-green-100' 
                : toastNotification.type === 'error'
                ? 'bg-red-900/90 border-red-600/50 text-red-100'
                : 'bg-blue-900/90 border-blue-600/50 text-blue-100'
            } backdrop-blur-sm`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">
                {toastNotification.type === 'success' ? '✅' : toastNotification.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="font-medium">{toastNotification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main export component with client-side wrapper
export default function ChatPage() {
  return <DynamicClientOnlyChatPage />;
}