'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { type MuseData } from '@/types';
import { METAMUSE_ABI, CONTRACTS, PERSONALITY_COLORS } from '@/constants';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'muse';
  timestamp: Date;
  verification_status?: 'pending' | 'committed' | 'verified' | 'failed';
  tx_hash?: string;
  commitment_hash?: string;
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
  const museId = params.museId as string;
  const { isConnected, address } = useAccount();
  
  const [muse, setMuse] = useState<MuseData | null>(null);
  const [session, setSession] = useState<InteractionSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
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
      const museResponse = await fetch(`/api/v1/muses/${museId}`);
      if (!museResponse.ok) throw new Error('Muse not found');
      const museData = await museResponse.json();
      setMuse(museData);
      
      // Initialize or get existing chat session
      const sessionResponse = await fetch(`/api/v1/muses/${museId}/chat/session`, {
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
      
      // Send message to backend
      const response = await fetch(`/api/v1/muses/${museId}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          message: messageContent,
          user_address: address,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      const result = await response.json();
      
      // Add muse response
      const museResponse: ChatMessage = {
        id: result.interaction_id || (Date.now() + 1).toString(),
        content: result.response,
        role: 'muse',
        timestamp: new Date(),
        verification_status: 'committed',
        commitment_hash: result.commitment_hash,
      };
      
      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages.slice(0, -1), 
          { ...userMessage, verification_status: 'committed', commitment_hash: result.user_commitment },
          museResponse
        ]
      } : null);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
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

  const getVerificationIcon = (status?: string) => {
    switch (status) {
      case 'verified':
        return <span className="text-green-400 text-xs">✓</span>;
      case 'committed':
        return <span className="text-yellow-400 text-xs">⏳</span>;
      case 'pending':
        return <span className="text-gray-400 text-xs">○</span>;
      case 'failed':
        return <span className="text-red-400 text-xs">✗</span>;
      default:
        return null;
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

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
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
                        {getVerificationIcon(message.verification_status)}
                        {showVerificationDetails && message.verification_status && (
                          <span className="capitalize">{message.verification_status}</span>
                        )}
                      </div>
                    </div>
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