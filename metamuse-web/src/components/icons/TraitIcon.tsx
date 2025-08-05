'use client';

import { PersonalityIcon, IconSize } from './PersonalityIcon';
import { MuseTraits } from '@/types';

export type TraitType = 'creativity' | 'wisdom' | 'humor' | 'empathy' | 'balanced';

interface TraitIconProps {
  trait: TraitType;
  traits: MuseTraits;
  size?: IconSize;
  showValue?: boolean;
  animated?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function TraitIcon({
  trait,
  traits,
  size = 'md',
  showValue = false,
  animated = false,
  interactive = false,
  className = '',
  onClick,
}: TraitIconProps) {
  const getTraitValue = (trait: TraitType): number => {
    switch (trait) {
      case 'creativity':
        return traits.creativity;
      case 'wisdom':
        return traits.wisdom;
      case 'humor':
        return traits.humor;
      case 'empathy':
        return traits.empathy;
      case 'balanced':
        return Math.round((traits.creativity + traits.wisdom + traits.humor + traits.empathy) / 4);
      default:
        return 0;
    }
  };

  const getTraitLabel = (trait: TraitType): string => {
    const labels = {
      creativity: 'Creative',
      wisdom: 'Wise',
      humor: 'Humorous',
      empathy: 'Empathetic',
      balanced: 'Balanced',
    };
    return labels[trait];
  };

  const traitValue = getTraitValue(trait);
  const isHighTrait = traitValue > 70;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <PersonalityIcon
        type={trait}
        traits={traits}
        size={size}
        animated={animated || isHighTrait}
        interactive={interactive}
        onClick={onClick}
      />
      
      {showValue && (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">
            {getTraitLabel(trait)}
          </span>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${traitValue}%`,
                    background: `linear-gradient(90deg, 
                      ${traitValue < 30 ? '#ef4444' : ''}
                      ${traitValue >= 30 && traitValue < 60 ? '#f59e0b' : ''}
                      ${traitValue >= 60 && traitValue < 80 ? '#3b82f6' : ''}
                      ${traitValue >= 80 ? '#10b981' : ''}
                    )`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-400 min-w-[2rem]">
                {traitValue}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Trait Group Component for displaying all traits
interface TraitGroupProps {
  traits: MuseTraits;
  size?: IconSize;
  showValues?: boolean;
  animated?: boolean;
  layout?: 'horizontal' | 'vertical' | 'grid';
  className?: string;
}

export function TraitGroup({
  traits,
  size = 'md',
  showValues = false,
  animated = false,
  layout = 'horizontal',
  className = '',
}: TraitGroupProps) {
  const traitTypes: TraitType[] = ['creativity', 'wisdom', 'humor', 'empathy'];

  const layoutClasses = {
    horizontal: 'flex space-x-4',
    vertical: 'flex flex-col space-y-2',
    grid: 'grid grid-cols-2 gap-2',
  };

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {traitTypes.map((trait) => (
        <TraitIcon
          key={trait}
          trait={trait}
          traits={traits}
          size={size}
          showValue={showValues}
          animated={animated}
        />
      ))}
    </div>
  );
}

// Dominant Trait Icon - shows only the highest trait
interface DominantTraitIconProps {
  traits: MuseTraits;
  size?: IconSize;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function DominantTraitIcon({
  traits,
  size = 'md',
  showLabel = false,
  animated = true,
  className = '',
}: DominantTraitIconProps) {
  const getDominantTrait = (): TraitType => {
    const values = {
      creativity: traits.creativity,
      wisdom: traits.wisdom,
      humor: traits.humor,
      empathy: traits.empathy,
    };
    
    const maxValue = Math.max(...Object.values(values));
    const dominantTraits = Object.entries(values).filter(([_, value]) => value === maxValue);
    
    // If there's a tie, prioritize in order: creativity, wisdom, humor, empathy
    const priority: TraitType[] = ['creativity', 'wisdom', 'humor', 'empathy'];
    for (const trait of priority) {
      if (dominantTraits.some(([t]) => t === trait)) {
        return trait as TraitType;
      }
    }
    
    return 'balanced';
  };

  const dominantTrait = getDominantTrait();

  return (
    <TraitIcon
      trait={dominantTrait}
      traits={traits}
      size={size}
      showValue={showLabel}
      animated={animated}
      className={className}
    />
  );
}