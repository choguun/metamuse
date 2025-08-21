'use client';

import { PersonalityIcon, IconSize } from './PersonalityIcon';
import { MuseTraits } from '@/types';

export type FeatureType = 
  | 'tee-verification' | 'chain-of-thought' | 'semantic-memory' | 'ai-alignment-market'
  | 'personality-engine' | 'dynamic-avatar' | 'themed-ui' | 'ipfs-storage'
  | 'blockchain-integration' | 'cryptographic-verification' | 'multi-agent-ai'
  | 'personality-traits' | 'memory-persistence' | 'conversation-history'
  | 'rating-system' | 'reward-mechanism' | 'community-features'
  | 'privacy-controls' | 'decentralized-storage' | 'trusted-execution';

interface FeatureIconProps {
  feature: FeatureType;
  traits?: MuseTraits;
  size?: IconSize;
  status?: 'available' | 'active' | 'disabled' | 'coming-soon' | 'premium';
  showStatus?: boolean;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

// Default balanced traits for feature icons
const defaultTraits: MuseTraits = {
  creativity: 60,
  wisdom: 60,
  humor: 60,
  empathy: 60,
};

export function FeatureIcon({
  feature,
  traits = defaultTraits,
  size = 'md',
  status = 'available',
  showStatus = false,
  showLabel = false,
  label,
  animated = false,
  interactive = false,
  className = '',
  onClick,
}: FeatureIconProps) {
  const getFeatureConfig = (feature: FeatureType) => {
    const configs = {
      // Core AI Features
      'tee-verification': {
        icon: 'tee-verified',
        label: 'TEE Verification',
        description: 'Trusted Execution Environment security',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
      },
      'chain-of-thought': {
        icon: 'chain-thought',
        label: 'Chain of Thought',
        description: 'Explainable AI reasoning process',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
      },
      'semantic-memory': {
        icon: 'semantic-memory',
        label: 'Semantic Memory',
        description: 'Advanced memory retrieval system',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
      },
      'ai-alignment-market': {
        icon: 'ai-market',
        label: 'AI Alignment Market',
        description: 'Decentralized AI improvement marketplace',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
      },
      
      // Personality Features
      'personality-engine': {
        icon: 'balanced',
        label: 'Personality Engine',
        description: 'Multi-trait personality system',
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/20',
      },
      'dynamic-avatar': {
        icon: 'creative',
        label: 'Dynamic Avatar',
        description: 'Personality-driven visual generation',
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/20',
      },
      'themed-ui': {
        icon: 'sparkle',
        label: 'Themed UI',
        description: 'Adaptive interface design',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/20',
      },
      'personality-traits': {
        icon: 'star',
        label: 'Personality Traits',
        description: 'Four-dimensional trait system',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
      },
      
      // Infrastructure Features
      'ipfs-storage': {
        icon: 'memory',
        label: 'IPFS Storage',
        description: 'Decentralized data persistence',
        color: 'text-teal-400',
        bgColor: 'bg-teal-500/20',
      },
      'blockchain-integration': {
        icon: 'verification',
        label: 'Blockchain Integration',
        description: 'On-chain verification system',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
      },
      'cryptographic-verification': {
        icon: 'tee-verified',
        label: 'Cryptographic Verification',
        description: 'Secure interaction signing',
        color: 'text-violet-400',
        bgColor: 'bg-violet-500/20',
      },
      'multi-agent-ai': {
        icon: 'reasoning',
        label: 'Multi-Agent AI',
        description: 'Coordinated AI system',
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/20',
      },
      
      // User Features
      'memory-persistence': {
        icon: 'semantic-memory',
        label: 'Memory Persistence',
        description: 'Permanent conversation storage',
        color: 'text-lime-400',
        bgColor: 'bg-lime-500/20',
      },
      'conversation-history': {
        icon: 'chat',
        label: 'Conversation History',
        description: 'Full chat history access',
        color: 'text-sky-400',
        bgColor: 'bg-sky-500/20',
      },
      'rating-system': {
        icon: 'rating',
        label: 'Rating System',
        description: 'Community-driven quality assessment',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
      },
      'reward-mechanism': {
        icon: 'star',
        label: 'Reward Mechanism',
        description: 'Token-based incentive system',
        color: 'text-gold-400',
        bgColor: 'bg-yellow-500/20',
      },
      
      // Advanced Features
      'community-features': {
        icon: 'explore',
        label: 'Community Features',
        description: 'Social interaction capabilities',
        color: 'text-fuchsia-400',
        bgColor: 'bg-fuchsia-500/20',
      },
      'privacy-controls': {
        icon: 'tee-verified',
        label: 'Privacy Controls',
        description: 'User data protection',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/20',
      },
      'decentralized-storage': {
        icon: 'memory',
        label: 'Decentralized Storage',
        description: 'Web3-native data storage',
        color: 'text-stone-400',
        bgColor: 'bg-stone-500/20',
      },
      'trusted-execution': {
        icon: 'tee-verified',
        label: 'Trusted Execution',
        description: 'Hardware-secured computation',
        color: 'text-zinc-400',
        bgColor: 'bg-zinc-500/20',
      },
    };
    
    return configs[feature] || {
      icon: 'info',
      label: 'Feature',
      description: 'Advanced feature',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
    };
  };

  const getStatusConfig = (status: string) => {
    const statusConfigs = {
      available: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Available' },
      active: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Active' },
      disabled: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Disabled' },
      'coming-soon': { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Coming Soon' },
      premium: { color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Premium' },
    };
    
    return statusConfigs[status as keyof typeof statusConfigs] || statusConfigs.available;
  };

  const config = getFeatureConfig(feature);
  const statusConfig = getStatusConfig(status);
  const displayLabel = label || config.label;
  const isDisabled = status === 'disabled';
  const isActive = status === 'active';

  return (
    <div
      className={`
        relative inline-flex items-center space-x-3 p-3 rounded-xl transition-all duration-200
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${interactive && !isDisabled ? 'cursor-pointer hover:scale-105' : ''}
        ${isActive ? statusConfig.bg : config.bgColor}
        ${className}
      `}
      onClick={isDisabled ? undefined : onClick}
    >
      <div className={`relative ${isActive ? statusConfig.color : config.color}`}>
        <PersonalityIcon
          type={config.icon as any}
          traits={traits}
          size={size}
          animated={animated || (isActive && !isDisabled)}
          interactive={interactive && !isDisabled}
        />
        
        {/* Status indicator */}
        {showStatus && (
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${statusConfig.color.replace('text-', 'bg-')}`} />
        )}
        
        {/* Premium badge */}
        {status === 'premium' && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">★</span>
          </div>
        )}
        
        {/* Coming soon badge */}
        {status === 'coming-soon' && (
          <div className="absolute -top-1 -right-6 bg-yellow-400 text-black text-xs px-1 py-0.5 rounded font-medium">
            Soon
          </div>
        )}
      </div>
      
      {showLabel && (
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${isActive ? statusConfig.color : config.color}`}>
            {displayLabel}
          </span>
          <span className="text-xs text-gray-400">
            {config.description}
          </span>
        </div>
      )}
    </div>
  );
}

// Feature Grid Component
interface FeatureGridProps {
  features: {
    type: FeatureType;
    status?: 'available' | 'active' | 'disabled' | 'coming-soon' | 'premium';
    label?: string;
    onClick?: () => void;
  }[];
  traits?: MuseTraits;
  size?: IconSize;
  showLabels?: boolean;
  showStatus?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FeatureGrid({
  features,
  traits = defaultTraits,
  size = 'lg',
  showLabels = true,
  showStatus = true,
  columns = 3,
  className = '',
}: FeatureGridProps) {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 ${className}`}>
      {features.map((feature, index) => (
        <FeatureIcon
          key={`${feature.type}-${index}`}
          feature={feature.type}
          traits={traits}
          size={size}
          status={feature.status}
          showStatus={showStatus}
          showLabel={showLabels}
          label={feature.label}
          animated={true}
          interactive={true}
          onClick={feature.onClick}
          className="w-full"
        />
      ))}
    </div>
  );
}

// Feature Showcase Component
interface FeatureShowcaseProps {
  feature: FeatureType;
  traits?: MuseTraits;
  title?: string;
  description?: string;
  status?: 'available' | 'active' | 'disabled' | 'coming-soon' | 'premium';
  children?: React.ReactNode;
  className?: string;
}

export function FeatureShowcase({
  feature,
  traits = defaultTraits,
  title,
  description,
  status = 'available',
  children,
  className = '',
}: FeatureShowcaseProps) {
  const config = getFeatureConfig(feature);
  const displayTitle = title || config.label;
  const displayDescription = description || config.description;

  return (
    <div className={`bg-gray-800/50 rounded-xl p-6 ${className}`}>
      <div className="flex items-start space-x-4 mb-4">
        <FeatureIcon
          feature={feature}
          traits={traits}
          size="xl"
          status={status}
          showStatus={true}
          animated={true}
        />
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {displayTitle}
          </h3>
          <p className="text-gray-400 text-sm">
            {displayDescription}
          </p>
        </div>
      </div>
      
      {children && (
        <div className="border-t border-gray-700 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Helper function (moved outside component to avoid recreation)
function getFeatureConfig(feature: FeatureType) {
  const configs = {
    // Core AI Features
    'tee-verification': {
      icon: 'tee-verified',
      label: 'TEE Verification',
      description: 'Trusted Execution Environment security',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    'chain-of-thought': {
      icon: 'chain-thought',
      label: 'Chain of Thought',
      description: 'Explainable AI reasoning process',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    'semantic-memory': {
      icon: 'semantic-memory',
      label: 'Semantic Memory',
      description: 'Advanced memory retrieval system',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    'ai-alignment-market': {
      icon: 'ai-market',
      label: 'AI Alignment Market',
      description: 'Decentralized AI improvement marketplace',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
    
    // Personality Features
    'personality-engine': {
      icon: 'balanced',
      label: 'Personality Engine',
      description: 'Multi-trait personality system',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
    },
    'dynamic-avatar': {
      icon: 'creative',
      label: 'Dynamic Avatar',
      description: 'Personality-driven visual generation',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/20',
    },
    'themed-ui': {
      icon: 'sparkle',
      label: 'Themed UI',
      description: 'Adaptive interface design',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
    },
    'personality-traits': {
      icon: 'star',
      label: 'Personality Traits',
      description: 'Four-dimensional trait system',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
    },
    
    // Infrastructure Features
    'ipfs-storage': {
      icon: 'memory',
      label: 'IPFS Storage',
      description: 'Decentralized data persistence',
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/20',
    },
    'blockchain-integration': {
      icon: 'verification',
      label: 'Blockchain Integration',
      description: 'On-chain verification system',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
    },
    'cryptographic-verification': {
      icon: 'tee-verified',
      label: 'Cryptographic Verification',
      description: 'Secure interaction signing',
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/20',
    },
    'multi-agent-ai': {
      icon: 'reasoning',
      label: 'Multi-Agent AI',
      description: 'Coordinated AI system',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/20',
    },
    
    // User Features
    'memory-persistence': {
      icon: 'semantic-memory',
      label: 'Memory Persistence',
      description: 'Permanent conversation storage',
      color: 'text-lime-400',
      bgColor: 'bg-lime-500/20',
    },
    'conversation-history': {
      icon: 'chat',
      label: 'Conversation History',
      description: 'Full chat history access',
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/20',
    },
    'rating-system': {
      icon: 'rating',
      label: 'Rating System',
      description: 'Community-driven quality assessment',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
    'reward-mechanism': {
      icon: 'star',
      label: 'Reward Mechanism',
      description: 'Token-based incentive system',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
    
    // Advanced Features
    'community-features': {
      icon: 'explore',
      label: 'Community Features',
      description: 'Social interaction capabilities',
      color: 'text-fuchsia-400',
      bgColor: 'bg-fuchsia-500/20',
    },
    'privacy-controls': {
      icon: 'tee-verified',
      label: 'Privacy Controls',
      description: 'User data protection',
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/20',
    },
    'decentralized-storage': {
      icon: 'memory',
      label: 'Decentralized Storage',
      description: 'Web3-native data storage',
      color: 'text-stone-400',
      bgColor: 'bg-stone-500/20',
    },
    'trusted-execution': {
      icon: 'tee-verified',
      label: 'Trusted Execution',
      description: 'Hardware-secured computation',
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-500/20',
    },
  } as const;
  
  return configs[feature] || {
    icon: 'info',
    label: 'Feature',
    description: 'Advanced feature',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
  };
}