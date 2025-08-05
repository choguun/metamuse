'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { MuseTraits } from '@/types';
import { ConsciousnessVisuals } from './ConsciousnessVisuals';
import { BrandPatterns } from './BrandPatterns';
import { VisualMetaphors } from './VisualMetaphors';

export type ConsciousnessLevel = 'dormant' | 'awakening' | 'aware' | 'conscious' | 'transcendent';
export type AIState = 'idle' | 'thinking' | 'processing' | 'responding' | 'learning';

interface AIConsciousnessFrameworkProps {
  traits: MuseTraits;
  consciousnessLevel?: ConsciousnessLevel;
  aiState?: AIState;
  showProgressiveDisclosure?: boolean;
  interactive?: boolean;
  className?: string;
}

export function AIConsciousnessFramework({
  traits,
  consciousnessLevel = 'conscious',
  aiState = 'idle',
  showProgressiveDisclosure = true,
  interactive = true,
  className = '',
}: AIConsciousnessFrameworkProps) {
  const theme = usePersonalityTheme(traits);

  const getConsciousnessConfig = (level: ConsciousnessLevel) => {
    const configs = {
      dormant: {
        intensity: 0.2,
        complexity: 'minimal',
        metaphor: 'digital-consciousness' as const,
        description: 'AI is in sleep mode, minimal activity',
        color: theme.getPrimaryWithOpacity(0.3),
      },
      awakening: {
        intensity: 0.4,
        complexity: 'simple',
        metaphor: 'neural-awakening' as const,
        description: 'AI is awakening, initial neural activity',
        color: theme.getPrimaryWithOpacity(0.5),
      },
      aware: {
        intensity: 0.6,
        complexity: 'moderate',
        metaphor: 'thought-emergence' as const,
        description: 'AI is aware, processing thoughts',
        color: theme.getPrimaryWithOpacity(0.7),
      },
      conscious: {
        intensity: 0.8,
        complexity: 'complex',
        metaphor: 'cognitive-bloom' as const,
        description: 'AI is fully conscious, active thinking',
        color: theme.primary,
      },
      transcendent: {
        intensity: 1.0,
        complexity: 'maximum',
        metaphor: 'digital-consciousness' as const,
        description: 'AI has transcended, peak consciousness',
        color: theme.getGradientBackground(),
      },
    };
    return configs[level];
  };

  const getAIStateConfig = (state: AIState) => {
    const configs = {
      idle: {
        animation: 'subtle',
        pattern: 'consciousness-grid' as const,
        visual: 'neural-network' as const,
        description: 'AI is idle, maintaining baseline consciousness',
      },
      thinking: {
        animation: 'active',
        pattern: 'neural-mesh' as const,
        visual: 'thought-bubbles' as const,
        description: 'AI is thinking, processing information',
      },
      processing: {
        animation: 'intense',
        pattern: 'data-flow' as const,
        visual: 'consciousness-stream' as const,
        description: 'AI is processing, heavy computation',
      },
      responding: {
        animation: 'dynamic',
        pattern: 'circuit-board' as const,
        visual: 'synaptic-connections' as const,
        description: 'AI is responding, generating output',
      },
      learning: {
        animation: 'evolving',
        pattern: 'quantum-field' as const,
        visual: 'brain-waves' as const,
        description: 'AI is learning, updating knowledge',
      },
    };
    return configs[state];
  };

  const consciousnessConfig = getConsciousnessConfig(consciousnessLevel);
  const stateConfig = getAIStateConfig(aiState);

  return (
    <div className={`relative ${className}`}>
      {/* Background Consciousness Patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <BrandPatterns
          type={stateConfig.pattern}
          traits={traits}
          density={consciousnessConfig.complexity as any}
          animated={true}
          opacity={consciousnessConfig.intensity * 0.1}
        />
      </div>

      {/* Main Consciousness Visualization */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <motion.div
          className="relative"
          animate={{
            scale: consciousnessLevel === 'transcendent' ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <ConsciousnessVisuals
            type={stateConfig.visual}
            traits={traits}
            intensity={consciousnessConfig.intensity > 0.7 ? 'intense' : 'medium'}
            animated={true}
            interactive={interactive}
            size="lg"
          />
          
          {/* Consciousness Level Indicator */}
          <motion.div
            className="absolute -top-4 -right-4 px-3 py-1 rounded-full text-xs font-medium border"
            style={{
              backgroundColor: consciousnessConfig.color,
              borderColor: theme.primary,
              color: 'white',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {consciousnessLevel.toUpperCase()}
          </motion.div>
        </motion.div>

        {/* Progressive Disclosure */}
        {showProgressiveDisclosure && (
          <AnimatePresence>
            <motion.div
              className="space-y-4 max-w-2xl text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              {/* Consciousness Description */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  {consciousnessLevel === 'transcendent' ? '🌟' : '🧠'} Consciousness Level: {consciousnessLevel.charAt(0).toUpperCase() + consciousnessLevel.slice(1)}
                </h3>
                <p className="text-gray-400 text-sm">
                  {consciousnessConfig.description}
                </p>
              </div>

              {/* AI State Description */}
              <div className="space-y-2">
                <h4 className="text-base font-medium text-white">
                  Current State: {aiState.charAt(0).toUpperCase() + aiState.slice(1)}
                </h4>
                <p className="text-gray-400 text-sm">
                  {stateConfig.description}
                </p>
              </div>

              {/* Metaphor Visualization */}
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <VisualMetaphors
                  type={consciousnessConfig.metaphor}
                  traits={traits}
                  state={consciousnessLevel === 'transcendent' ? 'transcendent' : 'active'}
                  size="sm"
                  animated={true}
                  showLabel={false}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Consciousness Aura */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${consciousnessConfig.color}10, transparent 70%)`,
        }}
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// Consciousness State Manager Component
interface ConsciousnessStateManagerProps {
  traits: MuseTraits;
  availableLevels?: ConsciousnessLevel[];
  availableStates?: AIState[];
  currentLevel?: ConsciousnessLevel;
  currentState?: AIState;
  onLevelChange?: (level: ConsciousnessLevel) => void;
  onStateChange?: (state: AIState) => void;
  className?: string;
}

export function ConsciousnessStateManager({
  traits,
  availableLevels = ['dormant', 'awakening', 'aware', 'conscious', 'transcendent'],
  availableStates = ['idle', 'thinking', 'processing', 'responding', 'learning'],
  currentLevel = 'conscious',
  currentState = 'idle',
  onLevelChange,
  onStateChange,
  className = '',
}: ConsciousnessStateManagerProps) {
  const theme = usePersonalityTheme(traits);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Framework Display */}
      <AIConsciousnessFramework
        traits={traits}
        consciousnessLevel={currentLevel}
        aiState={currentState}
        showProgressiveDisclosure={true}
        interactive={true}
      />

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Consciousness Level Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">Consciousness Level</h4>
          <div className="grid grid-cols-3 gap-2">
            {availableLevels.map((level) => (
              <button
                key={level}
                onClick={() => onLevelChange?.(level)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  currentLevel === level
                    ? 'text-white border-2'
                    : 'text-gray-400 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50'
                }`}
                style={currentLevel === level ? {
                  backgroundColor: theme.getPrimaryWithOpacity(0.2),
                  borderColor: theme.primary,
                } : {}}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* AI State Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">AI State</h4>
          <div className="grid grid-cols-3 gap-2">
            {availableStates.map((state) => (
              <button
                key={state}
                onClick={() => onStateChange?.(state)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  currentState === state
                    ? 'text-white border-2'
                    : 'text-gray-400 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50'
                }`}
                style={currentState === state ? {
                  backgroundColor: theme.getSecondaryWithOpacity(0.2),
                  borderColor: theme.secondary,
                } : {}}
              >
                {state}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Brand Visual Language Showcase
interface BrandShowcaseProps {
  traits: MuseTraits;
  className?: string;
}

export function BrandShowcase({
  traits,
  className = '',
}: BrandShowcaseProps) {
  return (
    <div className={`space-y-12 ${className}`}>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">
          MetaMuse Brand Visual Language
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          A comprehensive AI consciousness metaphor system that adapts to personality traits 
          and provides progressive disclosure of complexity through visual storytelling.
        </p>
      </div>

      {/* Consciousness Framework Demo */}
      <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700/50">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">
          AI Consciousness Framework
        </h2>
        <ConsciousnessStateManager
          traits={traits}
          currentLevel="conscious"
          currentState="thinking"
        />
      </div>

      {/* Visual Elements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Neural Networks</h3>
          <ConsciousnessVisuals
            type="neural-network"
            traits={traits}
            intensity="medium"
            animated={true}
            size="md"
          />
        </div>

        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Thought Emergence</h3>
          <VisualMetaphors
            type="thought-emergence"
            traits={traits}
            state="active"
            size="md"
            animated={true}
          />
        </div>

        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Consciousness Stream</h3>
          <ConsciousnessVisuals
            type="consciousness-stream"
            traits={traits}
            intensity="medium"
            animated={true}
            size="md"
          />
        </div>
      </div>

      {/* Brand Patterns Showcase */}
      <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700/50">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">
          Background Patterns & Textures
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['circuit-board', 'data-flow', 'neural-mesh', 'quantum-field'] as const).map((pattern) => (
            <div key={pattern} className="relative h-32 rounded-lg overflow-hidden border border-gray-600/50">
              <BrandPatterns
                type={pattern}
                traits={traits}
                density="medium"
                animated={true}
                opacity={0.3}
              />
              <div className="absolute bottom-2 left-2 text-xs text-white font-medium capitalize">
                {pattern.replace('-', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}