'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { MuseTraits } from '@/types';
import { getPersonalityTheme, getPersonalityEmoji, getAnimationPreset } from '@/utils/personalityColors';

interface MuseAvatarProps {
  traits: MuseTraits;
  tokenId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  showPersonality?: boolean;
  showGlow?: boolean;
  className?: string;
}

export function MuseAvatar({ 
  traits, 
  tokenId, 
  size = 'md', 
  interactive = true,
  showPersonality = false,
  showGlow = true,
  className = ''
}: MuseAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const theme = getPersonalityTheme(traits);
  const sizeMap = { sm: 40, md: 64, lg: 96, xl: 128 };
  const dimension = sizeMap[size];
  const animationPreset = getAnimationPreset(theme.animation);
  
  // Helper function to ensure consistent coordinate precision
  const roundCoord = (value: number): number => {
    return Math.round(value * 100) / 100; // Round to 2 decimal places
  };
  
  // Calculate base values (rounded for consistency)
  const cx = roundCoord(dimension / 2);
  const cy = roundCoord(dimension / 2);
  const baseRadius = roundCoord(dimension / 3);
  
  // Generate unique shapes based on personality (memoized for consistency)
  const avatarShapes = useMemo(() => {
    const { creativity, wisdom, humor, empathy } = traits;
    
    // Creative: Fluid, organic shapes with flowing animations
    if (creativity > 70) {
      return (
        <g>
          <motion.path
            d={`M ${roundCoord(cx-baseRadius)} ${roundCoord(cy)} 
                Q ${roundCoord(cx-baseRadius/2)} ${roundCoord(cy-baseRadius)} ${roundCoord(cx)} ${roundCoord(cy-baseRadius/2)}
                Q ${roundCoord(cx+baseRadius/2)} ${roundCoord(cy-baseRadius)} ${roundCoord(cx+baseRadius)} ${roundCoord(cy)}
                Q ${roundCoord(cx+baseRadius/2)} ${roundCoord(cy+baseRadius)} ${roundCoord(cx)} ${roundCoord(cy+baseRadius/2)}
                Q ${roundCoord(cx-baseRadius/2)} ${roundCoord(cy+baseRadius)} ${roundCoord(cx-baseRadius)} ${roundCoord(cy)} Z`}
            fill={`url(#gradient-${tokenId})`}
            animate={{
              d: isHovered ? [
                `M ${roundCoord(cx-baseRadius*1.1)} ${roundCoord(cy)} Q ${roundCoord(cx-baseRadius/2)} ${roundCoord(cy-baseRadius*1.1)} ${roundCoord(cx)} ${roundCoord(cy-baseRadius/2)} Q ${roundCoord(cx+baseRadius/2)} ${roundCoord(cy-baseRadius*1.1)} ${roundCoord(cx+baseRadius*1.1)} ${roundCoord(cy)} Q ${roundCoord(cx+baseRadius/2)} ${roundCoord(cy+baseRadius*1.1)} ${roundCoord(cx)} ${roundCoord(cy+baseRadius/2)} Q ${roundCoord(cx-baseRadius/2)} ${roundCoord(cy+baseRadius*1.1)} ${roundCoord(cx-baseRadius*1.1)} ${roundCoord(cy)} Z`,
                `M ${roundCoord(cx-baseRadius*0.9)} ${roundCoord(cy)} Q ${roundCoord(cx-baseRadius/2)} ${roundCoord(cy-baseRadius*0.9)} ${roundCoord(cx)} ${roundCoord(cy-baseRadius/2)} Q ${roundCoord(cx+baseRadius/2)} ${roundCoord(cy-baseRadius*0.9)} ${roundCoord(cx+baseRadius*0.9)} ${roundCoord(cy)} Q ${roundCoord(cx+baseRadius/2)} ${roundCoord(cy+baseRadius*0.9)} ${roundCoord(cx)} ${roundCoord(cy+baseRadius/2)} Q ${roundCoord(cx-baseRadius/2)} ${roundCoord(cy+baseRadius*0.9)} ${roundCoord(cx-baseRadius*0.9)} ${roundCoord(cy)} Z`,
              ] : [
                `M ${roundCoord(cx-baseRadius)} ${roundCoord(cy)} Q ${roundCoord(cx-baseRadius/2)} ${roundCoord(cy-baseRadius*0.8)} ${roundCoord(cx)} ${roundCoord(cy-baseRadius/2)} Q ${roundCoord(cx+baseRadius/2)} ${roundCoord(cy-baseRadius*0.8)} ${roundCoord(cx+baseRadius)} ${roundCoord(cy)} Q ${roundCoord(cx+baseRadius/2)} ${roundCoord(cy+baseRadius*0.8)} ${roundCoord(cx)} ${roundCoord(cy+baseRadius/2)} Q ${roundCoord(cx-baseRadius/2)} ${roundCoord(cy+baseRadius*0.8)} ${roundCoord(cx-baseRadius)} ${roundCoord(cy)} Z`,
                `M ${roundCoord(cx-baseRadius*0.9)} ${roundCoord(cy)} Q ${roundCoord(cx-baseRadius/2)} ${roundCoord(cy-baseRadius*1.1)} ${roundCoord(cx)} ${roundCoord(cy-baseRadius/2)} Q ${roundCoord(cx+baseRadius/2)} ${roundCoord(cy-baseRadius*1.1)} ${roundCoord(cx+baseRadius*0.9)} ${roundCoord(cy)} Q ${roundCoord(cx+baseRadius/2)} ${roundCoord(cy+baseRadius*1.1)} ${roundCoord(cx)} ${roundCoord(cy+baseRadius/2)} Q ${roundCoord(cx-baseRadius/2)} ${roundCoord(cy+baseRadius*1.1)} ${roundCoord(cx-baseRadius*0.9)} ${roundCoord(cy)} Z`,
              ]
            }}
            transition={animationPreset}
          />
          {/* Creative sparkles */}
          <motion.circle
            cx={roundCoord(cx - baseRadius/2)}
            cy={roundCoord(cy - baseRadius/2)}
            r={roundCoord(dimension/20)}
            fill={theme.accent}
            animate={{
              scale: [0.5, 1.2, 0.5],
              opacity: [0.3, 1, 0.3],
              rotate: [0, 180, 360]
            }}
            transition={{ ...animationPreset, delay: 0.5 }}
          />
          <motion.circle
            cx={roundCoord(cx + baseRadius/2)}
            cy={roundCoord(cy - baseRadius/3)}
            r={roundCoord(dimension/25)}
            fill={theme.secondary}
            animate={{
              scale: [0.3, 1, 0.3],
              opacity: [0.2, 0.8, 0.2],
              rotate: [360, 180, 0]
            }}
            transition={{ ...animationPreset, delay: 1 }}
          />
        </g>
      );
    }
    
    // Wisdom: Geometric, crystalline structures
    if (wisdom > 70) {
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const radius = i % 2 === 0 ? baseRadius : baseRadius * 0.7;
        const x = roundCoord(cx + Math.cos(angle) * radius);
        const y = roundCoord(cy + Math.sin(angle) * radius);
        points.push(`${x},${y}`);
      }
      
      return (
        <g>
          <motion.polygon
            points={points.join(' ')}
            fill={`url(#gradient-${tokenId})`}
            animate={{
              rotate: isHovered ? [0, 360] : [0, 180, 360],
              scale: isHovered ? [1, 1.1, 1] : 1,
            }}
            transition={isHovered ? { duration: 2, ease: "easeInOut" } : animationPreset}
          />
          {/* Wisdom center crystal */}
          <motion.circle
            cx={roundCoord(cx)}
            cy={roundCoord(cy)}
            r={roundCoord(baseRadius/3)}
            fill={theme.accent}
            opacity={0.8}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ ...animationPreset, duration: animationPreset.duration * 0.5 }}
          />
        </g>
      );
    }
    
    // Humor: Playful, bouncy shapes
    if (humor > 70) {
      return (
        <g>
          <motion.circle
            cx={roundCoord(cx)}
            cy={roundCoord(cy)}
            r={roundCoord(baseRadius)}
            fill={`url(#gradient-${tokenId})`}
            animate={{
              scale: isHovered ? [1, 1.3, 0.8, 1.1, 1] : [1, 1.1, 0.9, 1],
              rotate: isHovered ? [0, 5, -5, 3, -3, 0] : [0, 2, -2, 0],
            }}
            transition={isHovered ? { duration: 1, ease: "easeInOut" } : animationPreset}
          />
          {/* Humor bubbles */}
          <motion.circle
            cx={roundCoord(cx - baseRadius/2)}
            cy={roundCoord(cy - baseRadius/2)}
            r={roundCoord(dimension/15)}
            fill={theme.accent}
            animate={{
              scale: [0.5, 1.5, 0.5],
              x: [0, 5, -3, 2, 0],
              y: [0, -3, 5, -2, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{ ...animationPreset, delay: 0.3 }}
          />
          <motion.circle
            cx={roundCoord(cx + baseRadius/3)}
            cy={roundCoord(cy + baseRadius/3)}
            r={roundCoord(dimension/18)}
            fill={theme.secondary}
            animate={{
              scale: [0.3, 1.2, 0.6, 1.0, 0.3],
              x: [0, -2, 4, -1, 0],
              y: [0, 3, -2, 4, 0],
              opacity: [0.3, 0.9, 0.5, 0.8, 0.3],
            }}
            transition={{ ...animationPreset, delay: 0.8 }}
          />
        </g>
      );
    }
    
    // Empathy: Soft, heart-like shapes
    if (empathy > 70) {
      const heartPath = `M ${roundCoord(cx)},${roundCoord(cy + baseRadius/2)} 
                        C ${roundCoord(cx)},${roundCoord(cy + baseRadius/2)} ${roundCoord(cx - baseRadius)},${roundCoord(cy)} ${roundCoord(cx - baseRadius)},${roundCoord(cy - baseRadius/3)}
                        C ${roundCoord(cx - baseRadius)},${roundCoord(cy - baseRadius)} ${roundCoord(cx - baseRadius/2)},${roundCoord(cy - baseRadius)} ${roundCoord(cx)},${roundCoord(cy - baseRadius/3)}
                        C ${roundCoord(cx + baseRadius/2)},${roundCoord(cy - baseRadius)} ${roundCoord(cx + baseRadius)},${roundCoord(cy - baseRadius)} ${roundCoord(cx + baseRadius)},${roundCoord(cy - baseRadius/3)}
                        C ${roundCoord(cx + baseRadius)},${roundCoord(cy)} ${roundCoord(cx)},${roundCoord(cy + baseRadius/2)} ${roundCoord(cx)},${roundCoord(cy + baseRadius/2)} Z`;
      
      return (
        <g>
          <motion.path
            d={heartPath}
            fill={`url(#gradient-${tokenId})`}
            animate={{
              scale: isHovered ? [1, 1.2, 1] : [1, 1.05, 1],
            }}
            transition={animationPreset}
          />
          {/* Empathy aura */}
          <motion.circle
            cx={roundCoord(cx)}
            cy={roundCoord(cy)}
            r={roundCoord(baseRadius * 1.3)}
            fill="none"
            stroke={theme.primary}
            strokeWidth={2}
            opacity={0.3}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{ ...animationPreset, duration: animationPreset.duration * 1.5 }}
          />
        </g>
      );
    }
    
    // Default: Balanced circular design with subtle personality hints
    return (
      <g>
        <motion.circle
          cx={roundCoord(cx)}
          cy={roundCoord(cy)}
          r={roundCoord(baseRadius)}
          fill={`url(#gradient-${tokenId})`}
          animate={{
            scale: isHovered ? [1, 1.1, 1] : [1, 1.02, 1],
          }}
          transition={animationPreset}
        />
        {/* Balanced trait indicators */}
        {Object.entries(traits).map((trait, index) => {
          const angle = (index * Math.PI * 2) / 4;
          const indicatorRadius = baseRadius * 0.3;
          const x = roundCoord(cx + Math.cos(angle) * indicatorRadius);
          const y = roundCoord(cy + Math.sin(angle) * indicatorRadius);
          
          return (
            <motion.circle
              key={trait[0]}
              cx={x}
              cy={y}
              r={roundCoord(dimension/30)}
              fill={theme.gradient[index]}
              animate={{
                scale: [0.5, 1, 0.5],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{ ...animationPreset, delay: index * 0.2 }}
            />
          );
        })}
      </g>
    );
  }, [traits, cx, cy, baseRadius, tokenId, theme, animationPreset]); // Dependencies for useMemo

  return (
    <motion.div
      className={`relative ${interactive ? 'cursor-pointer' : ''} ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={interactive ? { scale: 1.05 } : {}}
      whileTap={interactive ? { scale: 0.95 } : {}}
    >
      <svg 
        width={dimension} 
        height={dimension} 
        className="overflow-visible"
        style={{ filter: showGlow ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' : 'none' }}
      >
        <defs>
          {/* Main gradient */}
          <linearGradient id={`gradient-${tokenId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {theme.gradient.map((color, index) => (
              <stop
                key={index}
                offset={`${(index / (theme.gradient.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
          
          {/* Glow filter for enhanced visual appeal */}
          {showGlow && (
            <filter id={`glow-${tokenId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )}
          
          {/* Personality-based pattern */}
          <pattern id={`pattern-${tokenId}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="transparent"/>
            <circle cx="10" cy="10" r="1" fill={theme.accent} opacity="0.1"/>
          </pattern>
        </defs>
        
        <g filter={showGlow ? `url(#glow-${tokenId})` : undefined}>
          {avatarShapes}
        </g>
        
        {/* Subtle background pattern */}
        <circle
          cx={roundCoord(dimension/2)}
          cy={roundCoord(dimension/2)}
          r={roundCoord(dimension/3 + 10)}
          fill={`url(#pattern-${tokenId})`}
          opacity={0.5}
        />
      </svg>
      
      {/* Token ID overlay */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center text-white font-bold pointer-events-none"
        style={{ 
          fontSize: `${Math.min(dimension / 6, 16)}px`,
          textShadow: '0 1px 3px rgba(0,0,0,0.7)'
        }}
        animate={{
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        #{tokenId}
      </motion.div>
      
      {/* Personality indicator */}
      {showPersonality && (
        <motion.div
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs shadow-lg"
          style={{ backgroundColor: theme.primary }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.2 }}
        >
          {getPersonalityEmoji(theme)}
        </motion.div>
      )}
      
      {/* Interactive pulse effect */}
      {interactive && isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 pointer-events-none"
          style={{ borderColor: theme.primary }}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.3, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
}