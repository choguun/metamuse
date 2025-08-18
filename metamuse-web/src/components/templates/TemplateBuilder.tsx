'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PromptTemplate,
  TemplateCategory,
  TemplateVariable,
  VariableType,
  ScenarioBehaviors,
  CommunicationStyle,
  TemplateCreateRequest
} from '@/types';
import { API_BASE_URL } from '@/constants';

interface TemplateBuilderProps {
  onTemplateCreated?: (template: PromptTemplate) => void;
  initialTemplate?: Partial<PromptTemplate>;
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateBuilder({ 
  onTemplateCreated, 
  initialTemplate, 
  isOpen, 
  onClose 
}: TemplateBuilderProps) {
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState<Partial<TemplateCreateRequest>>({
    name: initialTemplate?.name || '',
    description: initialTemplate?.description || '',
    category: initialTemplate?.category || TemplateCategory.CUSTOM,
    system_prompt: initialTemplate?.base_personality?.system_prompt || '',
    scenarios: {
      casual: '',
      emotional_support: '',
      intellectual: '',
      creative: '',
      problem_solving: '',
    },
    variables: initialTemplate?.variables || [],
    tags: initialTemplate?.tags || [],
    is_public: initialTemplate?.is_public || false,
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Form validation
  const validateCurrentStep = useCallback(() => {
    const errors: string[] = [];
    
    switch (step) {
      case 1: // Basic info
        if (!template.name?.trim()) errors.push('Template name is required');
        if (!template.description?.trim()) errors.push('Template description is required');
        if (template.name && template.name.length > 100) errors.push('Template name must be less than 100 characters');
        break;
      
      case 2: // System prompt
        if (!template.system_prompt?.trim()) errors.push('System prompt is required');
        if (template.system_prompt && template.system_prompt.length < 50) {
          errors.push('System prompt should be at least 50 characters for effective AI guidance');
        }
        break;
      
      case 3: // Scenarios
        const scenarios = template.scenarios;
        if (!scenarios?.casual?.trim()) errors.push('Casual scenario behavior is required');
        if (!scenarios?.emotional_support?.trim()) errors.push('Emotional support scenario is required');
        break;
      
      case 4: // Variables (optional, no validation)
        break;
        
      case 5: // Tags and settings
        if (!template.tags?.length) errors.push('At least one tag is required');
        break;
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [step, template]);

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setValidationErrors([]);
  };

  const updateTemplate = (updates: Partial<TemplateCreateRequest>) => {
    setTemplate(prev => ({ ...prev, ...updates }));
    setValidationErrors([]); // Clear validation errors when user makes changes
  };

  const addVariable = () => {
    const newVariable: TemplateVariable = {
      key: '',
      name: '',
      description: '',
      variable_type: VariableType.TEXT,
      default_value: '',
      required: false,
    };
    updateTemplate({
      variables: [...(template.variables || []), newVariable],
    });
  };

  const updateVariable = (index: number, updates: Partial<TemplateVariable>) => {
    const updatedVariables = [...(template.variables || [])];
    updatedVariables[index] = { ...updatedVariables[index], ...updates };
    updateTemplate({ variables: updatedVariables });
  };

  const removeVariable = (index: number) => {
    const updatedVariables = [...(template.variables || [])];
    updatedVariables.splice(index, 1);
    updateTemplate({ variables: updatedVariables });
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !template.tags?.includes(tag.trim())) {
      updateTemplate({
        tags: [...(template.tags || []), tag.trim()],
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateTemplate({
      tags: template.tags?.filter(tag => tag !== tagToRemove) || [],
    });
  };

  const handleCreate = async () => {
    if (!validateCurrentStep()) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create template');
      }
      
      const result = await response.json();
      onTemplateCreated?.(result.template);
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setIsCreating(false);
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
            <h2 className="text-2xl font-bold text-white">
              {initialTemplate ? 'Edit Template' : 'Create Custom Template'}
            </h2>
            <p className="text-gray-400 mt-1">
              Step {step} of 5: {getStepTitle(step)}
            </p>
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

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step > stepNumber ? 'bg-purple-500' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {step === 1 && <BasicInfoStep template={template} updateTemplate={updateTemplate} />}
            {step === 2 && <SystemPromptStep template={template} updateTemplate={updateTemplate} />}
            {step === 3 && <ScenariosStep template={template} updateTemplate={updateTemplate} />}
            {step === 4 && (
              <VariablesStep
                template={template}
                updateTemplate={updateTemplate}
                addVariable={addVariable}
                updateVariable={updateVariable}
                removeVariable={removeVariable}
              />
            )}
            {step === 5 && (
              <TagsStep
                template={template}
                updateTemplate={updateTemplate}
                addTag={addTag}
                removeTag={removeTag}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-700 bg-red-900/20">
            <div className="text-red-400 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
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
          <div className="flex items-center space-x-3">
            {step > 1 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 hover:text-white transition-colors"
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {step < 5 ? (
              <button
                onClick={handleNext}
                disabled={validationErrors.length > 0}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isCreating || validationErrors.length > 0}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Template</span>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function getStepTitle(step: number): string {
  switch (step) {
    case 1: return 'Basic Information';
    case 2: return 'System Prompt';
    case 3: return 'Scenario Behaviors';
    case 4: return 'Custom Variables';
    case 5: return 'Tags & Settings';
    default: return '';
  }
}

// Step Components
function BasicInfoStep({ 
  template, 
  updateTemplate 
}: { 
  template: Partial<TemplateCreateRequest>; 
  updateTemplate: (updates: Partial<TemplateCreateRequest>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <label className="block text-white font-medium mb-2">Template Name</label>
        <input
          type="text"
          value={template.name || ''}
          onChange={(e) => updateTemplate({ name: e.target.value })}
          placeholder="Enter template name (e.g., Creative Companion)"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
          maxLength={100}
        />
        <p className="text-gray-400 text-sm mt-1">{template.name?.length || 0}/100 characters</p>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Description</label>
        <textarea
          value={template.description || ''}
          onChange={(e) => updateTemplate({ description: e.target.value })}
          placeholder="Describe what this template does and when to use it..."
          rows={4}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none"
          maxLength={500}
        />
        <p className="text-gray-400 text-sm mt-1">{template.description?.length || 0}/500 characters</p>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Category</label>
        <select
          value={template.category}
          onChange={(e) => updateTemplate({ category: e.target.value as TemplateCategory })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
        >
          <option value={TemplateCategory.COMPANION}>Companion - Friendly, supportive interactions</option>
          <option value={TemplateCategory.MENTOR}>Mentor - Teaching and guidance focused</option>
          <option value={TemplateCategory.CREATIVE}>Creative - Artistic and imaginative assistance</option>
          <option value={TemplateCategory.PROFESSIONAL}>Professional - Business and work-related</option>
          <option value={TemplateCategory.CUSTOM}>Custom - Specialized use case</option>
        </select>
      </div>
    </motion.div>
  );
}

function SystemPromptStep({ 
  template, 
  updateTemplate 
}: { 
  template: Partial<TemplateCreateRequest>; 
  updateTemplate: (updates: Partial<TemplateCreateRequest>) => void;
}) {
  const examplePrompts = {
    [TemplateCategory.COMPANION]: "You are a warm, empathetic companion who provides emotional support and engaging conversation. Your primary goal is to be helpful, understanding, and encouraging. You listen actively and respond with genuine care and interest.",
    [TemplateCategory.MENTOR]: "You are an experienced mentor who guides others in learning and personal growth. You provide thoughtful advice, ask insightful questions, and help break down complex topics into manageable steps.",
    [TemplateCategory.CREATIVE]: "You are a creative collaborator who helps spark imagination and artistic expression. You encourage experimentation, provide inspiration, and help refine creative ideas with enthusiasm and expertise.",
    [TemplateCategory.PROFESSIONAL]: "You are a professional advisor who provides strategic guidance and practical solutions. You maintain a balance of expertise and approachability while helping achieve business and career objectives.",
    [TemplateCategory.CUSTOM]: "Define your unique role and approach here. Consider what makes this template special and how it should behave differently from standard interactions.",
  };

  const handleExampleUse = () => {
    if (template.category) {
      updateTemplate({ system_prompt: examplePrompts[template.category] });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-white font-medium">System Prompt</label>
          <button
            onClick={handleExampleUse}
            className="text-purple-400 hover:text-purple-300 text-sm"
          >
            Use Example for {template.category}
          </button>
        </div>
        <textarea
          value={template.system_prompt || ''}
          onChange={(e) => updateTemplate({ system_prompt: e.target.value })}
          placeholder="Define the core personality and behavior of your muse template..."
          rows={8}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none"
          maxLength={2000}
        />
        <p className="text-gray-400 text-sm mt-1">{template.system_prompt?.length || 0}/2000 characters</p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-medium mb-2">💡 Tips for writing effective system prompts:</h3>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• Be specific about the personality and tone you want</li>
          <li>• Explain how the muse should respond to different types of questions</li>
          <li>• Include any special knowledge areas or expertise</li>
          <li>• Define boundaries and what the muse should avoid</li>
          <li>• Use clear, direct language that an AI can easily understand</li>
        </ul>
      </div>
    </motion.div>
  );
}

function ScenariosStep({ 
  template, 
  updateTemplate 
}: { 
  template: Partial<TemplateCreateRequest>; 
  updateTemplate: (updates: Partial<TemplateCreateRequest>) => void;
}) {
  const updateScenario = (scenario: string, value: string) => {
    updateTemplate({
      scenarios: {
        ...template.scenarios,
        [scenario]: value,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-white">
        <h3 className="font-medium mb-2">Scenario-Specific Behaviors</h3>
        <p className="text-gray-400 text-sm">Define how your muse should behave in different conversation contexts.</p>
      </div>

      {[
        { key: 'casual', label: 'Casual Conversations', placeholder: 'How should the muse behave in everyday, relaxed conversations?' },
        { key: 'emotional_support', label: 'Emotional Support', placeholder: 'How should the muse provide comfort and support when users are stressed or upset?' },
        { key: 'intellectual', label: 'Intellectual Discussions', placeholder: 'How should the muse engage with complex topics and deep thinking?' },
        { key: 'creative', label: 'Creative Tasks', placeholder: 'How should the muse help with creative projects and artistic endeavors?' },
        { key: 'problem_solving', label: 'Problem Solving', placeholder: 'How should the muse approach challenges and help find solutions?' },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-white font-medium mb-2">{label}</label>
          <textarea
            value={template.scenarios?.[key as keyof ScenarioBehaviors] || ''}
            onChange={(e) => updateScenario(key, e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none"
            maxLength={300}
          />
        </div>
      ))}
    </motion.div>
  );
}

function VariablesStep({ 
  template, 
  updateTemplate, 
  addVariable, 
  updateVariable, 
  removeVariable 
}: { 
  template: Partial<TemplateCreateRequest>;
  updateTemplate: (updates: Partial<TemplateCreateRequest>) => void;
  addVariable: () => void;
  updateVariable: (index: number, updates: Partial<TemplateVariable>) => void;
  removeVariable: (index: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-medium">Custom Variables</h3>
            <p className="text-gray-400 text-sm">Add customizable parameters that users can adjust when using this template.</p>
          </div>
          <button
            onClick={addVariable}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
          >
            Add Variable
          </button>
        </div>

        {template.variables?.map((variable, index) => (
          <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium">Variable {index + 1}</h4>
              <button
                onClick={() => removeVariable(index)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Key</label>
                <input
                  type="text"
                  value={variable.key}
                  onChange={(e) => updateVariable(index, { key: e.target.value })}
                  placeholder="variable_key"
                  className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Type</label>
                <select
                  value={variable.variable_type}
                  onChange={(e) => updateVariable(index, { variable_type: e.target.value as VariableType })}
                  className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm"
                >
                  <option value={VariableType.TEXT}>Text</option>
                  <option value={VariableType.NUMBER}>Number</option>
                  <option value={VariableType.SELECT}>Select</option>
                  <option value={VariableType.BOOLEAN}>Boolean</option>
                  <option value={VariableType.RANGE}>Range</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Name</label>
              <input
                type="text"
                value={variable.name}
                onChange={(e) => updateVariable(index, { name: e.target.value })}
                placeholder="Display name"
                className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Description</label>
              <input
                type="text"
                value={variable.description}
                onChange={(e) => updateVariable(index, { description: e.target.value })}
                placeholder="What does this variable control?"
                className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm"
              />
            </div>
          </div>
        ))}

        {!template.variables?.length && (
          <div className="text-center py-8 text-gray-400">
            <p>No variables defined yet. Variables are optional but can make your template more flexible.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TagsStep({ 
  template, 
  updateTemplate, 
  addTag, 
  removeTag 
}: { 
  template: Partial<TemplateCreateRequest>;
  updateTemplate: (updates: Partial<TemplateCreateRequest>) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
}) {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <label className="block text-white font-medium mb-2">Tags</label>
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a tag..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={handleAddTag}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Add
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {template.tags?.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-2 hover:text-purple-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={template.is_public || false}
            onChange={(e) => updateTemplate({ is_public: e.target.checked })}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <span className="text-white">Make this template public</span>
        </label>
        <p className="text-gray-400 text-sm mt-1">
          Public templates can be discovered and used by other users in the community.
        </p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-medium mb-2">Template Summary</h3>
        <div className="space-y-2 text-sm">
          <div><span className="text-gray-400">Name:</span> <span className="text-white">{template.name}</span></div>
          <div><span className="text-gray-400">Category:</span> <span className="text-white">{template.category}</span></div>
          <div><span className="text-gray-400">Variables:</span> <span className="text-white">{template.variables?.length || 0}</span></div>
          <div><span className="text-gray-400">Tags:</span> <span className="text-white">{template.tags?.length || 0}</span></div>
          <div><span className="text-gray-400">Visibility:</span> <span className="text-white">{template.is_public ? 'Public' : 'Private'}</span></div>
        </div>
      </div>
    </motion.div>
  );
}