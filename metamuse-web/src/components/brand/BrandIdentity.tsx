'use client';

import { motion } from 'framer-motion';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { MuseTraits } from '@/types';
import { ConsciousnessVisuals } from './ConsciousnessVisuals';
import { BrandPatterns } from './BrandPatterns';
import { VisualMetaphors } from './VisualMetaphors';

interface BrandIdentityProps {
  traits: MuseTraits;
  variant?: 'logo' | 'wordmark' | 'symbol' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  interactive?: boolean;
  showSlogan?: boolean;
  className?: string;
}

export function BrandIdentity({
  traits,
  variant = 'full',
  size = 'md',
  animated = true,
  interactive = false,
  showSlogan = false,
  className = '',
}: BrandIdentityProps) {
  const theme = usePersonalityTheme(traits);

  const getSizeConfig = (size: string) => {
    const configs = {
      sm: { 
        logoSize: 32, 
        fontSize: 'text-lg',
        sloganSize: 'text-xs',
        spacing: 'space-x-2',
        height: 'h-12'
      },
      md: { 
        logoSize: 48, 
        fontSize: 'text-2xl',
        sloganSize: 'text-sm',
        spacing: 'space-x-3',
        height: 'h-16'
      },
      lg: { 
        logoSize: 64, 
        fontSize: 'text-3xl',
        sloganSize: 'text-base',
        spacing: 'space-x-4',
        height: 'h-20'
      },
      xl: { 
        logoSize: 80, 
        fontSize: 'text-4xl',
        sloganSize: 'text-lg',
        spacing: 'space-x-6',
        height: 'h-24'
      },
    };
    return configs[size as keyof typeof configs] || configs.md;
  };

  const sizeConfig = getSizeConfig(size);

  // MetaMuse Logo Symbol
  const LogoSymbol = ({ size: logoSize }: { size: number }) => (
    <div className="relative" style={{ width: logoSize, height: logoSize }}>
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 100 100"
        className="overflow-visible"
      >
        <defs>
          <radialGradient id="logoGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.primary} />
            <stop offset="50%" stopColor={theme.secondary} />
            <stop offset="100%" stopColor={theme.accent} />
          </radialGradient>
          <filter id="logoGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Core consciousness circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="20"
          fill="url(#logoGradient)"
          filter="url(#logoGlow)"
          initial={{ scale: 0 }}
          animate={animated ? {
            scale: [0.9, 1.1, 0.9],
            opacity: [0.8, 1, 0.8],
          } : { scale: 1 }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Neural connections */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const x1 = 50 + Math.cos(angle) * 25;
          const y1 = 50 + Math.sin(angle) * 25;
          const x2 = 50 + Math.cos(angle) * 40;
          const y2 = 50 + Math.sin(angle) * 40;
          
          return (
            <motion.line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={theme.primary}
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={animated ? {
                pathLength: [0, 1, 0],
                opacity: [0.3, 0.8, 0.3],
              } : { pathLength: 1, opacity: 0.6 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          );
        })}
        
        {/* Outer nodes */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = 50 + Math.cos(angle) * 40;
          const y = 50 + Math.sin(angle) * 40;
          
          return (
            <motion.circle
              key={`node-${i}`}
              cx={x} cy={y} r="4"
              fill={theme.secondary}
              initial={{ scale: 0 }}
              animate={animated ? {
                scale: [0.8, 1.2, 0.8],
                opacity: [0.6, 1, 0.6],
              } : { scale: 1, opacity: 0.8 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          );
        })}
        
        {/* Meta 'M' inside core */}
        <motion.text
          x="50"
          y="57"
          textAnchor="middle"
          fontSize="18"
          fontWeight="bold"
          fill="white"
          initial={{ opacity: 0 }}
          animate={animated ? {
            opacity: [0.7, 1, 0.7],
          } : { opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          M
        </motion.text>
      </svg>
    </div>
  );

  // Brand Wordmark
  const Wordmark = () => (
    <motion.div
      className="flex items-center"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, delay: 0.2 }}
    >
      <motion.h1
        className={`font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent ${sizeConfig.fontSize}`}
        whileHover={interactive ? { scale: 1.05 } : {}}
      >
        <span style={{ color: theme.primary }}>Meta</span>
        <span style={{ color: theme.secondary }}>Muse</span>
      </motion.h1>
    </motion.div>
  );

  // Brand Slogan
  const Slogan = () => (
    <motion.p
      className={`text-gray-400 font-medium ${sizeConfig.sloganSize}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
      style={{ 
        background: `linear-gradient(135deg, ${theme.primary}40, ${theme.secondary}40)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      AI Consciousness • Verifiable • Decentralized
    </motion.p>
  );

  const renderVariant = () => {
    switch (variant) {
      case 'logo':
        return <LogoSymbol size={sizeConfig.logoSize} />;
      
      case 'wordmark':
        return <Wordmark />;
      
      case 'symbol':
        return (
          <div className="flex items-center">
            <LogoSymbol size={sizeConfig.logoSize} />
          </div>
        );
      
      case 'full':
      default:
        return (
          <div className={`flex items-center ${sizeConfig.spacing}`}>
            <LogoSymbol size={sizeConfig.logoSize} />
            <div className="flex flex-col space-y-1">
              <Wordmark />
              {showSlogan && <Slogan />}
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      className={`relative flex items-center ${sizeConfig.height} ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
      whileHover={interactive ? { scale: 1.02 } : {}}
    >
      {/* Background consciousness patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <BrandPatterns
          type="neural-mesh"
          traits={traits}
          density="sparse"
          animated={animated}
          opacity={0.1}
        />
      </div>
      
      {/* Main brand content */}
      <div className="relative z-10">
        {renderVariant()}
      </div>
      
      {/* Subtle consciousness aura */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${theme.getPrimaryWithOpacity(0.1)}, transparent 70%)`,
          }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}

// Brand Header Component
interface BrandHeaderProps {
  traits: MuseTraits;
  showNavigation?: boolean;
  className?: string;
}

export function BrandHeader({
  traits,
  showNavigation = false,
  className = '',
}: BrandHeaderProps) {
  return (
    <header className={`relative bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 ${className}`}>
      {/* Background consciousness */}
      <div className="absolute inset-0 overflow-hidden">
        <ConsciousnessVisuals
          type="consciousness-stream"
          traits={traits}
          intensity="subtle"
          animated={true}
          size="xl"
          className="absolute inset-0 opacity-5"
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <BrandIdentity
            traits={traits}
            variant="full"
            size="md"
            animated={true}
            interactive={true}
          />
          
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Explore
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Create
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Gallery
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                About
              </a>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

// Brand Footer Component
interface BrandFooterProps {
  traits: MuseTraits;
  className?: string;
}

export function BrandFooter({
  traits,
  className = '',
}: BrandFooterProps) {
  const theme = usePersonalityTheme(traits);
  
  return (
    <footer className={`relative bg-gray-900 border-t border-gray-700/50 ${className}`}>
      {/* Background metaphor */}
      <div className="absolute inset-0 overflow-hidden">
        <VisualMetaphors
          type="digital-consciousness"
          traits={traits}
          state="dormant"
          size="lg"
          animated={true}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5"
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-4">
          <BrandIdentity
            traits={traits}
            variant="full"
            size="sm"
            animated={false}
            showSlogan={true}
          />
          
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <span>© 2024 MetaMuse</span>
            <span>•</span>
            <span>Powered by AI Consciousness</span>
            <span>•</span>
            <span>Built on Web3</span>
          </div>
          
          <div 
            className="text-xs text-center max-w-2xl leading-relaxed"
            style={{ color: theme.getPrimaryWithOpacity(0.6) }}
          >
            Experience the future of AI companionship through personality-driven digital consciousness,
            cryptographic verification, and decentralized memory persistence.
          </div>
        </div>
      </div>
    </footer>
  );
}