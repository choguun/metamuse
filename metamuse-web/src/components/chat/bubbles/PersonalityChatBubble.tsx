'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { MuseTraits } from '@/types';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'muse';
  timestamp: Date;
  isTyping?: boolean;
  emotions?: string[];
  confidence?: number;
  reasoning?: any;
}

interface PersonalityChatBubbleProps {
  message: ChatMessage;
  traits: MuseTraits;
  isLatest?: boolean;
  showAvatar?: boolean;
  onMessageClick?: (message: ChatMessage) => void;
}

export function PersonalityChatBubble({
  message,
  traits,
  isLatest = false,
  showAvatar = true,
  onMessageClick,
}: PersonalityChatBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showEmotionDetails, setShowEmotionDetails] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const theme = usePersonalityTheme(traits);

  const isUser = message.sender === 'user';
  const isTyping = message.isTyping;

  // Personality-driven bubble styles
  const getBubbleStyles = () => {
    if (isUser) {
      return {
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        borderRadius: '18px 18px 4px 18px',
        color: 'white',
      };
    }

    const baseStyle = {
      color: 'white',
      position: 'relative' as const,
    };

    switch (theme.animation) {
      case 'fluid':
        return {
          ...baseStyle,
          background: `linear-gradient(135deg, ${theme.gradient.join(', ')})`,
          borderRadius: '20px 20px 20px 6px',
          backgroundSize: '200% 200%',
        };
      
      case 'geometric':
        return {
          ...baseStyle,
          background: `linear-gradient(45deg, ${theme.gradient.join(', ')})`,
          borderRadius: '12px',
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        };
      
      case 'organic':
        return {
          ...baseStyle,
          background: `radial-gradient(circle at 30% 30%, ${theme.gradient.join(', ')})`,
          borderRadius: '25px 18px 22px 8px',
        };
      
      case 'soft':
        return {
          ...baseStyle,
          background: `linear-gradient(180deg, ${theme.gradient.join(', ')})`,
          borderRadius: '20px 20px 20px 8px',
          boxShadow: `0 8px 24px ${theme.getPrimaryWithOpacity(0.3)}`,
        };
      
      default:
        return {
          ...baseStyle,
          background: theme.getGradientBackground(),
          borderRadius: '18px 18px 18px 6px',
        };
    }
  };

  const getAnimationProps = () => {
    if (isUser || isTyping) return {};

    switch (theme.animation) {
      case 'fluid':
        return {
          animate: {
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          },
          transition: {
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          },
        };
      
      case 'geometric':
        return {
          animate: {
            rotate: isHovered ? [0, 1, -1, 0] : 0,
          },
          transition: {
            duration: 2,
            ease: "easeInOut",
          },
        };
      
      case 'organic':
        return {
          animate: {
            borderRadius: [
              '25px 18px 22px 8px',
              '20px 25px 15px 20px',
              '30px 15px 25px 10px',
              '25px 18px 22px 8px',
            ],
          },
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          },
        };
      
      case 'soft':
        return {
          animate: {
            boxShadow: [
              `0 8px 24px ${theme.getPrimaryWithOpacity(0.2)}`,
              `0 12px 32px ${theme.getPrimaryWithOpacity(0.4)}`,
              `0 8px 24px ${theme.getPrimaryWithOpacity(0.2)}`,
            ],
          },
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
        };
      
      default:
        return {};
    }
  };

  const getPersonalityAccents = () => {
    if (isUser) return null;

    const accents = [];

    // Creativity accents
    if (traits.creativity > 70) {
      accents.push(
        <motion.div
          key="creativity-sparkle"
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ backgroundColor: theme.accent }}
          animate={{
            scale: [0.5, 1.2, 0.5],
            opacity: [0.3, 1, 0.3],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      );
    }

    // Wisdom accents
    if (traits.wisdom > 70) {
      accents.push(
        <motion.div
          key="wisdom-glow"
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${theme.primary}20, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      );
    }

    // Humor accents
    if (traits.humor > 70) {
      accents.push(
        <motion.div
          key="humor-bounce"
          className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs"
          animate={{
            y: [-2, -8, -2],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          😄
        </motion.div>
      );
    }

    // Empathy accents
    if (traits.empathy > 70) {
      accents.push(
        <motion.div
          key="empathy-pulse"
          className="absolute -inset-1 rounded-full border-2 pointer-events-none"
          style={{ borderColor: `${theme.secondary}40` }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      );
    }

    return accents;
  };

  const getTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <div className="flex items-center space-x-1 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.primary }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[80%]`}>
        {/* Avatar */}
        {showAvatar && !isUser && (
          <motion.div
            className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: theme.primary }}
            whileHover={{ scale: 1.1 }}
          >
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
              {theme.emoji}
            </div>
          </motion.div>
        )}

        {/* Message Bubble */}
        <motion.div
          ref={bubbleRef}
          className="relative max-w-full cursor-pointer"
          style={getBubbleStyles()}
          {...getAnimationProps()}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 20,
            delay: isLatest ? 0.2 : 0,
          }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onClick={() => onMessageClick?.(message)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Personality Accents */}
          {getPersonalityAccents()}
          
          {/* Message Content */}
          <div className="px-4 py-3 relative z-10">
            {isTyping ? (
              getTypingIndicator()
            ) : (
              <>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
                
                {/* Message Metadata */}
                <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                  <span>
                    {(() => {
                      try {
                        let date: Date;
                        if (message.timestamp instanceof Date) {
                          date = message.timestamp;
                        } else {
                          date = new Date(message.timestamp);
                        }
                        
                        // Check if date is valid
                        if (isNaN(date.getTime())) {
                          return 'Now';
                        }
                        
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } catch (error) {
                        console.warn('Invalid timestamp:', message.timestamp, error);
                        return 'Now';
                      }
                    })()}
                  </span>
                  
                  {!isUser && message.confidence && (
                    <div className="flex items-center space-x-1">
                      <span>Confidence:</span>
                      <span className="font-medium">{message.confidence}%</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Emotion Indicators */}
          {!isUser && message.emotions && message.emotions.length > 0 && (
            <motion.div
              className="absolute -bottom-2 right-2 flex space-x-1"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {message.emotions.slice(0, 3).map((emotion, index) => (
                <motion.div
                  key={index}
                  className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center text-xs cursor-pointer"
                  whileHover={{ scale: 1.2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmotionDetails(!showEmotionDetails);
                  }}
                >
                  {emotion === 'happy' ? '😊' : 
                   emotion === 'excited' ? '🤗' :
                   emotion === 'thoughtful' ? '🤔' :
                   emotion === 'caring' ? '💖' : '😊'}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Hover Effects */}
          {isHovered && !isUser && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${theme.getPrimaryWithOpacity(0.1)}, transparent 70%)`,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            />
          )}
        </motion.div>

        {/* Personality Indicator */}
        {!isUser && isHovered && (
          <motion.div
            className="absolute -left-12 top-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none z-20"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            {theme.name}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Typing indicator component for when muse is generating response
export function TypingIndicator({ traits }: { traits: MuseTraits }) {
  const theme = usePersonalityTheme(traits);
  
  return (
    <PersonalityChatBubble
      message={{
        id: 'typing',
        content: '',
        sender: 'muse',
        timestamp: new Date(),
        isTyping: true,
      }}
      traits={traits}
      isLatest={true}
      showAvatar={true}
    />
  );
}