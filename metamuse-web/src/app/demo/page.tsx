'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MuseAvatar } from '@/components/avatars/MuseAvatar';
import { ThemedContainer } from '@/components/ui/themed/ThemedContainer';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { PersonalitySlider } from '@/components/ui/PersonalitySlider';
import { PERSONALITY_COLORS } from '@/constants';
import { type MuseTraits } from '@/types';

// Separate component to avoid hook violations in map
function MuseDescription({ traits }: { traits: MuseTraits }) {
  const theme = usePersonalityTheme(traits);
  return (
    <p className="text-gray-300 text-sm">
      {theme.description}
    </p>
  );
}

// Personality archetypes for design system demonstration
const demoArchetypes = [
  { id: '1', name: 'Creative Type', traits: { creativity: 95, wisdom: 60, humor: 75, empathy: 50 } },
  { id: '2', name: 'Wise Type', traits: { creativity: 40, wisdom: 95, humor: 45, empathy: 80 } },
  { id: '3', name: 'Humorous Type', traits: { creativity: 70, wisdom: 30, humor: 95, empathy: 65 } },
  { id: '4', name: 'Empathetic Type', traits: { creativity: 55, wisdom: 70, humor: 40, empathy: 95 } },
  { id: '5', name: 'Balanced Type', traits: { creativity: 65, wisdom: 65, humor: 65, empathy: 65 } },
];

export default function DemoPage() {
  const [selectedMuse, setSelectedMuse] = useState(demoArchetypes[0]);
  const [customTraits, setCustomTraits] = useState<MuseTraits>({
    creativity: 50,
    wisdom: 50,
    humor: 50,
    empathy: 50,
  });
  
  // Initialize themes at top level to avoid hook violations
  const selectedMuseTheme = usePersonalityTheme(selectedMuse.traits);
  const customTraitsTheme = usePersonalityTheme(customTraits);

  const handleTraitChange = (trait: keyof MuseTraits, value: number) => {
    setCustomTraits(prev => ({ ...prev, [trait]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            🎨 Design System Demo
          </motion.h1>
          <motion.p
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Experience how personality traits transform every aspect of the user interface. 
            Each muse gets a unique visual identity that reflects their inner nature.
          </motion.p>
        </div>

        {/* Demo Muses Gallery */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">✨ Personality Archetypes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {demoArchetypes.map((muse, index) => (
              <motion.div
                key={muse.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => setSelectedMuse(muse)}
                className="cursor-pointer"
              >
                <ThemedContainer
                  traits={muse.traits}
                  variant="glass"
                  intensity={selectedMuse.id === muse.id ? "strong" : "normal"}
                  animated={true}
                  interactive={true}
                  className="text-center h-full"
                >
                  <MuseAvatar
                    traits={muse.traits}
                    tokenId={muse.id}
                    size="lg"
                    interactive={true}
                    showPersonality={true}
                    showGlow={true}
                    className="mx-auto mb-4"
                  />
                  <h3 className="text-white font-semibold mb-2">{muse.name}</h3>
                  <MuseDescription traits={muse.traits} />
                </ThemedContainer>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Selected Muse Showcase */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Avatar & Personality Details */}
            <ThemedContainer
              traits={selectedMuse.traits}
              variant="elevated"
              intensity="strong"
              animated={true}
              className="text-center"
            >
              <MuseAvatar
                traits={selectedMuse.traits}
                tokenId={selectedMuse.id}
                size="xl"
                interactive={true}
                showPersonality={true}
                showGlow={true}
                className="mx-auto mb-6"
              />
              <h2 className="text-2xl font-bold text-white mb-4">{selectedMuse.name}</h2>
              <p className="text-gray-300 mb-6">
                {selectedMuseTheme.description}
              </p>
              
              {/* Personality Breakdown */}
              <div className="space-y-4">
                {Object.entries(selectedMuse.traits).map(([trait, value]) => {
                  const traitColor = selectedMuseTheme.gradient[Object.keys(selectedMuse.traits).indexOf(trait)] || selectedMuseTheme.primary;
                  
                  return (
                    <div key={trait} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize font-medium">{trait}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 h-3 bg-gray-700/50 rounded-full overflow-hidden relative">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: traitColor,
                              background: `linear-gradient(90deg, ${traitColor}80, ${traitColor})`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <span 
                          className="text-white font-bold w-8 text-center"
                          style={{ color: traitColor }}
                        >
                          {value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ThemedContainer>

            {/* Theming Variations */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white mb-4">🎭 Theme Variations</h3>
              
              {/* Different container variants */}
              {['glass', 'solid', 'outline', 'elevated', 'minimal'].map((variant, index) => (
                <motion.div
                  key={variant}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ThemedContainer
                    traits={selectedMuse.traits}
                    variant={variant as any}
                    intensity="normal"
                    animated={true}
                    className="p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <MuseAvatar
                        traits={selectedMuse.traits}
                        tokenId={selectedMuse.id}
                        size="sm"
                        interactive={false}
                      />
                      <div>
                        <h4 className="text-white font-semibold capitalize">{variant} Style</h4>
                        <p className="text-gray-300 text-sm">
                          {variant === 'glass' && 'Translucent with backdrop blur'}
                          {variant === 'solid' && 'Bold gradient background'}
                          {variant === 'outline' && 'Minimal border emphasis'}
                          {variant === 'elevated' && 'Raised with shadow depth'}
                          {variant === 'minimal' && 'Subtle background tint'}
                        </p>
                      </div>
                    </div>
                  </ThemedContainer>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Custom Personality Builder */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">🛠️ Build Your Own Personality</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Personality Controls */}
            <div className="space-y-6">
              {Object.entries(customTraits).map(([trait, value]) => (
                <div key={trait} className="space-y-2">
                  <PersonalitySlider
                    trait={trait as keyof MuseTraits}
                    value={value}
                    onChange={(newValue) => handleTraitChange(trait as keyof MuseTraits, newValue)}
                    color={PERSONALITY_COLORS[trait as keyof typeof PERSONALITY_COLORS]}
                  />
                </div>
              ))}
            </div>

            {/* Live Preview */}
            <ThemedContainer
              traits={customTraits}
              variant="glass"
              intensity="strong"
              animated={true}
              className="text-center"
            >
              <MuseAvatar
                traits={customTraits}
                tokenId="custom"
                size="xl"
                interactive={true}
                showPersonality={true}
                showGlow={true}
                className="mx-auto mb-6"
              />
              <h3 className="text-xl font-bold text-white mb-2">
                {customTraitsTheme.name}
              </h3>
              <p className="text-gray-300 mb-4">
                {customTraitsTheme.description}
              </p>
              <div className="text-xs text-gray-400 bg-gray-800/30 rounded-lg p-3">
                <div className="mb-2">🎨 Theme: {customTraitsTheme.animation}</div>
                <div className="mb-2">🌈 Primary: {customTraitsTheme.primary}</div>
                <div>✨ Dominant: {customTraitsTheme.dominant}</div>
              </div>
            </ThemedContainer>
          </div>
        </section>

        {/* Technical Details */}
        <section>
          <ThemedContainer
            traits={selectedMuse.traits}
            variant="minimal"
            intensity="subtle"
            animated={false}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-6">⚙️ Technical Implementation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="text-white font-semibold mb-2">🎯 Dynamic Avatars</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• SVG-based personality shapes</li>
                  <li>• Real-time color adaptation</li>
                  <li>• Animated based on traits</li>
                  <li>• Interactive hover effects</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">🎨 Theme System</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Personality-driven colors</li>
                  <li>• Multiple container variants</li>
                  <li>• Animated backgrounds</li>
                  <li>• Responsive interactions</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">✨ Animations</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Framer Motion powered</li>
                  <li>• Trait-specific timing</li>
                  <li>• Smooth transitions</li>
                  <li>• Performance optimized</li>
                </ul>
              </div>
            </div>
          </ThemedContainer>
        </section>
      </div>
    </div>
  );
}