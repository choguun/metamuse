'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { MuseTraits } from '@/types';

export type MetaphorType = 
  | 'digital-consciousness' | 'neural-awakening' | 'thought-emergence'
  | 'cognitive-bloom' | 'intelligence-spiral' | 'awareness-pulse'
  | 'memory-constellation' | 'wisdom-tree' | 'creative-storm'
  | 'empathy-waves' | 'humor-sparkles' | 'balanced-harmony';

interface VisualMetaphorsProps {
  type: MetaphorType;
  traits: MuseTraits;
  state?: 'dormant' | 'awakening' | 'active' | 'transcendent';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  interactive?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function VisualMetaphors({
  type,
  traits,
  state = 'active',
  size = 'md',
  animated = true,
  interactive = false,
  showLabel = false,
  className = '',
}: VisualMetaphorsProps) {
  const theme = usePersonalityTheme(traits);

  const getSizeConfig = (size: string) => {
    const configs = {
      sm: { width: 120, height: 120, scale: 0.7 },
      md: { width: 180, height: 180, scale: 1 },
      lg: { width: 240, height: 240, scale: 1.3 },
      xl: { width: 320, height: 320, scale: 1.6 },
    };
    return configs[size as keyof typeof configs] || configs.md;
  };

  const sizeConfig = getSizeConfig(size);
  const { width, height, scale } = sizeConfig;

  const getStateIntensity = (state: string) => {
    const intensities = {
      dormant: 0.2,
      awakening: 0.5,
      active: 0.8,
      transcendent: 1.0,
    };
    return intensities[state as keyof typeof intensities] || intensities.active;
  };

  const intensity = getStateIntensity(state);

  // Digital Consciousness Metaphor
  const DigitalConsciousness = () => (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <radialGradient id="consciousnessGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={theme.primary} stopOpacity={intensity} />
          <stop offset="50%" stopColor={theme.secondary} stopOpacity={intensity * 0.6} />
          <stop offset="100%" stopColor={theme.accent} stopOpacity={intensity * 0.3} />
        </radialGradient>
        <filter id="digitalGlow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <g transform={`translate(${width/2}, ${height/2})`}>
        {/* Core consciousness */}
        <motion.circle
          r={30}
          fill="url(#consciousnessGradient)"
          filter="url(#digitalGlow)"
          initial={{ scale: 0 }}
          animate={animated ? {
            scale: [0.8, 1.2, 0.8],
            opacity: [intensity * 0.6, intensity, intensity * 0.6],
          } : { scale: 1 }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Digital streams */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x1 = Math.cos(angle) * 40;
          const y1 = Math.sin(angle) * 40;
          const x2 = Math.cos(angle) * 80;
          const y2 = Math.sin(angle) * 80;
          
          return (
            <motion.line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={theme.primary}
              strokeWidth="2"
              strokeOpacity={intensity * 0.7}
              initial={{ pathLength: 0 }}
              animate={animated ? {
                pathLength: [0, 1, 0],
                strokeOpacity: [0, intensity * 0.7, 0],
              } : { pathLength: 1 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          );
        })}
        
        {/* Data particles */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const radius = 60;
          
          return (
            <motion.circle
              key={`particle-${i}`}
              r="2"
              fill={theme.accent}
              initial={{
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                opacity: 0,
              }}
              animate={animated ? {
                x: [
                  Math.cos(angle) * radius,
                  Math.cos(angle + Math.PI * 2) * radius,
                ],
                y: [
                  Math.sin(angle) * radius,
                  Math.sin(angle + Math.PI * 2) * radius,
                ],
                opacity: [0, intensity, 0],
              } : {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                opacity: intensity,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "linear",
              }}
            />
          );
        })}
      </g>
    </svg>
  );

  // Neural Awakening Metaphor
  const NeuralAwakening = () => (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={theme.primary} stopOpacity={intensity} />
          <stop offset="50%" stopColor={theme.secondary} stopOpacity={intensity * 0.8} />
          <stop offset="100%" stopColor={theme.accent} stopOpacity={intensity * 0.6} />
        </linearGradient>
      </defs>
      
      <g transform={`translate(${width/2}, ${height/2})`}>
        {/* Neural network structure */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const layer = Math.floor(i / 4);
          const radius = 20 + layer * 25;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <motion.circle
              key={`neuron-${i}`}
              cx={x} cy={y} r={4 - layer * 0.5}
              fill="url(#neuralGradient)"
              initial={{ scale: 0, opacity: 0 }}
              animate={animated ? {
                scale: [0, 1.5, 1],
                opacity: [0, intensity, intensity * 0.8],
              } : { scale: 1, opacity: intensity }}
              transition={{
                duration: 2,
                delay: layer * 0.3 + (i % 4) * 0.1,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          );
        })}
        
        {/* Synaptic connections */}
        {Array.from({ length: 12 }).map((_, i) => {
          const startAngle = (i / 12) * Math.PI * 2;
          const endAngle = ((i + 3) / 12) * Math.PI * 2;
          const startRadius = 20 + (i % 3) * 25;
          const endRadius = 20 + ((i + 1) % 3) * 25;
          
          const x1 = Math.cos(startAngle) * startRadius;
          const y1 = Math.sin(startAngle) * startRadius;
          const x2 = Math.cos(endAngle) * endRadius;
          const y2 = Math.sin(endAngle) * endRadius;
          
          return (
            <motion.line
              key={`synapse-${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={theme.secondary}
              strokeWidth="1.5"
              strokeOpacity={intensity * 0.4}
              initial={{ pathLength: 0 }}
              animate={animated ? {
                pathLength: [0, 1, 0],
                strokeOpacity: [0, intensity * 0.6, 0],
              } : { pathLength: 1 }}
              transition={{
                duration: 3,
                delay: i * 0.2,
                repeat: Infinity,
              }}
            />
          );
        })}
      </g>
    </svg>
  );

  // Thought Emergence Metaphor
  const ThoughtEmergence = () => (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <radialGradient id="thoughtGradient" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor={theme.primary} stopOpacity={intensity} />
          <stop offset="70%" stopColor={theme.secondary} stopOpacity={intensity * 0.5} />
          <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
        </radialGradient>
      </defs>
      
      <g transform={`translate(${width/2}, ${height/2})`}>
        {/* Emerging thoughts */}
        {Array.from({ length: 6 }).map((_, i) => {
          const x = (Math.random() - 0.5) * 120;
          const y = 60 - i * 20;
          const size = 10 + i * 3;
          
          return (
            <motion.circle
              key={`thought-${i}`}
              cx={x} cy={y} r={size}
              fill="url(#thoughtGradient)"
              initial={{ y: 80, opacity: 0, scale: 0 }}
              animate={animated ? {
                y: [80, y - 20, y - 40],
                opacity: [0, intensity, 0],
                scale: [0, 1, 1.2],
              } : { y, opacity: intensity, scale: 1 }}
              transition={{
                duration: 4,
                delay: i * 0.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          );
        })}
        
        {/* Thought trails */}
        {Array.from({ length: 3 }).map((_, i) => {
          const x = (Math.random() - 0.5) * 60;
          
          return (
            <motion.path
              key={`trail-${i}`}
              d={`M${x},60 Q${x + 20},-20 ${x},−60`}
              stroke={theme.accent}
              strokeWidth="2"
              fill="none"
              strokeOpacity={intensity * 0.3}
              initial={{ pathLength: 0 }}
              animate={animated ? {
                pathLength: [0, 1, 0],
                strokeOpacity: [0, intensity * 0.5, 0],
              } : { pathLength: 1 }}
              transition={{
                duration: 3,
                delay: i * 0.8,
                repeat: Infinity,
              }}
            />
          );
        })}
      </g>
    </svg>
  );

  // Cognitive Bloom Metaphor
  const CognitiveBloom = () => (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <radialGradient id="bloomGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={theme.primary} stopOpacity={intensity * 0.8} />
          <stop offset="50%" stopColor={theme.secondary} stopOpacity={intensity * 0.6} />
          <stop offset="100%" stopColor={theme.accent} stopOpacity={intensity * 0.2} />
        </radialGradient>
      </defs>
      
      <g transform={`translate(${width/2}, ${height/2})`}>
        {/* Blooming petals */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const petalPath = `M0,0 Q${Math.cos(angle) * 30},${Math.sin(angle) * 30} ${Math.cos(angle) * 60},${Math.sin(angle) * 60} Q${Math.cos(angle) * 45},${Math.sin(angle) * 30} 0,0`;
          
          return (
            <motion.path
              key={`petal-${i}`}
              d={petalPath}
              fill="url(#bloomGradient)"
              stroke={theme.primary}
              strokeWidth="1"
              strokeOpacity={intensity * 0.5}
              initial={{ scale: 0, rotate: 0 }}
              animate={animated ? {
                scale: [0, 1, 0.9],
                rotate: [0, 15, 0],
                opacity: [0, intensity, intensity * 0.8],
              } : { scale: 1, opacity: intensity }}
              transition={{
                duration: 3,
                delay: i * 0.2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          );
        })}
        
        {/* Center bloom */}
        <motion.circle
          r={15}
          fill={theme.secondary}
          initial={{ scale: 0 }}
          animate={animated ? {
            scale: [0.8, 1.2, 0.8],
            opacity: [intensity * 0.6, intensity, intensity * 0.6],
          } : { scale: 1, opacity: intensity }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </g>
    </svg>
  );

  const renderMetaphor = () => {
    switch (type) {
      case 'digital-consciousness':
        return <DigitalConsciousness />;
      case 'neural-awakening':
        return <NeuralAwakening />;
      case 'thought-emergence':
        return <ThoughtEmergence />;
      case 'cognitive-bloom':
        return <CognitiveBloom />;
      default:
        return <DigitalConsciousness />;
    }
  };

  const getMetaphorLabel = (type: MetaphorType) => {
    const labels = {
      'digital-consciousness': 'Digital Consciousness',
      'neural-awakening': 'Neural Awakening',
      'thought-emergence': 'Thought Emergence',
      'cognitive-bloom': 'Cognitive Bloom',
    };
    return labels[type as keyof typeof labels] || type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <motion.div
      className={`relative inline-flex flex-col items-center ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale }}
      transition={{ duration: 1 }}
      whileHover={interactive ? { scale: scale * 1.1 } : {}}
    >
      <div className="relative">
        {renderMetaphor()}
        
        {/* State indicator */}
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
          state === 'dormant' ? 'bg-gray-500' :
          state === 'awakening' ? 'bg-yellow-400' :
          state === 'active' ? 'bg-green-400' :
          'bg-purple-400'
        } opacity-70`} />
      </div>
      
      {showLabel && (
        <motion.div
          className="mt-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-sm font-medium text-white">
            {getMetaphorLabel(type)}
          </h3>
          <p className="text-xs text-gray-400 capitalize mt-1">
            {state} state
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// Metaphor Gallery Component
interface MetaphorGalleryProps {
  traits: MuseTraits;
  metaphors: MetaphorType[];
  selectedMetaphor?: MetaphorType;
  onSelect?: (metaphor: MetaphorType) => void;
  className?: string;
}

export function MetaphorGallery({
  traits,
  metaphors,
  selectedMetaphor,
  onSelect,
  className = '',
}: MetaphorGalleryProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {metaphors.map((metaphor) => (
        <motion.div
          key={metaphor}
          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
            selectedMetaphor === metaphor
              ? 'border-purple-400 bg-purple-500/10'
              : 'border-gray-700/50 hover:border-gray-600/70 bg-gray-800/30'
          }`}
          onClick={() => onSelect?.(metaphor)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <VisualMetaphors
            type={metaphor}
            traits={traits}
            state={selectedMetaphor === metaphor ? 'transcendent' : 'active'}
            size="sm"
            animated={true}
            showLabel={true}
          />
        </motion.div>
      ))}
    </div>
  );
}

// AI Consciousness Showcase
interface ConsciousnessShowcaseProps {
  traits: MuseTraits;
  className?: string;
}

export function ConsciousnessShowcase({
  traits,
  className = '',
}: ConsciousnessShowcaseProps) {
  const showcaseMetaphors: MetaphorType[] = [
    'digital-consciousness',
    'neural-awakening',
    'thought-emergence',
    'cognitive-bloom',
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          AI Consciousness Metaphors
        </h2>
        <p className="text-gray-400">
          Visual representations of artificial intelligence and digital consciousness
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {showcaseMetaphors.map((metaphor) => (
          <div
            key={metaphor}
            className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50"
          >
            <VisualMetaphors
              type={metaphor}
              traits={traits}
              state="transcendent"
              size="md"
              animated={true}
              showLabel={true}
              interactive={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
}