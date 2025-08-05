'use client';

import { PersonalityIcon, IconSize } from './PersonalityIcon';
import { MuseTraits } from '@/types';

export type StatusType = 
  | 'loading' | 'success' | 'error' | 'warning' | 'info'
  | 'verified' | 'pending' | 'failed' | 'committed'
  | 'online' | 'offline' | 'typing' | 'thinking'
  | 'tee-verified' | 'chain-thought' | 'rated';

interface StatusIconProps {
  status: StatusType;
  traits?: MuseTraits;
  size?: IconSize;
  showLabel?: boolean;
  animated?: boolean;
  pulse?: boolean;
  className?: string;
}

// Default balanced traits for status icons
const defaultTraits: MuseTraits = {
  creativity: 60,
  wisdom: 60,
  humor: 60,
  empathy: 60,
};

export function StatusIcon({
  status,
  traits = defaultTraits,
  size = 'sm',
  showLabel = false,
  animated = false,
  pulse = false,
  className = '',
}: StatusIconProps) {
  const getStatusConfig = (status: StatusType) => {
    const configs = {
      // Basic Status
      loading: { icon: 'loading', label: 'Loading', color: 'text-blue-400', animated: true },
      success: { icon: 'success', label: 'Success', color: 'text-green-400', pulse: true },
      error: { icon: 'error', label: 'Error', color: 'text-red-400', pulse: true },
      warning: { icon: 'warning', label: 'Warning', color: 'text-yellow-400', pulse: true },
      info: { icon: 'info', label: 'Info', color: 'text-blue-400' },
      
      // Verification Status
      verified: { icon: 'verification', label: 'Verified', color: 'text-green-400', pulse: true },
      pending: { icon: 'loading', label: 'Pending', color: 'text-yellow-400', animated: true },
      failed: { icon: 'error', label: 'Failed', color: 'text-red-400' },
      committed: { icon: 'tee-verified', label: 'Committed', color: 'text-purple-400', pulse: true },
      
      // Activity Status
      online: { icon: 'success', label: 'Online', color: 'text-green-400', pulse: true },
      offline: { icon: 'error', label: 'Offline', color: 'text-gray-400' },
      typing: { icon: 'chat', label: 'Typing...', color: 'text-blue-400', animated: true },
      thinking: { icon: 'reasoning', label: 'Thinking...', color: 'text-purple-400', animated: true },
      
      // Feature Status
      'tee-verified': { icon: 'tee-verified', label: 'TEE Verified', color: 'text-purple-400', pulse: true },
      'chain-thought': { icon: 'chain-thought', label: 'Chain of Thought', color: 'text-blue-400', animated: true },
      rated: { icon: 'rating', label: 'Rated', color: 'text-yellow-400', pulse: true },
    };
    
    return configs[status] || configs.info;
  };

  const config = getStatusConfig(status);
  const isAnimated = animated || config.animated;
  const shouldPulse = pulse || config.pulse;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`relative ${shouldPulse ? 'animate-pulse' : ''}`}>
        <PersonalityIcon
          type={config.icon as any}
          traits={traits}
          size={size}
          animated={isAnimated}
          className={config.color}
        />
        
        {/* Status indicator dot for certain statuses */}
        {(status === 'online' || status === 'verified' || status === 'tee-verified') && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-gray-900" />
        )}
        
        {status === 'pending' && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full border border-gray-900 animate-pulse" />
        )}
        
        {(status === 'error' || status === 'failed') && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full border border-gray-900" />
        )}
      </div>
      
      {showLabel && (
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Status Badge - Comprehensive status display with background
interface StatusBadgeProps {
  status: StatusType;
  traits?: MuseTraits;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
  className?: string;
}

export function StatusBadge({
  status,
  traits = defaultTraits,
  size = 'sm',
  variant = 'solid',
  className = '',
}: StatusBadgeProps) {
  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  
  const variantClasses = {
    solid: 'text-white',
    outline: 'border-2 bg-transparent',
    ghost: 'bg-transparent',
  };
  
  const getBackgroundColor = (status: StatusType) => {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500',
      loading: 'bg-blue-500',
      verified: 'bg-green-500',
      pending: 'bg-yellow-500',
      failed: 'bg-red-500',
      committed: 'bg-purple-500',
      online: 'bg-green-500',
      offline: 'bg-gray-500',
      typing: 'bg-blue-500',
      thinking: 'bg-purple-500',
      'tee-verified': 'bg-purple-500',
      'chain-thought': 'bg-blue-500',
      rated: 'bg-yellow-500',
    };
    
    return colors[status] || colors.info;
  };

  return (
    <div 
      className={`
        inline-flex items-center space-x-2 rounded-full font-medium
        ${sizeClasses[size]}
        ${variant === 'solid' ? `${getBackgroundColor(status)} ${variantClasses[variant]}` : ''}
        ${variant === 'outline' ? `border-current ${config.color} ${variantClasses[variant]}` : ''}
        ${variant === 'ghost' ? `${config.color} ${variantClasses[variant]}` : ''}
        ${className}
      `}
    >
      <StatusIcon
        status={status}
        traits={traits}
        size="xs"
        animated={true}
      />
      <span>{config.label}</span>
    </div>
  );
}

// Helper function to get status configuration
function getStatusConfig(status: StatusType) {
  const configs = {
    // Basic Status
    loading: { icon: 'loading', label: 'Loading', color: 'text-blue-400', animated: true },
    success: { icon: 'success', label: 'Success', color: 'text-green-400', pulse: true },
    error: { icon: 'error', label: 'Error', color: 'text-red-400', pulse: true },
    warning: { icon: 'warning', label: 'Warning', color: 'text-yellow-400', pulse: true },
    info: { icon: 'info', label: 'Info', color: 'text-blue-400' },
    
    // Verification Status
    verified: { icon: 'verification', label: 'Verified', color: 'text-green-400', pulse: true },
    pending: { icon: 'loading', label: 'Pending', color: 'text-yellow-400', animated: true },
    failed: { icon: 'error', label: 'Failed', color: 'text-red-400' },
    committed: { icon: 'tee-verified', label: 'Committed', color: 'text-purple-400', pulse: true },
    
    // Activity Status
    online: { icon: 'success', label: 'Online', color: 'text-green-400', pulse: true },
    offline: { icon: 'error', label: 'Offline', color: 'text-gray-400' },
    typing: { icon: 'chat', label: 'Typing...', color: 'text-blue-400', animated: true },
    thinking: { icon: 'reasoning', label: 'Thinking...', color: 'text-purple-400', animated: true },
    
    // Feature Status
    'tee-verified': { icon: 'tee-verified', label: 'TEE Verified', color: 'text-purple-400', pulse: true },
    'chain-thought': { icon: 'chain-thought', label: 'Chain of Thought', color: 'text-blue-400', animated: true },
    rated: { icon: 'rating', label: 'Rated', color: 'text-yellow-400', pulse: true },
  } as const;
  
  return configs[status] || configs.info;
}