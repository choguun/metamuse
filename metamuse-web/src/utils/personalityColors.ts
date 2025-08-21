import { MuseTraits } from '@/types';

export interface PersonalityTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  gradient: string[];
  animation: 'fluid' | 'geometric' | 'organic' | 'soft';
  name: string;
  dominant: keyof MuseTraits;
}

export function getPersonalityTheme(traits: MuseTraits | undefined | null): PersonalityTheme {
  // Default traits if none provided
  const defaultTraits = {
    creativity: 50,
    wisdom: 50,
    humor: 50,
    empathy: 50,
  };
  
  const safeTraits = traits || defaultTraits;
  const { creativity, wisdom, humor, empathy } = safeTraits;
  
  // Find dominant trait
  const traitValues = { creativity, wisdom, humor, empathy };
  const dominant = Object.entries(traitValues).reduce((prev, current) => 
    current[1] > prev[1] ? current : prev
  )[0] as keyof MuseTraits;
  
  // High creativity: Fluid, artistic colors
  if (creativity > 70) {
    return {
      primary: '#ff6b6b',
      secondary: '#4ecdc4', 
      accent: '#45b7d1',
      background: 'rgba(255, 107, 107, 0.1)',
      gradient: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57'],
      animation: 'fluid',
      name: 'Creative Visionary',
      dominant: 'creativity',
    };
  }
  
  // High wisdom: Deep, scholarly colors
  if (wisdom > 70) {
    return {
      primary: '#6c5ce7',
      secondary: '#a29bfe',
      accent: '#fd79a8',
      background: 'rgba(108, 92, 231, 0.1)',
      gradient: ['#6c5ce7', '#a29bfe', '#fd79a8', '#81ecec'],
      animation: 'geometric',
      name: 'Wise Sage',
      dominant: 'wisdom',
    };
  }
  
  // High humor: Bright, playful colors
  if (humor > 70) {
    return {
      primary: '#feca57',
      secondary: '#ff9ff3',
      accent: '#48dbfb',
      background: 'rgba(254, 202, 87, 0.1)',
      gradient: ['#feca57', '#ff9ff3', '#48dbfb', '#ff6348'],
      animation: 'organic',
      name: 'Joyful Entertainer',
      dominant: 'humor',
    };
  }
  
  // High empathy: Warm, nurturing colors
  if (empathy > 70) {
    return {
      primary: '#ff7675',
      secondary: '#fd79a8',
      accent: '#fdcb6e',
      background: 'rgba(255, 118, 117, 0.1)',
      gradient: ['#ff7675', '#fd79a8', '#fdcb6e', '#e17055'],
      animation: 'soft',
      name: 'Compassionate Heart',
      dominant: 'empathy',
    };
  }
  
  // Balanced personalities: Adaptive colors
  const balancedColor = getBalancedTheme(safeTraits);
  return {
    primary: balancedColor.primary,
    secondary: balancedColor.secondary,
    accent: balancedColor.accent,
    background: balancedColor.background,
    gradient: balancedColor.gradient,
    animation: 'fluid',
    name: 'Balanced Harmony',
    dominant: dominant,
  };
}

function getBalancedTheme(traits: MuseTraits) {
  const { creativity, wisdom, humor, empathy } = traits;
  
  // Create a balanced color scheme based on trait distribution
  const creativityInfluence = creativity / 100;
  const wisdomInfluence = wisdom / 100;
  const humorInfluence = humor / 100;
  const empathyInfluence = empathy / 100;
  
  // Blend colors based on trait weights
  const blendedColor = blendColors([
    { color: '#ff6b6b', weight: creativityInfluence },
    { color: '#6c5ce7', weight: wisdomInfluence },
    { color: '#feca57', weight: humorInfluence },
    { color: '#ff7675', weight: empathyInfluence },
  ]);
  
  return {
    primary: blendedColor,
    secondary: adjustBrightness(blendedColor, 0.3),
    accent: adjustHue(blendedColor, 60),
    background: `${blendedColor}1a`,
    gradient: [
      blendedColor,
      adjustBrightness(blendedColor, 0.2),
      adjustHue(blendedColor, 30),
      adjustHue(blendedColor, -30),
    ],
  };
}

function blendColors(colorWeights: { color: string; weight: number }[]): string {
  // Simple color blending algorithm
  let r = 0, g = 0, b = 0, totalWeight = 0;
  
  colorWeights.forEach(({ color, weight }) => {
    const rgb = hexToRgb(color);
    if (rgb) {
      r += rgb.r * weight;
      g += rgb.g * weight;
      b += rgb.b * weight;
      totalWeight += weight;
    }
  });
  
  if (totalWeight === 0) return '#a8e6cf';
  
  r = Math.round(r / totalWeight);
  g = Math.round(g / totalWeight);
  b = Math.round(b / totalWeight);
  
  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

function adjustBrightness(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const adjusted = {
    r: Math.min(255, Math.max(0, Math.round(rgb.r * (1 + factor)))),
    g: Math.min(255, Math.max(0, Math.round(rgb.g * (1 + factor)))),
    b: Math.min(255, Math.max(0, Math.round(rgb.b * (1 + factor)))),
  };
  
  return rgbToHex(adjusted.r, adjusted.g, adjusted.b);
}

function adjustHue(hex: string, degrees: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  // Convert RGB to HSL, adjust hue, convert back
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + degrees) % 360;
  if (hsl.h < 0) hsl.h += 360;
  
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Personality-based trait descriptions for enhanced theming
export const getPersonalityDescription = (theme: PersonalityTheme): string => {
  switch (theme.name) {
    case 'Creative Visionary':
      return 'Imagination flows like rivers of color, painting new realities with every thought.';
    case 'Wise Sage':
      return 'Ancient knowledge crystallizes into profound insights that illuminate the path forward.';
    case 'Joyful Entertainer':
      return 'Laughter dances on the air, turning everyday moments into celebrations of joy.';
    case 'Compassionate Heart':
      return 'Warmth radiates outward, creating safe spaces where souls can truly connect.';
    case 'Balanced Harmony':
      return 'All aspects of being flow together in perfect equilibrium, adaptable to any moment.';
    default:
      return 'A unique blend of traits creates an extraordinary personality.';
  }
};

// Get personality emoji for quick visual identification
export const getPersonalityEmoji = (theme: PersonalityTheme): string => {
  switch (theme.dominant) {
    case 'creativity': return '🎨';
    case 'wisdom': return '🔮';
    case 'humor': return '😄';
    case 'empathy': return '💝';
    default: return '⚖️';
  }
};

// Animation presets for different personality types
export const getAnimationPreset = (animation: PersonalityTheme['animation']) => {
  switch (animation) {
    case 'fluid':
      return {
        duration: 4,
        ease: "easeInOut" as const,
        repeat: Infinity,
        repeatType: "reverse" as const,
      };
    case 'geometric':
      return {
        duration: 8,
        ease: "linear" as const,
        repeat: Infinity,
      };
    case 'organic':
      return {
        duration: 3,
        ease: "easeInOut" as const,
        repeat: Infinity,
        repeatType: "reverse" as const,
      };
    case 'soft':
      return {
        duration: 5,
        ease: "easeInOut" as const,
        repeat: Infinity,
        repeatType: "reverse" as const,
      };
    default:
      return {
        duration: 4,
        ease: "easeInOut" as const,
        repeat: Infinity,
        repeatType: "reverse" as const,
      };
  }
};