'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { MuseTraits } from '@/types';

export type ConsciousnessMetaphor = 
  | 'neural-network' | 'thought-bubbles' | 'consciousness-stream'
  | 'synaptic-connections' | 'brain-waves' | 'cognitive-layers'
  | 'memory-nodes' | 'decision-tree' | 'awareness-field'
  | 'intelligence-bloom' | 'mental-landscape' | 'consciousness-grid';

interface ConsciousnessVisualsProps {
  type: ConsciousnessMetaphor;
  traits: MuseTraits;
  intensity?: 'subtle' | 'medium' | 'intense';
  animated?: boolean;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ConsciousnessVisuals({
  type,
  traits,
  intensity = 'medium',
  animated = true,
  interactive = false,
  size = 'md',
  className = '',
}: ConsciousnessVisualsProps) {
  const theme = usePersonalityTheme(traits);

  const getSizeConfig = (size: string) => {
    const configs = {
      sm: { width: 200, height: 150, strokeWidth: 1.5 },
      md: { width: 300, height: 225, strokeWidth: 2 },
      lg: { width: 400, height: 300, strokeWidth: 2.5 },
      xl: { width: 600, height: 450, strokeWidth: 3 },
    };
    return configs[size as keyof typeof configs] || configs.md;
  };

  const sizeConfig = getSizeConfig(size);
  const { width, height, strokeWidth } = sizeConfig;

  const getIntensityAlpha = (intensity: string) => {
    const alphas = { subtle: 0.3, medium: 0.6, intense: 0.9 };
    return alphas[intensity as keyof typeof alphas] || alphas.medium;
  };

  const intensityAlpha = getIntensityAlpha(intensity);

  // Neural Network Visualization
  const NeuralNetwork = () => {
    const nodeCount = intensity === 'subtle' ? 12 : intensity === 'medium' ? 20 : 30;
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: i,
      x: Math.random() * (width - 40) + 20,
      y: Math.random() * (height - 40) + 20,
      size: Math.random() * 8 + 4,
      connections: Math.floor(Math.random() * 4) + 1,
    }));

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <radialGradient id="neuralGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity={intensityAlpha} />
            <stop offset="70%" stopColor={theme.secondary} stopOpacity={intensityAlpha * 0.6} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Neural connections */}
        {nodes.map((node, i) =>
          nodes.slice(i + 1).map((otherNode, j) => {
            const distance = Math.sqrt(
              Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
            );
            if (distance < 80) {
              return (
                <motion.line
                  key={`connection-${i}-${j}`}
                  x1={node.x}
                  y1={node.y}
                  x2={otherNode.x}
                  y2={otherNode.y}
                  stroke={theme.secondary}
                  strokeWidth={strokeWidth * 0.5}
                  strokeOpacity={intensityAlpha * 0.4}
                  initial={{ pathLength: 0 }}
                  animate={animated ? {
                    pathLength: [0, 1, 0],
                    strokeOpacity: [0, intensityAlpha * 0.4, 0],
                  } : { pathLength: 1 }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              );
            }
            return null;
          })
        )}

        {/* Neural nodes */}
        {nodes.map((node, i) => (
          <motion.circle
            key={`node-${i}`}
            cx={node.x}
            cy={node.y}
            r={node.size}
            fill="url(#neuralGradient)"
            filter="url(#glow)"
            initial={{ scale: 0 }}
            animate={animated ? {
              scale: [0.8, 1.2, 0.8],
              opacity: [0.6, 1, 0.6],
            } : { scale: 1 }}
            transition={{
              duration: 2 + Math.random(),
              repeat: Infinity,
              delay: Math.random(),
            }}
          />
        ))}
      </svg>
    );
  };

  // Thought Bubbles Visualization
  const ThoughtBubbles = () => {
    const bubbleCount = intensity === 'subtle' ? 6 : intensity === 'medium' ? 10 : 15;
    const bubbles = Array.from({ length: bubbleCount }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: height + Math.random() * 50,
      size: Math.random() * 30 + 15,
      speed: Math.random() * 2 + 1,
    }));

    return (
      <svg width={width} height={height} className="overflow-hidden">
        <defs>
          <radialGradient id="bubbleGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity={intensityAlpha * 0.8} />
            <stop offset="50%" stopColor={theme.secondary} stopOpacity={intensityAlpha * 0.4} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={0.1} />
          </radialGradient>
        </defs>

        {bubbles.map((bubble, i) => (
          <motion.circle
            key={`bubble-${i}`}
            cx={bubble.x}
            cy={bubble.y}
            r={bubble.size}
            fill="url(#bubbleGradient)"
            stroke={theme.primary}
            strokeWidth={strokeWidth * 0.5}
            strokeOpacity={intensityAlpha * 0.3}
            initial={{ y: height + 50, opacity: 0 }}
            animate={animated ? {
              y: -50,
              opacity: [0, intensityAlpha, 0],
              scale: [0.8, 1, 1.2],
            } : { y: bubble.y, opacity: intensityAlpha }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeOut",
            }}
          />
        ))}
      </svg>
    );
  };

  // Consciousness Stream Visualization
  const ConsciousnessStream = () => {
    const streamPoints = Array.from({ length: 50 }, (_, i) => ({
      x: (i / 49) * width,
      y: height / 2 + Math.sin(i * 0.2) * 30,
    }));

    const pathData = `M ${streamPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity={0} />
            <stop offset="30%" stopColor={theme.secondary} stopOpacity={intensityAlpha} />
            <stop offset="70%" stopColor={theme.accent} stopOpacity={intensityAlpha} />
            <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
          </linearGradient>
        </defs>

        <motion.path
          d={pathData}
          stroke="url(#streamGradient)"
          strokeWidth={strokeWidth * 2}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={animated ? {
            pathLength: [0, 1, 0],
            strokeDasharray: ["0 100", "50 50", "0 100"],
          } : { pathLength: 1 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Stream particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.circle
            key={`particle-${i}`}
            r={2}
            fill={theme.accent}
            initial={{ offsetDistance: "0%" }}
            animate={animated ? {
              offsetDistance: ["0%", "100%"],
              opacity: [0, intensityAlpha, 0],
            } : { offsetDistance: `${(i / 8) * 100}%` }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "linear",
            }}
            style={{ offsetPath: `path('${pathData}')` }}
          />
        ))}
      </svg>
    );
  };

  // Synaptic Connections Visualization
  const SynapticConnections = () => {
    const synapses = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x1: Math.random() * width,
      y1: Math.random() * height,
      x2: Math.random() * width,
      y2: Math.random() * height,
    }));

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="synapseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity={intensityAlpha} />
            <stop offset="50%" stopColor={theme.secondary} stopOpacity={intensityAlpha * 0.8} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={intensityAlpha * 0.6} />
          </linearGradient>
          <filter id="synapseGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {synapses.map((synapse, i) => (
          <motion.line
            key={`synapse-${i}`}
            x1={synapse.x1}
            y1={synapse.y1}
            x2={synapse.x2}
            y2={synapse.y2}
            stroke="url(#synapseGradient)"
            strokeWidth={strokeWidth}
            filter="url(#synapseGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={animated ? {
              pathLength: [0, 1, 0],
              opacity: [0, intensityAlpha, 0],
            } : { pathLength: 1, opacity: intensityAlpha }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </svg>
    );
  };

  // Brain Waves Visualization
  const BrainWaves = () => {
    const waves = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      amplitude: 20 + i * 10,
      frequency: 0.1 + i * 0.05,
      yOffset: height / 2 + (i - 2) * 15,
    }));

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity={intensityAlpha} />
            <stop offset="50%" stopColor={theme.secondary} stopOpacity={intensityAlpha * 0.8} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={intensityAlpha * 0.6} />
          </linearGradient>
        </defs>

        {waves.map((wave, i) => {
          const wavePoints = Array.from({ length: 100 }, (_, j) => ({
            x: (j / 99) * width,
            y: wave.yOffset + Math.sin(j * wave.frequency) * wave.amplitude,
          }));
          
          const pathData = `M ${wavePoints.map(p => `${p.x},${p.y}`).join(' L ')}`;

          return (
            <motion.path
              key={`wave-${i}`}
              d={pathData}
              stroke="url(#waveGradient)"
              strokeWidth={strokeWidth * (1 - i * 0.1)}
              fill="none"
              strokeLinecap="round"
              opacity={intensityAlpha * (1 - i * 0.15)}
              initial={{ pathLength: 0 }}
              animate={animated ? {
                pathLength: [0, 1],
                strokeDasharray: ["0 100", "20 80"],
                strokeDashoffset: [0, -100],
              } : { pathLength: 1 }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          );
        })}
      </svg>
    );
  };

  // Cognitive Layers Visualization
  const CognitiveLayers = () => {
    const layers = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      radius: 30 + i * 25,
      opacity: intensityAlpha * (1 - i * 0.12),
      rotationSpeed: 1 + i * 0.3,
    }));

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <radialGradient id="layerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity={0} />
            <stop offset="80%" stopColor={theme.secondary} stopOpacity={intensityAlpha * 0.3} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={intensityAlpha} />
          </radialGradient>
        </defs>

        <g transform={`translate(${width / 2}, ${height / 2})`}>
          {layers.map((layer, i) => (
            <motion.circle
              key={`layer-${i}`}
              r={layer.radius}
              fill="none"
              stroke="url(#layerGradient)"
              strokeWidth={strokeWidth}
              opacity={layer.opacity}
              initial={{ rotate: 0 }}
              animate={animated ? {
                rotate: 360,
                strokeDasharray: ["0 100", "50 50", "0 100"],
              } : {}}
              transition={{
                duration: 10 / layer.rotationSpeed,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </g>
      </svg>
    );
  };

  const renderVisualization = () => {
    switch (type) {
      case 'neural-network':
        return <NeuralNetwork />;
      case 'thought-bubbles':
        return <ThoughtBubbles />;
      case 'consciousness-stream':
        return <ConsciousnessStream />;
      case 'synaptic-connections':
        return <SynapticConnections />;
      case 'brain-waves':
        return <BrainWaves />;
      case 'cognitive-layers':
        return <CognitiveLayers />;
      default:
        return <NeuralNetwork />;
    }
  };

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width, height }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      whileHover={interactive ? { scale: 1.05 } : {}}
    >
      {renderVisualization()}
      
      {/* Overlay gradient for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, transparent 0%, ${theme.getPrimaryWithOpacity(0.05)} 100%)`,
        }}
      />
    </motion.div>
  );
}

// Consciousness Background Component
interface ConsciousnessBackgroundProps {
  traits: MuseTraits;
  type?: ConsciousnessMetaphor;
  intensity?: 'subtle' | 'medium' | 'intense';
  className?: string;
}

export function ConsciousnessBackground({
  traits,
  type = 'neural-network',
  intensity = 'subtle',
  className = '',
}: ConsciousnessBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <ConsciousnessVisuals
        type={type}
        traits={traits}
        intensity={intensity}
        animated={true}
        size="xl"
        className="absolute inset-0 opacity-30"
      />
    </div>
  );
}