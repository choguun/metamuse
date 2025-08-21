'use client';

import { motion } from 'framer-motion';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { MuseTraits } from '@/types';

export type IconType = 
  | 'chat' | 'memory' | 'search' | 'verification' | 'rating' | 'reasoning'
  | 'create' | 'explore' | 'gallery' | 'settings' | 'profile' | 'wallet'
  | 'creative' | 'wisdom' | 'humor' | 'empathy' | 'balanced'
  | 'tee-verified' | 'chain-thought' | 'semantic-memory' | 'ai-market'
  | 'heart' | 'star' | 'sparkle' | 'crystal' | 'bubble' | 'wave'
  | 'send' | 'loading' | 'success' | 'error' | 'warning' | 'info';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface PersonalityIconProps {
  type: IconType;
  traits: MuseTraits;
  size?: IconSize;
  animated?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const getSizeValue = (size: IconSize) => {
  const map = { xs: 12, sm: 16, md: 24, lg: 32, xl: 48 };
  return map[size];
};

export function PersonalityIcon({
  type,
  traits,
  size = 'md',
  animated = false,
  interactive = false,
  className = '',
  onClick,
}: PersonalityIconProps) {
  const theme = usePersonalityTheme(traits);
  const sizeValue = getSizeValue(size);

  const getPersonalityIconVariation = (basePath: string) => {
    const dominant = Math.max(traits.creativity, traits.wisdom, traits.humor, traits.empathy);
    
    if (traits.creativity === dominant && traits.creativity > 70) {
      // Creative variation: Add fluid, organic curves
      return basePath.replace('M', 'M').replace(/L/g, 'Q').replace(/Z/g, ' Q20,10 Z');
    }
    
    if (traits.wisdom === dominant && traits.wisdom > 70) {
      // Wisdom variation: Add geometric precision
      return basePath.replace(/[0-9]+/g, (match) => {
        const num = parseInt(match);
        return (Math.round(num / 2) * 2).toString(); // Make coordinates even for precision
      });
    }
    
    if (traits.humor === dominant && traits.humor > 70) {
      // Humor variation: Add playful bouncy curves
      return basePath.replace(/L/g, 'Q').replace(/[0-9]+/g, (match) => {
        const num = parseInt(match);
        return (num + Math.sin(num) * 2).toString();
      });
    }
    
    if (traits.empathy === dominant && traits.empathy > 70) {
      // Empathy variation: Add soft, heart-like curves
      return basePath.replace(/M/g, 'M').replace(/L/g, 'C');
    }
    
    return basePath;
  };

  const getIconPath = (): string => {
    const basePaths: Record<IconType, string> = {
      // Communication Icons
      chat: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
      send: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
      
      // Memory & Intelligence Icons
      memory: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
      search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
      reasoning: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      
      // Verification & Security Icons
      verification: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      'tee-verified': "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
      
      // AI Features Icons
      'chain-thought': "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
      'semantic-memory': "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
      'ai-market': "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
      rating: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
      
      // Navigation Icons
      create: "M12 4v16m8-8H4",
      explore: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
      gallery: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
      settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      wallet: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
      
      // Personality Type Icons
      creative: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4m0-18v18m0-18h4a2 2 0 012 2v3M7 21h4a2 2 0 002-2V8M7 21V8",
      wisdom: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      humor: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      empathy: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
      balanced: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
      
      // Decorative Elements
      heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
      star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
      sparkle: "M5 3l1.5 1.5L5 6 3.5 4.5 5 3zM19 17l1.5 1.5L19 20l-1.5-1.5L19 17zM12 12l3-3 3 3-3 3-3-3z",
      crystal: "M12 2l3.09 6.26L22 9l-5.91 1.74L12 22l-4.09-11.26L2 9l6.91-.74L12 2z",
      bubble: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      wave: "M4 12c0-1.657.895-3 2-3s2 1.343 2 3 .895 3 2 3 2-1.343 2-3 .895-3 2-3 2 1.343 2 3 .895 3 2 3 2-1.343 2-3",
      
      // Status Icons
      loading: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
      success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      error: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
      warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
      info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    };
    
    const basePath = basePaths[type] || basePaths.info;
    return getPersonalityIconVariation(basePath);
  };

  const getAnimationProps = () => {
    if (!animated) return {};

    const baseAnimation = {
      scale: [1, 1.1, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    };

    // Personality-specific animations
    if (traits.creativity > 70) {
      return {
        ...baseAnimation,
        rotate: [0, 5, -5, 0],
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      };
    }
    
    if (traits.wisdom > 70) {
      return {
        ...baseAnimation,
        opacity: [0.7, 1, 0.7],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
      };
    }
    
    if (traits.humor > 70) {
      return {
        ...baseAnimation,
        y: [0, -2, 0],
        rotate: [0, 3, -3, 0],
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
      };
    }
    
    if (traits.empathy > 70) {
      return {
        ...baseAnimation,
        scale: [1, 1.05, 1],
        transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
      };
    }

    return baseAnimation;
  };

  const getGradientId = () => `personality-gradient-${type}-${Math.random().toString(36).slice(2, 7)}`;
  const gradientId = getGradientId();

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${sizeMap[size]} ${className} ${
        interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''
      }`}
      onClick={onClick}
      {...(animated ? getAnimationProps() : {})}
      whileHover={interactive ? { scale: 1.1 } : {}}
      whileTap={interactive ? { scale: 0.95 } : {}}
    >
      <svg
        width={sizeValue}
        height={sizeValue}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.primary} />
            <stop offset="50%" stopColor={theme.secondary} />
            <stop offset="100%" stopColor={theme.accent} />
          </linearGradient>
          
          {/* Add special effects for certain personality types */}
          {traits.creativity > 70 && (
            <filter id={`glow-${gradientId}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )}
        </defs>
        
        <motion.path
          d={getIconPath()}
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={traits.creativity > 70 ? `url(#glow-${gradientId})` : undefined}
          {...(animated && traits.creativity > 70 ? {
            animate: {
              strokeDasharray: ["0 100", "50 50", "0 100"],
              strokeDashoffset: [0, -50, -100],
            },
            transition: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }
          } : {})}
        />
        
        {/* Add personality-specific decorative elements */}
        {traits.creativity > 70 && type === 'creative' && (
          <motion.circle
            cx="18"
            cy="6"
            r="2"
            fill={theme.accent}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5,
            }}
          />
        )}
        
        {traits.wisdom > 70 && type === 'wisdom' && (
          <motion.path
            d="M12 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"
            fill={theme.secondary}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          />
        )}
        
        {traits.humor > 70 && type === 'humor' && (
          <motion.path
            d="M15 10h.01M9 10h.01"
            stroke={theme.primary}
            strokeWidth="2"
            strokeLinecap="round"
            animate={{
              scaleY: [1, 0.5, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        )}
        
        {traits.empathy > 70 && type === 'empathy' && (
          <motion.path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={`${theme.primary}40`}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        )}
      </svg>
    </motion.div>
  );
}

// Convenience component for quick icon usage
export function Icon({ 
  type, 
  size = 'md', 
  className = '', 
  animated = false 
}: { 
  type: IconType; 
  size?: IconSize; 
  className?: string; 
  animated?: boolean; 
}) {
  // Default balanced traits for standalone usage
  const defaultTraits: MuseTraits = {
    creativity: 60,
    wisdom: 60,
    humor: 60,
    empathy: 60,
  };

  return (
    <PersonalityIcon
      type={type}
      traits={defaultTraits}
      size={size}
      className={className}
      animated={animated}
    />
  );
}