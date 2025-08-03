import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { api, apiHelpers } from '@/lib/api';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'muse';
  timestamp: Date;
  verification_status?: 'pending' | 'committed' | 'verified' | 'failed';
  commitment_hash?: string;
  tx_hash?: string;
}

export interface ChatSession {
  session_id: string;
  muse_id: string;
  messages: ChatMessage[];
  is_active: boolean;
}

export interface UseChatOptions {
  autoLoad?: boolean;
  pollingInterval?: number;
  maxRetries?: number;
}

export function useChat(museId: string, options: UseChatOptions = {}) {
  const { address } = useAccount();
  const {
    autoLoad = true,
    pollingInterval = 5000,
    maxRetries = 3
  } = options;

  // State
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize session
  const initializeSession = useCallback(async () => {
    if (!address || !museId) return;

    setIsLoading(true);
    setError(null);

    try {
      const sessionData = await apiHelpers.retryRequest(
        () => api.chat.getSession(museId, address),
        maxRetries
      );

      // Convert API response to ChatSession format
      const chatSession: ChatSession = {
        session_id: sessionData.session_id,
        muse_id: sessionData.muse_id,
        is_active: true,
        messages: sessionData.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      };

      setSession(chatSession);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = apiHelpers.formatError(err);
      setError(errorMessage);
      console.error('Failed to initialize chat session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, museId, maxRetries]);

  // Send message
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!session || !address || isSending) return;

    // Validate message
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    setIsSending(true);
    setIsTyping(true);
    setError(null);

    // Create optimistic user message
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: trimmedContent,
      role: 'user',
      timestamp: new Date(),
      verification_status: 'pending',
    };

    // Add user message immediately for optimistic UI
    setSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null);

    try {
      // Send message to API
      const response = await apiHelpers.retryRequest(
        () => api.chat.sendMessage(museId, {
          session_id: session.session_id,
          message: trimmedContent,
          user_address: address,
        }),
        maxRetries
      );

      // Create muse response message
      const museMessage: ChatMessage = {
        id: response.interaction_id,
        content: response.response,
        role: 'muse',
        timestamp: new Date(),
        verification_status: response.verification_status,
        commitment_hash: response.commitment_hash,
      };

      // Update session with real messages
      setSession(prev => prev ? {
        ...prev,
        messages: [
          ...prev.messages.slice(0, -1), // Remove optimistic message
          {
            ...userMessage,
            id: `user-${response.interaction_id}`,
            verification_status: 'committed',
            commitment_hash: response.user_commitment,
          },
          museMessage
        ]
      } : null);

    } catch (err) {
      const errorMessage = apiHelpers.formatError(err);
      setError(errorMessage);

      // Remove optimistic message on error
      setSession(prev => prev ? {
        ...prev,
        messages: prev.messages.slice(0, -1)
      } : null);

      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  }, [session, address, isSending, museId, maxRetries]);

  // Load chat history
  const loadHistory = useCallback(async (before?: string) => {
    if (!session) return [];

    try {
      const historyData = await api.chat.getHistory(
        museId,
        session.session_id,
        { limit: 50, before }
      );

      const historicalMessages: ChatMessage[] = historyData.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      return historicalMessages;
    } catch (err) {
      console.error('Failed to load chat history:', err);
      return [];
    }
  }, [session, museId]);

  // Refresh messages (polling)
  const refreshMessages = useCallback(async () => {
    if (!session || !isConnected) return;

    try {
      // Get latest messages without showing loading state
      const sessionData = await api.chat.getSession(museId, address!);
      
      const updatedMessages: ChatMessage[] = sessionData.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      // Only update if there are new messages
      if (updatedMessages.length > session.messages.length) {
        setSession(prev => prev ? {
          ...prev,
          messages: updatedMessages,
        } : null);
      }
    } catch (err) {
      // Silently fail for polling errors
      console.debug('Polling failed:', err);
    }
  }, [session, isConnected, museId, address]);

  // Start polling for new messages
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(() => {
      refreshMessages();
    }, pollingInterval);
  }, [refreshMessages, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Disconnect session
  const disconnect = useCallback(() => {
    stopPolling();
    setSession(null);
    setIsConnected(false);
    setError(null);
  }, [stopPolling]);

  // Auto-initialize session
  useEffect(() => {
    if (autoLoad && address && museId) {
      initializeSession();
    }

    return () => {
      // Cleanup on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      stopPolling();
    };
  }, [autoLoad, address, museId, initializeSession, stopPolling]);

  // Start polling when session is established
  useEffect(() => {
    if (session && isConnected) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [session, isConnected, startPolling, stopPolling]);

  // Computed values
  const messageCount = session?.messages?.length || 0;
  const verifiedMessageCount = session?.messages?.filter(
    m => m.verification_status === 'verified'
  )?.length || 0;
  const lastMessage = session?.messages?.[session.messages.length - 1];

  return {
    // State
    session,
    messages: session?.messages || [],
    isLoading,
    isSending,
    isTyping,
    isConnected,
    error,

    // Actions
    sendMessage,
    initializeSession,
    loadHistory,
    refreshMessages,
    clearError,
    disconnect,
    startPolling,
    stopPolling,

    // Computed
    messageCount,
    verifiedMessageCount,
    lastMessage,
    hasError: !!error,
  };
}

export default useChat;