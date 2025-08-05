import { useMemo } from 'react';
import { MuseTraits } from '@/types';
import { getPersonalityTheme, getPersonalityDescription, getPersonalityEmoji } from '@/utils/personalityColors';

export function usePersonalityTheme(traits: MuseTraits) {
  return useMemo(() => {
    const theme = getPersonalityTheme(traits);
    
    return {
      ...theme,
      description: getPersonalityDescription(theme),
      emoji: getPersonalityEmoji(theme),
      
      // CSS custom properties for dynamic theming
      cssVariables: {
        '--muse-primary': theme.primary,
        '--muse-secondary': theme.secondary,
        '--muse-accent': theme.accent,
        '--muse-background': theme.background,
        '--muse-gradient': `linear-gradient(135deg, ${theme.gradient.join(', ')})`,
        '--muse-gradient-radial': `radial-gradient(circle, ${theme.gradient.join(', ')})`,
        '--muse-gradient-vertical': `linear-gradient(to bottom, ${theme.gradient.join(', ')})`,
      },
      
      // Utility functions for styling
      getGradientBackground: () => `linear-gradient(135deg, ${theme.gradient.join(', ')})`,
      getRadialGradient: () => `radial-gradient(circle, ${theme.gradient.join(', ')})`,
      getPrimaryWithOpacity: (opacity: number) => `${theme.primary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
      getSecondaryWithOpacity: (opacity: number) => `${theme.secondary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
      getAccentWithOpacity: (opacity: number) => `${theme.accent}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
      
      // Component class names based on personality
      containerClass: `themed-container ${theme.animation}`,
      buttonClass: `themed-button ${theme.animation}`,
      cardClass: `themed-card ${theme.animation}`,
      
      // Tailwind-compatible class generation
      getTailwindClasses: () => ({
        bgGradient: 'bg-gradient-to-br',
        textColor: theme.primary.startsWith('#') ? `text-[${theme.primary}]` : 'text-purple-400',
        borderColor: theme.primary.startsWith('#') ? `border-[${theme.primary}]` : 'border-purple-400',
        fromColor: theme.gradient[0]?.startsWith('#') ? `from-[${theme.gradient[0]}]` : 'from-purple-500',
        toColor: theme.gradient[theme.gradient.length - 1]?.startsWith('#') ? `to-[${theme.gradient[theme.gradient.length - 1]}]` : 'to-blue-500',
      }),
      
      // Animation configurations
      animations: {
        pulse: {
          animate: {
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          },
          transition: {
            duration: theme.animation === 'fluid' ? 3 : theme.animation === 'geometric' ? 2 : theme.animation === 'organic' ? 2.5 : 4,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
        glow: {
          animate: {
            boxShadow: [
              `0 0 10px ${theme.primary}30`,
              `0 0 20px ${theme.primary}50`,
              `0 0 10px ${theme.primary}30`,
            ],
          },
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
        float: {
          animate: {
            y: [0, -5, 0],
            rotate: theme.animation === 'geometric' ? [0, 1, -1, 0] : [0, 0.5, -0.5, 0],
          },
          transition: {
            duration: theme.animation === 'organic' ? 2 : theme.animation === 'fluid' ? 4 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      },
      
      // Personality-specific styling overrides
      getPersonalityStyles: () => {
        switch (theme.dominant) {
          case 'creativity':
            return {
              borderRadius: '1.5rem',
              background: `linear-gradient(45deg, ${theme.gradient.join(', ')})`,
              boxShadow: `0 8px 32px ${theme.primary}20`,
              backdropFilter: 'blur(10px)',
            };
          case 'wisdom':
            return {
              borderRadius: '0.5rem',
              background: `linear-gradient(135deg, ${theme.gradient.join(', ')})`,
              boxShadow: `0 4px 16px ${theme.primary}30`,
              border: `1px solid ${theme.primary}40`,
            };
          case 'humor':
            return {
              borderRadius: '2rem',
              background: `radial-gradient(circle, ${theme.gradient.join(', ')})`,
              boxShadow: `0 12px 24px ${theme.primary}25`,
              transform: 'perspective(1000px) rotateX(2deg)',
            };
          case 'empathy':
            return {
              borderRadius: '1.25rem',
              background: `linear-gradient(180deg, ${theme.gradient.join(', ')})`,
              boxShadow: `0 6px 20px ${theme.primary}35, inset 0 1px 0 rgba(255,255,255,0.1)`,
              backdropFilter: 'blur(8px)',
            };
          default:
            return {
              borderRadius: '1rem',
              background: `linear-gradient(135deg, ${theme.gradient.join(', ')})`,
              boxShadow: `0 4px 12px ${theme.primary}25`,
            };
        }
      },
    };
  }, [traits]);
}

// Hook for theme transitions when switching between muses
export function useThemeTransition(traits: MuseTraits, duration: number = 0.5) {
  const theme = usePersonalityTheme(traits);
  
  return useMemo(() => ({
    ...theme,
    transitionConfig: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration,
    },
    
    // Smooth transition styles
    getTransitionStyles: (property: string) => ({
      transition: `${property} ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
    }),
    
    // Apply transition to multiple properties
    getAllTransitions: () => ({
      transition: `all ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
    }),
  }), [traits, duration, theme]);
}

// Utility hook for comparing personality themes
export function usePersonalityComparison(traitsA: MuseTraits, traitsB: MuseTraits) {
  return useMemo(() => {
    const themeA = getPersonalityTheme(traitsA);
    const themeB = getPersonalityTheme(traitsB);
    
    // Calculate personality distance
    const distance = Math.sqrt(
      Math.pow(traitsA.creativity - traitsB.creativity, 2) +
      Math.pow(traitsA.wisdom - traitsB.wisdom, 2) +
      Math.pow(traitsA.humor - traitsB.humor, 2) +
      Math.pow(traitsA.empathy - traitsB.empathy, 2)
    );
    
    const similarity = Math.max(0, 100 - (distance / 2)); // Normalize to 0-100%
    
    return {
      themeA,
      themeB,
      distance,
      similarity,
      isSimilar: similarity > 70,
      dominantTraitsMatch: themeA.dominant === themeB.dominant,
      animationTypesMatch: themeA.animation === themeB.animation,
      
      // Visual compatibility for UI grouping
      visuallyCompatible: similarity > 50 || themeA.animation === themeB.animation,
      
      // Suggested grouping for gallery/explore views
      shouldGroup: similarity > 60 && themeA.dominant === themeB.dominant,
    };
  }, [traitsA, traitsB]);
}