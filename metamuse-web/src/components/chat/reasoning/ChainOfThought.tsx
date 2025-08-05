'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { usePersonalityTheme } from '@/hooks/usePersonalityTheme';
import { MuseTraits } from '@/types';

interface ReasoningStep {
  id: string;
  type: 'analysis' | 'memory_retrieval' | 'personality_filter' | 'response_generation' | 'verification';
  title: string;
  content: string;
  confidence: number;
  timestamp: number;
  duration?: number;
  subSteps?: ReasoningStep[];
  data?: any;
}

interface ChainOfThoughtProps {
  steps: ReasoningStep[];
  traits: MuseTraits;
  isVisible: boolean;
  onToggle: () => void;
  isGenerating?: boolean;
}

export function ChainOfThought({ 
  steps, 
  traits, 
  isVisible, 
  onToggle, 
  isGenerating = false 
}: ChainOfThoughtProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [currentGeneratingStep, setCurrentGeneratingStep] = useState<string | null>(null);
  const theme = usePersonalityTheme(traits);

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepIcon = (type: ReasoningStep['type'], isGenerating = false) => {
    const baseClasses = "w-5 h-5";
    
    if (isGenerating) {
      return (
        <motion.div
          className={baseClasses}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </motion.div>
      );
    }

    switch (type) {
      case 'analysis':
        return (
          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'memory_retrieval':
        return (
          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'personality_filter':
        return (
          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case 'response_generation':
        return (
          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'verification':
        return (
          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      default:
        return (
          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStepColor = (type: ReasoningStep['type']) => {
    switch (type) {
      case 'analysis': return theme.gradient[0] || '#3b82f6';
      case 'memory_retrieval': return theme.gradient[1] || '#8b5cf6';
      case 'personality_filter': return theme.gradient[2] || '#f59e0b';
      case 'response_generation': return theme.gradient[3] || '#10b981';
      case 'verification': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const getStepTitle = (type: ReasoningStep['type']) => {
    switch (type) {
      case 'analysis': return 'Input Analysis';
      case 'memory_retrieval': return 'Memory Retrieval';
      case 'personality_filter': return 'Personality Filter';
      case 'response_generation': return 'Response Generation';
      case 'verification': return 'TEE Verification';
      default: return 'Processing';
    }
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors mb-3 p-2 rounded-lg hover:bg-gray-800/50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          animate={{ rotate: isVisible ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
        
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ 
              background: isGenerating 
                ? `conic-gradient(from 0deg, ${theme.primary}, ${theme.secondary}, ${theme.accent}, ${theme.primary})`
                : theme.primary
            }}
            transition={{ duration: 2 }}
            className="w-3 h-3 rounded-full"
          />
          <span className="font-medium">Chain of Thought</span>
          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">
            {steps.length} {steps.length === 1 ? 'step' : 'steps'}
          </span>
        </div>
        
        {isGenerating && (
          <motion.div
            className="text-xs text-amber-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Thinking...
          </motion.div>
        )}
      </motion.button>

      {/* Reasoning Steps */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="space-y-3 border border-gray-700/50 rounded-xl p-4"
            style={{ 
              background: `linear-gradient(135deg, ${theme.getPrimaryWithOpacity(0.05)}, ${theme.getSecondaryWithOpacity(0.03)})`,
              backdropFilter: 'blur(10px)',
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Reasoning Tree */}
            <div className="relative">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div 
                      className="absolute left-6 top-12 w-0.5 h-8 bg-gradient-to-b from-current to-transparent opacity-30"
                      style={{ color: getStepColor(step.type) }}
                    />
                  )}
                  
                  {/* Step Container */}
                  <motion.div
                    className="relative mb-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <motion.div
                      className="flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200"
                      style={{
                        backgroundColor: expandedSteps.has(step.id) 
                          ? `${getStepColor(step.type)}15` 
                          : 'transparent',
                        borderLeft: `3px solid ${getStepColor(step.type)}`,
                      }}
                      onClick={() => toggleStep(step.id)}
                      whileHover={{ 
                        backgroundColor: `${getStepColor(step.type)}10`,
                        scale: 1.01,
                      }}
                    >
                      {/* Step Icon */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                        style={{ 
                          backgroundColor: `${getStepColor(step.type)}30`,
                          color: getStepColor(step.type),
                          border: `2px solid ${getStepColor(step.type)}50`,
                        }}
                      >
                        {getStepIcon(step.type, currentGeneratingStep === step.id)}
                      </div>
                      
                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-medium">
                            {step.title || getStepTitle(step.type)}
                          </h4>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {/* Duration */}
                            {step.duration && (
                              <span className="text-xs text-gray-400">
                                {step.duration}ms
                              </span>
                            )}
                            
                            {/* Confidence Bar */}
                            <div className="flex items-center space-x-1">
                              <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: getStepColor(step.type) }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${step.confidence}%` }}
                                  transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                                />
                              </div>
                              <span 
                                className="text-xs font-medium w-8 text-center"
                                style={{ color: getStepColor(step.type) }}
                              >
                                {step.confidence}%
                              </span>
                            </div>
                            
                            {/* Expand Arrow */}
                            <motion.div
                              animate={{ rotate: expandedSteps.has(step.id) ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </motion.div>
                          </div>
                        </div>
                        
                        {/* Step Summary */}
                        <p className="text-gray-300 text-sm line-clamp-2">
                          {step.content}
                        </p>
                      </div>
                    </motion.div>
                    
                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedSteps.has(step.id) && (
                        <motion.div
                          className="ml-15 mt-3 p-4 rounded-lg border border-gray-700/30"
                          style={{ backgroundColor: `${getStepColor(step.type)}08` }}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Full Content */}
                          <div className="text-gray-200 text-sm mb-4 leading-relaxed">
                            {step.content}
                          </div>
                          
                          {/* Additional Data */}
                          {step.data && (
                            <div className="mb-4">
                              <h5 className="text-gray-400 text-xs font-medium mb-2">Processing Data:</h5>
                              <div className="bg-gray-800/50 rounded-lg p-3 font-mono text-xs text-gray-300 overflow-x-auto">
                                <pre>{JSON.stringify(step.data, null, 2)}</pre>
                              </div>
                            </div>
                          )}
                          
                          {/* Sub-steps */}
                          {step.subSteps && step.subSteps.length > 0 && (
                            <div>
                              <h5 className="text-gray-400 text-xs font-medium mb-3">Sub-processes:</h5>
                              <div className="space-y-2">
                                {step.subSteps.map((subStep, subIndex) => (
                                  <motion.div
                                    key={subStep.id}
                                    className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/30"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: subIndex * 0.05 }}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStepColor(subStep.type) }}></div>
                                    <span className="text-gray-300 text-xs flex-1">{subStep.title}</span>
                                    <span className="text-gray-500 text-xs">{subStep.confidence}%</span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Timestamp */}
                          <div className="mt-4 pt-3 border-t border-gray-700/30 text-xs text-gray-400">
                            Processed at: {new Date(step.timestamp).toLocaleTimeString()}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <motion.div
              className="mt-6 pt-4 border-t border-gray-700/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: steps.length * 0.1 + 0.5 }}
            >
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <div className="text-gray-400">Total Steps</div>
                  <div className="text-white font-semibold">{steps.length}</div>
                </div>
                <div>
                  <div className="text-gray-400">Avg Confidence</div>
                  <div 
                    className="font-semibold"
                    style={{ color: theme.primary }}
                  >
                    {Math.round(steps.reduce((acc, step) => acc + step.confidence, 0) / steps.length)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Total Time</div>
                  <div className="text-white font-semibold">
                    {steps.reduce((acc, step) => acc + (step.duration || 0), 0)}ms
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}