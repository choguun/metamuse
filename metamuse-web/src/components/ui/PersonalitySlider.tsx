'use client';

import { type MuseTraits } from '@/types';

interface PersonalitySliderProps {
  trait: keyof MuseTraits;
  value: number;
  onChange: (value: number) => void;
  color: string;
}

export function PersonalitySlider({ trait, value, onChange, color }: PersonalitySliderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white capitalize">{trait}</h4>
        <span 
          className="text-sm font-bold px-2 py-1 rounded"
          style={{ backgroundColor: color + '20', color: color }}
        >
          {value}
        </span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, #374151 ${value}%, #374151 100%)`
          }}
        />
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-150 ease-in-out"
          style={{ 
            left: `calc(${value}% - 8px)`,
            backgroundColor: color
          }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-400">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>
  );
}