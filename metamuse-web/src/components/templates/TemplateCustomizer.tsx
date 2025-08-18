'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PromptTemplate,
  TemplateVariable,
  VariableType,
  TemplateApplyRequest,
  TemplateApplyResponse,
  MuseTraits,
} from '@/types';
import { API_BASE_URL } from '@/constants';

interface TemplateCustomizerProps {
  template: PromptTemplate;
  currentTraits: MuseTraits;
  onApplied: (appliedTemplate: TemplateApplyResponse) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateCustomizer({
  template,
  currentTraits,
  onApplied,
  isOpen,
  onClose,
}: TemplateCustomizerProps) {
  const [variables, setVariables] = useState<{ [key: string]: any }>({});
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // Initialize variables with default values
  useEffect(() => {
    const initialVars: { [key: string]: any } = {};
    template.variables.forEach(variable => {
      initialVars[variable.key] = variable.default_value;
    });
    setVariables(initialVars);
  }, [template]);

  const updateVariable = (key: string, value: any) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  const handlePreview = async () => {
    setShowPreview(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/templates/${template.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          variables,
          traits: currentTraits,
        } as TemplateApplyRequest),
      });

      if (response.ok) {
        const result: TemplateApplyResponse = await response.json();
        setPreviewPrompt(result.system_prompt);
      }
    } catch (err) {
      console.error('Preview failed:', err);
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/templates/${template.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          variables,
          traits: currentTraits,
        } as TemplateApplyRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply template');
      }

      const result: TemplateApplyResponse = await response.json();
      onApplied(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply template');
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Customize Template</h2>
            <p className="text-gray-400 mt-1">{template.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Template Info */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-6">
            <h3 className="text-white font-medium mb-2">{template.name}</h3>
            <p className="text-gray-400 text-sm mb-3">{template.description}</p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-500">Category: <span className="text-gray-300">{template.category}</span></span>
              <span className="text-gray-500">Rating: <span className="text-gray-300">{template.rating.toFixed(1)}/5</span></span>
              <span className="text-gray-500">Uses: <span className="text-gray-300">{template.usage_count}</span></span>
            </div>
          </div>

          {template.variables.length > 0 ? (
            <div className="space-y-6">
              <h3 className="text-white font-medium">Customize Variables</h3>
              
              {template.variables.map((variable) => (
                <VariableEditor
                  key={variable.key}
                  variable={variable}
                  value={variables[variable.key]}
                  onChange={(value) => updateVariable(variable.key, value)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>This template has no customizable variables.</p>
              <p className="text-sm">It will be applied with your current personality traits.</p>
            </div>
          )}

          {/* Current Traits Display */}
          <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 className="text-white font-medium mb-3">Your Current Personality Traits</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(currentTraits).map(([trait, value]) => (
                <div key={trait} className="flex items-center justify-between">
                  <span className="text-gray-300 capitalize">{trait}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-300"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-white text-sm w-8">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {showPreview && previewPrompt && (
            <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-white font-medium mb-3">Generated System Prompt Preview</h4>
              <div className="bg-gray-900/50 rounded p-3 text-gray-300 text-sm max-h-40 overflow-y-auto">
                {previewPrompt}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 py-3 border-t border-gray-700 bg-red-900/20">
            <div className="text-red-400 text-sm flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={handlePreview}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 hover:text-white transition-colors"
          >
            Preview
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <span>Apply Template</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface VariableEditorProps {
  variable: TemplateVariable;
  value: any;
  onChange: (value: any) => void;
}

function VariableEditor({ variable, value, onChange }: VariableEditorProps) {
  const renderInput = () => {
    switch (variable.variable_type) {
      case VariableType.TEXT:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
          />
        );

      case VariableType.NUMBER:
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
          />
        );

      case VariableType.BOOLEAN:
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-700 rounded focus:ring-purple-500 bg-gray-800"
            />
            <span className="text-gray-300">{value ? 'Yes' : 'No'}</span>
          </label>
        );

      case VariableType.SELECT:
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
          >
            {variable.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case VariableType.MULTI_SELECT:
        const selectedOptions = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {variable.options?.map((option) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedOptions, option]);
                    } else {
                      onChange(selectedOptions.filter((o: string) => o !== option));
                    }
                  }}
                  className="w-4 h-4 text-purple-600 border-gray-700 rounded focus:ring-purple-500 bg-gray-800"
                />
                <span className="text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case VariableType.RANGE:
        return (
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={value || 50}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>0</span>
              <span className="text-white font-medium">{value || 50}</span>
              <span>100</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-gray-400 text-sm">
            Unsupported variable type: {variable.variable_type}
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="mb-3">
        <h4 className="text-white font-medium mb-1">
          {variable.name}
          {variable.required && <span className="text-red-400 ml-1">*</span>}
        </h4>
        {variable.description && (
          <p className="text-gray-400 text-sm">{variable.description}</p>
        )}
      </div>
      {renderInput()}
    </div>
  );
}

// Add custom CSS for the range slider
const sliderCSS = `
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  background: #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  background: #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
`;