'use client';

import { motion } from 'framer-motion';
import { ReactNode, CSSProperties } from 'react';
import { MuseTraits } from '@/types';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';

interface ThemedContainerProps {
  traits: MuseTraits;
  children: ReactNode;
  variant?: 'default' | 'glass' | 'solid' | 'outline' | 'minimal' | 'elevated';
  intensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
  style?: CSSProperties;
  animated?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export function ThemedContainer({ 
  traits, 
  children, 
  variant = 'glass',
  intensity = 'normal',
  className = '',
  style = {},
  animated = true,
  interactive = false,
  onClick
}: ThemedContainerProps) {
  const theme = usePersonalityTheme(traits);
  
  const getIntensityMultiplier = () => {
    switch (intensity) {
      case 'subtle': return 0.3;
      case 'strong': return 1.5;
      default: return 1;
    }
  };
  
  const intensityMultiplier = getIntensityMultiplier();
  
  const getVariantStyles = (): CSSProperties => {
    const baseOpacity = 0.1 * intensityMultiplier;
    const borderOpacity = 0.3 * intensityMultiplier;
    
    switch (variant) {
      case 'glass':
        return {
          background: `linear-gradient(135deg, ${theme.getPrimaryWithOpacity(baseOpacity)}, ${theme.getSecondaryWithOpacity(baseOpacity * 0.7)})`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.getPrimaryWithOpacity(borderOpacity)}`,
          borderRadius: '1rem',
        };
      
      case 'solid':
        return {
          background: theme.getGradientBackground(),
          borderRadius: '1rem',
          color: 'white',
        };
      
      case 'outline':
        return {
          background: 'transparent',
          border: `2px solid ${theme.primary}`,
          borderRadius: '1rem',
        };
      
      case 'minimal':
        return {
          background: theme.getPrimaryWithOpacity(baseOpacity * 0.5),
          borderRadius: '0.5rem',
          border: 'none',
        };
      
      case 'elevated':
        return {
          background: `linear-gradient(145deg, ${theme.getPrimaryWithOpacity(baseOpacity * 1.2)}, ${theme.getSecondaryWithOpacity(baseOpacity * 0.8)})`,
          borderRadius: '1.5rem',
          boxShadow: `0 8px 32px ${theme.getPrimaryWithOpacity(0.2 * intensityMultiplier)}, 0 2px 8px ${theme.getPrimaryWithOpacity(0.1 * intensityMultiplier)}`,
          border: `1px solid ${theme.getPrimaryWithOpacity(borderOpacity * 0.5)}`,
        };
      
      default:
        return {
          background: theme.getPrimaryWithOpacity(baseOpacity),
          borderRadius: '1rem',
          border: `1px solid ${theme.getPrimaryWithOpacity(borderOpacity)}`,
        };
    }
  };

  const getAnimationProps = () => {
    if (!animated) return {};
    
    switch (theme.animation) {
      case 'fluid':
        return {
          animate: {
            background: [
              `linear-gradient(0deg, ${theme.gradient.map(c => c + Math.round(0.1 * intensityMultiplier * 255).toString(16).padStart(2, '0')).join(', ')})`,
              `linear-gradient(120deg, ${theme.gradient.map(c => c + Math.round(0.15 * intensityMultiplier * 255).toString(16).padStart(2, '0')).join(', ')})`,
              `linear-gradient(240deg, ${theme.gradient.map(c => c + Math.round(0.08 * intensityMultiplier * 255).toString(16).padStart(2, '0')).join(', ')})`,
              `linear-gradient(360deg, ${theme.gradient.map(c => c + Math.round(0.12 * intensityMultiplier * 255).toString(16).padStart(2, '0')).join(', ')})`,
            ],
          },
          transition: { duration: 8, repeat: Infinity, ease: "linear" },
        };
      
      case 'geometric':
        return {
          animate: { 
            rotate: [0, 0.5, 0],
            scale: [1, 1.001, 1],
          },
          transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
        };
      
      case 'organic':
        return {
          animate: { 
            borderRadius: ['1rem', '1.5rem', '1.2rem', '1rem'],
            scale: [1, 1.002, 1],
          },
          transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        };
      
      case 'soft':
        return {
          animate: { 
            boxShadow: [
              `0 4px 20px ${theme.getPrimaryWithOpacity(0.15 * intensityMultiplier)}`,
              `0 8px 40px ${theme.getPrimaryWithOpacity(0.25 * intensityMultiplier)}`,
              `0 4px 20px ${theme.getPrimaryWithOpacity(0.15 * intensityMultiplier)}`,
            ],
          },
          transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        };
      
      default:
        return {};
    }
  };

  const getInteractiveProps = () => {
    if (!interactive) return {};
    
    return {
      whileHover: {
        scale: 1.02,
        boxShadow: `0 8px 32px ${theme.getPrimaryWithOpacity(0.3 * intensityMultiplier)}`,
        transition: { duration: 0.2 },
      },
      whileTap: {
        scale: 0.98,
        transition: { duration: 0.1 },
      },
      style: {
        cursor: 'pointer',
      },
    };
  };

  const personalityStyles = theme.getPersonalityStyles();
  const combinedStyles = {
    ...getVariantStyles(),
    ...(variant === 'default' ? personalityStyles : {}),
    ...style,
  };

  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      style={combinedStyles}
      onClick={onClick}
      {...getAnimationProps()}
      {...getInteractiveProps()}
    >
      {/* Personality-based background pattern */}
      {animated && intensity !== 'minimal' && (
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${encodeURIComponent(theme.primary)}' fill-opacity='0.1'%3E%3C${
              theme.animation === 'geometric' 
                ? "polygon points='30,0 60,30 30,60 0,30'" 
                : theme.animation === 'organic'
                ? "ellipse cx='30' cy='30' rx='20' ry='15'"
                : "circle cx='30' cy='30' r='15'"
            }/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Personality indicator (optional accent) */}
      {intensity === 'strong' && (
        <motion.div
          className="absolute top-2 right-2 w-3 h-3 rounded-full opacity-60"
          style={{ backgroundColor: theme.accent }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}