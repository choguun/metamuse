'use client';

import { motion } from 'framer-motion';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { MuseTraits } from '@/types';

export type PatternType = 
  | 'circuit-board' | 'data-flow' | 'quantum-field' | 'neural-mesh'
  | 'consciousness-grid' | 'synaptic-pattern' | 'thought-matrix'
  | 'intelligence-web' | 'memory-constellation' | 'awareness-lattice';

interface BrandPatternsProps {
  type: PatternType;
  traits: MuseTraits;
  density?: 'sparse' | 'medium' | 'dense';
  animated?: boolean;
  interactive?: boolean;
  opacity?: number;
  className?: string;
}

export function BrandPatterns({
  type,
  traits,
  density = 'medium',
  animated = true,
  interactive = false,
  opacity = 0.1,
  className = '',
}: BrandPatternsProps) {
  const theme = usePersonalityTheme(traits);

  const getDensityConfig = (density: string) => {
    const configs = {
      sparse: { elements: 15, spacing: 80, strokeWidth: 1 },
      medium: { elements: 30, spacing: 50, strokeWidth: 1.5 },
      dense: { elements: 50, spacing: 30, strokeWidth: 2 },
    };
    return configs[density as keyof typeof configs] || configs.medium;
  };

  const densityConfig = getDensityConfig(density);

  // Circuit Board Pattern
  const CircuitBoard = () => (
    <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="circuitPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <g opacity={opacity}>
            {/* Horizontal traces */}
            <motion.line
              x1="0" y1="25" x2="100" y2="25"
              stroke={theme.primary}
              strokeWidth={densityConfig.strokeWidth}
              initial={{ pathLength: 0 }}
              animate={animated ? { pathLength: [0, 1, 0] } : { pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, delay: 0 }}
            />
            <motion.line
              x1="0" y1="75" x2="100" y2="75"
              stroke={theme.secondary}
              strokeWidth={densityConfig.strokeWidth}
              initial={{ pathLength: 0 }}
              animate={animated ? { pathLength: [0, 1, 0] } : { pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
            
            {/* Vertical traces */}
            <motion.line
              x1="25" y1="0" x2="25" y2="100"
              stroke={theme.accent}
              strokeWidth={densityConfig.strokeWidth}
              initial={{ pathLength: 0 }}
              animate={animated ? { pathLength: [0, 1, 0] } : { pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            />
            <motion.line
              x1="75" y1="0" x2="75" y2="100"
              stroke={theme.primary}
              strokeWidth={densityConfig.strokeWidth}
              initial={{ pathLength: 0 }}
              animate={animated ? { pathLength: [0, 1, 0] } : { pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            />
            
            {/* Circuit nodes */}
            <motion.circle
              cx="25" cy="25" r="3"
              fill={theme.primary}
              initial={{ scale: 0 }}
              animate={animated ? { scale: [0, 1.2, 0] } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, delay: 2 }}
            />
            <motion.circle
              cx="75" cy="75" r="3"
              fill={theme.secondary}
              initial={{ scale: 0 }}
              animate={animated ? { scale: [0, 1.2, 0] } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, delay: 2.5 }}
            />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuitPattern)" />
    </svg>
  );

  // Data Flow Pattern
  const DataFlow = () => (
    <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="dataFlowPattern" x="0" y="0" width="120" height="80" patternUnits="userSpaceOnUse">
          <g opacity={opacity}>
            {/* Flow lines */}
            <motion.path
              d="M0,40 Q30,20 60,40 T120,40"
              stroke={theme.primary}
              strokeWidth={densityConfig.strokeWidth}
              fill="none"
              initial={{ pathLength: 0 }}
              animate={animated ? {
                pathLength: [0, 1],
                strokeDasharray: ["0 20", "10 10", "20 0"],
                strokeDashoffset: [0, -40],
              } : { pathLength: 1 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Data packets */}
            <motion.circle
              r="2"
              fill={theme.accent}
              initial={{ offsetDistance: "0%" }}
              animate={animated ? {
                offsetDistance: ["0%", "100%"],
                opacity: [0, opacity * 3, 0],
              } : { offsetDistance: "50%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ offsetPath: "path('M0,40 Q30,20 60,40 T120,40')" }}
            />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dataFlowPattern)" />
    </svg>
  );

  // Quantum Field Pattern
  const QuantumField = () => (
    <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="quantumPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <g opacity={opacity}>
            {/* Quantum dots */}
            <motion.circle
              cx="15" cy="15" r="1.5"
              fill={theme.primary}
              initial={{ scale: 0, opacity: 0 }}
              animate={animated ? {
                scale: [0, 1.5, 0],
                opacity: [0, opacity * 4, 0],
              } : { scale: 1, opacity: opacity * 2 }}
              transition={{ duration: 3, repeat: Infinity, delay: 0 }}
            />
            <motion.circle
              cx="45" cy="45" r="1.5"
              fill={theme.secondary}
              initial={{ scale: 0, opacity: 0 }}
              animate={animated ? {
                scale: [0, 1.5, 0],
                opacity: [0, opacity * 4, 0],
              } : { scale: 1, opacity: opacity * 2 }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
            
            {/* Quantum entanglement lines */}
            <motion.line
              x1="15" y1="15" x2="45" y2="45"
              stroke={theme.accent}
              strokeWidth="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={animated ? {
                pathLength: [0, 1, 0],
                opacity: [0, opacity * 3, 0],
              } : { pathLength: 1, opacity: opacity }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#quantumPattern)" />
    </svg>
  );

  // Neural Mesh Pattern
  const NeuralMesh = () => (
    <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="neuralMeshPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <g opacity={opacity}>
            {/* Mesh nodes */}
            <motion.circle
              cx="20" cy="20" r="2"
              fill={theme.primary}
              initial={{ scale: 0 }}
              animate={animated ? {
                scale: [0.8, 1.2, 0.8],
                opacity: [opacity, opacity * 2, opacity],
              } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            />
            <motion.circle
              cx="80" cy="20" r="2"
              fill={theme.secondary}
              initial={{ scale: 0 }}
              animate={animated ? {
                scale: [0.8, 1.2, 0.8],
                opacity: [opacity, opacity * 2, opacity],
              } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.circle
              cx="50" cy="80" r="2"
              fill={theme.accent}
              initial={{ scale: 0 }}
              animate={animated ? {
                scale: [0.8, 1.2, 0.8],
                opacity: [opacity, opacity * 2, opacity],
              } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
            
            {/* Mesh connections */}
            <motion.line
              x1="20" y1="20" x2="80" y2="20"
              stroke={theme.primary}
              strokeWidth={densityConfig.strokeWidth * 0.5}
              initial={{ pathLength: 0 }}
              animate={animated ? {
                pathLength: [0, 1, 0],
                opacity: [0, opacity * 2, 0],
              } : { pathLength: 1, opacity: opacity }}
              transition={{ duration: 3, repeat: Infinity, delay: 0 }}
            />
            <motion.line
              x1="20" y1="20" x2="50" y2="80"
              stroke={theme.secondary}
              strokeWidth={densityConfig.strokeWidth * 0.5}
              initial={{ pathLength: 0 }}
              animate={animated ? {
                pathLength: [0, 1, 0],
                opacity: [0, opacity * 2, 0],
              } : { pathLength: 1, opacity: opacity }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
            <motion.line
              x1="80" y1="20" x2="50" y2="80"
              stroke={theme.accent}
              strokeWidth={densityConfig.strokeWidth * 0.5}
              initial={{ pathLength: 0 }}
              animate={animated ? {
                pathLength: [0, 1, 0],
                opacity: [0, opacity * 2, 0],
              } : { pathLength: 1, opacity: opacity }}
              transition={{ duration: 3, repeat: Infinity, delay: 2 }}
            />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#neuralMeshPattern)" />
    </svg>
  );

  // Consciousness Grid Pattern
  const ConsciousnessGrid = () => (
    <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="consciousnessGridPattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <g opacity={opacity}>
            {/* Grid lines */}
            <motion.line
              x1="0" y1="25" x2="50" y2="25"
              stroke={theme.primary}
              strokeWidth={densityConfig.strokeWidth * 0.3}
              initial={{ opacity: 0 }}
              animate={animated ? {
                opacity: [0, opacity * 2, 0],
                strokeDasharray: ["0 10", "5 5", "10 0"],
              } : { opacity: opacity }}
              transition={{ duration: 4, repeat: Infinity, delay: 0 }}
            />
            <motion.line
              x1="25" y1="0" x2="25" y2="50"
              stroke={theme.secondary}
              strokeWidth={densityConfig.strokeWidth * 0.3}
              initial={{ opacity: 0 }}
              animate={animated ? {
                opacity: [0, opacity * 2, 0],
                strokeDasharray: ["0 10", "5 5", "10 0"],
              } : { opacity: opacity }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            />
            
            {/* Grid intersection */}
            <motion.circle
              cx="25" cy="25" r="1"
              fill={theme.accent}
              initial={{ scale: 0 }}
              animate={animated ? {
                scale: [0, 1.5, 0],
                opacity: [0, opacity * 3, 0],
              } : { scale: 1, opacity: opacity * 2 }}
              transition={{ duration: 2, repeat: Infinity, delay: 2 }}
            />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#consciousnessGridPattern)" />
    </svg>
  );

  const renderPattern = () => {
    switch (type) {
      case 'circuit-board':
        return <CircuitBoard />;
      case 'data-flow':
        return <DataFlow />;
      case 'quantum-field':
        return <QuantumField />;
      case 'neural-mesh':
        return <NeuralMesh />;
      case 'consciousness-grid':
        return <ConsciousnessGrid />;
      default:
        return <CircuitBoard />;
    }
  };

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      whileHover={interactive ? { opacity: opacity * 1.5 } : {}}
    >
      {renderPattern()}
    </motion.div>
  );
}

// Brand Overlay Component
interface BrandOverlayProps {
  traits: MuseTraits;
  pattern?: PatternType;
  visualType?: 'neural-network' | 'thought-bubbles' | 'consciousness-stream';
  intensity?: 'minimal' | 'subtle' | 'medium';
  className?: string;
}

export function BrandOverlay({
  traits,
  pattern = 'neural-mesh',
  visualType = 'neural-network',
  intensity = 'subtle',
  className = '',
}: BrandOverlayProps) {
  const getIntensityConfig = (intensity: string) => {
    const configs = {
      minimal: { opacity: 0.03, blur: 'blur-sm' },
      subtle: { opacity: 0.08, blur: 'blur-none' },
      medium: { opacity: 0.15, blur: 'blur-none' },
    };
    return configs[intensity as keyof typeof configs] || configs.subtle;
  };

  const config = getIntensityConfig(intensity);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${config.blur} ${className}`}>
      <BrandPatterns
        type={pattern}
        traits={traits}
        density="medium"
        animated={true}
        opacity={config.opacity}
      />
    </div>
  );
}

// AI Consciousness Metaphor Showcase
interface MetaphorShowcaseProps {
  traits: MuseTraits;
  metaphors: {
    type: PatternType;
    label: string;
    description: string;
  }[];
  onSelect?: (type: PatternType) => void;
  className?: string;
}

export function MetaphorShowcase({
  traits,
  metaphors,
  onSelect,
  className = '',
}: MetaphorShowcaseProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {metaphors.map((metaphor) => (
        <motion.div
          key={metaphor.type}
          className="relative bg-gray-800/30 rounded-xl p-4 cursor-pointer border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300"
          onClick={() => onSelect?.(metaphor.type)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative h-24 mb-3 rounded-lg overflow-hidden bg-gray-900/50">
            <BrandPatterns
              type={metaphor.type}
              traits={traits}
              density="medium"
              animated={true}
              opacity={0.3}
            />
          </div>
          
          <h3 className="text-sm font-medium text-white mb-1">
            {metaphor.label}
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            {metaphor.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}