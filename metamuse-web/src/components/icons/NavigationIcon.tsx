'use client';

import { PersonalityIcon, IconSize } from './PersonalityIcon';
import { MuseTraits } from '@/types';

export type NavigationType = 
  | 'home' | 'create' | 'explore' | 'gallery' | 'chat' | 'profile' | 'settings'
  | 'back' | 'forward' | 'up' | 'down' | 'left' | 'right'
  | 'menu' | 'close' | 'expand' | 'collapse' | 'refresh'
  | 'external' | 'internal' | 'bookmark' | 'share';

interface NavigationIconProps {
  type: NavigationType;
  traits?: MuseTraits;
  size?: IconSize;
  active?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

// Default balanced traits for navigation icons
const defaultTraits: MuseTraits = {
  creativity: 60,
  wisdom: 60,
  humor: 60,
  empathy: 60,
};

export function NavigationIcon({
  type,
  traits = defaultTraits,
  size = 'md',
  active = false,
  disabled = false,
  showLabel = false,
  label,
  animated = false,
  className = '',
  onClick,
}: NavigationIconProps) {
  const getNavigationConfig = (type: NavigationType) => {
    const configs = {
      // Main Navigation
      home: { icon: 'balanced', label: 'Home', activeColor: 'text-purple-400' },
      create: { icon: 'create', label: 'Create', activeColor: 'text-green-400' },
      explore: { icon: 'explore', label: 'Explore', activeColor: 'text-blue-400' },
      gallery: { icon: 'gallery', label: 'Gallery', activeColor: 'text-yellow-400' },
      chat: { icon: 'chat', label: 'Chat', activeColor: 'text-pink-400' },
      profile: { icon: 'profile', label: 'Profile', activeColor: 'text-indigo-400' },
      settings: { icon: 'settings', label: 'Settings', activeColor: 'text-gray-400' },
      
      // Directional Navigation
      back: { icon: 'left', label: 'Back', activeColor: 'text-gray-400' },
      forward: { icon: 'right', label: 'Forward', activeColor: 'text-gray-400' },
      up: { icon: 'up', label: 'Up', activeColor: 'text-gray-400' },
      down: { icon: 'down', label: 'Down', activeColor: 'text-gray-400' },
      left: { icon: 'left', label: 'Left', activeColor: 'text-gray-400' },
      right: { icon: 'right', label: 'Right', activeColor: 'text-gray-400' },
      
      // Interface Controls
      menu: { icon: 'menu', label: 'Menu', activeColor: 'text-gray-400' },
      close: { icon: 'close', label: 'Close', activeColor: 'text-red-400' },
      expand: { icon: 'expand', label: 'Expand', activeColor: 'text-gray-400' },
      collapse: { icon: 'collapse', label: 'Collapse', activeColor: 'text-gray-400' },
      refresh: { icon: 'refresh', label: 'Refresh', activeColor: 'text-blue-400' },
      
      // Link Types
      external: { icon: 'external', label: 'External Link', activeColor: 'text-blue-400' },
      internal: { icon: 'internal', label: 'Internal Link', activeColor: 'text-purple-400' },
      bookmark: { icon: 'bookmark', label: 'Bookmark', activeColor: 'text-yellow-400' },
      share: { icon: 'share', label: 'Share', activeColor: 'text-green-400' },
    };
    
    return configs[type] || { icon: 'info', label: 'Navigation', activeColor: 'text-gray-400' };
  };

  const config = getNavigationConfig(type);
  const displayLabel = label || config.label;

  const getIconType = (navType: NavigationType) => {
    // Map navigation types to icon types
    const iconMap: Record<NavigationType, string> = {
      home: 'balanced',
      create: 'create',
      explore: 'search',
      gallery: 'gallery',
      chat: 'chat',
      profile: 'profile',
      settings: 'settings',
      back: 'back',
      forward: 'forward',
      up: 'up',
      down: 'down',
      left: 'left',
      right: 'right',
      menu: 'menu',
      close: 'close',
      expand: 'expand',
      collapse: 'collapse',
      refresh: 'loading',
      external: 'external',
      internal: 'internal',
      bookmark: 'star',
      share: 'share',
    };
    
    return iconMap[navType] || 'info';
  };

  return (
    <div
      className={`
        inline-flex items-center space-x-2 cursor-pointer transition-all duration-200
        ${active ? 'scale-110' : 'hover:scale-105'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
        ${className}
      `}
      onClick={disabled ? undefined : onClick}
    >
      <div className={`relative ${active ? config.activeColor : 'text-gray-400'}`}>
        <PersonalityIcon
          type={getIconType(type) as any}
          traits={traits}
          size={size}
          animated={animated || (active && !disabled)}
          interactive={!disabled}
        />
        
        {/* Active indicator */}
        {active && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full animate-pulse" />
        )}
        
        {/* Notification dot (can be added as prop) */}
        {type === 'chat' && active && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full border border-gray-900" />
        )}
      </div>
      
      {showLabel && (
        <span 
          className={`
            text-sm font-medium transition-colors duration-200
            ${active ? config.activeColor : 'text-gray-400'}
            ${disabled ? 'text-gray-600' : ''}
          `}
        >
          {displayLabel}
        </span>
      )}
    </div>
  );
}

// Navigation Bar Component
interface NavigationBarProps {
  items: {
    type: NavigationType;
    label?: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    notification?: boolean;
  }[];
  traits?: MuseTraits;
  size?: IconSize;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function NavigationBar({
  items,
  traits = defaultTraits,
  size = 'md',
  showLabels = false,
  orientation = 'horizontal',
  className = '',
}: NavigationBarProps) {
  const orientationClasses = {
    horizontal: 'flex space-x-6',
    vertical: 'flex flex-col space-y-4',
  };

  return (
    <nav className={`${orientationClasses[orientation]} ${className}`}>
      {items.map((item, index) => (
        <NavigationIcon
          key={`${item.type}-${index}`}
          type={item.type}
          traits={traits}
          size={size}
          active={item.active}
          disabled={item.disabled}
          showLabel={showLabels}
          label={item.label}
          onClick={item.onClick}
          className="relative"
        />
      ))}
    </nav>
  );
}

// Breadcrumb Navigation Component
interface BreadcrumbProps {
  items: {
    label: string;
    onClick?: () => void;
    active?: boolean;
  }[];
  traits?: MuseTraits;
  separator?: string;
  className?: string;
}

export function Breadcrumb({
  items,
  traits = defaultTraits,
  separator = '/',
  className = '',
}: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && (
            <span className="text-gray-500">{separator}</span>
          )}
          <button
            onClick={item.onClick}
            disabled={!item.onClick}
            className={`
              transition-colors duration-200
              ${item.active 
                ? 'text-white font-medium' 
                : 'text-gray-400 hover:text-white'
              }
              ${!item.onClick ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            {item.label}
          </button>
        </div>
      ))}
    </nav>
  );
}