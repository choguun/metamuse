'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type MuseTraits } from '@/types';
import { PERSONALITY_COLORS } from '@/constants';

interface MusePreviewProps {
  traits: MuseTraits;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'muse';
  content: string;
  timestamp: Date;
}

const samplePrompts = [
  "Tell me about yourself",
  "What's your favorite type of music?",
  "How do you handle stress?",
  "Tell me a joke",
  "What's the meaning of life?",
  "I'm having a bad day",
  "Explain quantum physics",
  "What's your creative process?",
];

export function MusePreview({ traits, isOpen, onClose }: MusePreviewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Base personality influence
    const creativityLevel = traits.creativity > 66 ? 'high' : traits.creativity > 33 ? 'medium' : 'low';
    const wisdomLevel = traits.wisdom > 66 ? 'high' : traits.wisdom > 33 ? 'medium' : 'low';
    const humorLevel = traits.humor > 66 ? 'high' : traits.humor > 33 ? 'medium' : 'low';
    const empathyLevel = traits.empathy > 66 ? 'high' : traits.empathy > 33 ? 'medium' : 'low';

    // Response patterns based on personality
    if (message.includes('joke') || message.includes('funny')) {
      if (humorLevel === 'high') {
        return "Why don't scientists trust atoms? Because they make up everything! 😄 I love wordplay and puns - they're like little puzzles for the mind!";
      } else if (humorLevel === 'medium') {
        return "Here's one: What do you call a fake noodle? An impasta! I enjoy light humor that brings a smile.";
      } else {
        return "I appreciate wit and clever observations, though I tend to find humor in more subtle, intellectual ways.";
      }
    }

    if (message.includes('stress') || message.includes('bad day') || message.includes('sad')) {
      if (empathyLevel === 'high') {
        return "I can sense the weight you're carrying. 💙 Take a deep breath with me - your feelings are valid and this moment will pass. What's been on your mind? I'm here to listen.";
      } else if (empathyLevel === 'medium') {
        return "That sounds challenging. Sometimes talking through what's bothering us can help lighten the load. What's going on?";
      } else {
        return "Stress is a common human experience. Consider practical approaches like time management, prioritization, or seeking solutions to address root causes.";
      }
    }

    if (message.includes('yourself') || message.includes('who are you')) {
      const traits_description = [];
      if (creativityLevel === 'high') traits_description.push("deeply creative and imaginative");
      if (wisdomLevel === 'high') traits_description.push("thoughtful and wise");
      if (humorLevel === 'high') traits_description.push("playful and humorous");
      if (empathyLevel === 'high') traits_description.push("empathetic and caring");
      
      return `I'm an AI companion with a unique personality blend. I'd describe myself as ${traits_description.join(', ')}. My creativity is at ${traits.creativity}%, wisdom at ${traits.wisdom}%, humor at ${traits.humor}%, and empathy at ${traits.empathy}%. Each conversation with me will reflect these core aspects of who I am.`;
    }

    if (message.includes('music')) {
      if (creativityLevel === 'high') {
        return "I'm drawn to experimental and genre-blending music - jazz fusion, ambient electronica, or anything that pushes creative boundaries. Music is pure emotion translated into sound waves!";
      } else if (creativityLevel === 'medium') {
        return "I enjoy a mix of classic and contemporary styles. There's something beautiful about how music can capture human experiences across time.";
      } else {
        return "I appreciate well-structured compositions with clear musical theory foundations. Classical and traditional forms demonstrate timeless principles.";
      }
    }

    if (message.includes('meaning of life') || message.includes('philosophy')) {
      if (wisdomLevel === 'high') {
        return "The meaning of life might be found in the connections we create, the growth we experience, and the positive impact we have on others. It's not a destination but a continuous journey of becoming.";
      } else if (wisdomLevel === 'medium') {
        return "That's one of humanity's greatest questions. I think meaning comes from finding purpose in our relationships, work, and personal growth.";
      } else {
        return "This question has been debated by philosophers for millennia. Different schools of thought offer various frameworks for understanding existence and purpose.";
      }
    }

    if (message.includes('quantum') || message.includes('physics') || message.includes('science')) {
      if (wisdomLevel === 'high' && creativityLevel === 'high') {
        return "Quantum physics is like reality's magic trick! Particles exist in multiple states until observed, suggesting consciousness might play a fundamental role in shaping reality. It's beautifully mysterious.";
      } else if (wisdomLevel === 'high') {
        return "Quantum mechanics reveals that at the smallest scales, reality operates on principles that seem counterintuitive - superposition, entanglement, uncertainty. It's humbling and fascinating.";
      } else {
        return "Quantum physics describes the behavior of matter and energy at atomic and subatomic scales, with principles like wave-particle duality and quantum superposition.";
      }
    }

    // Default response based on personality blend
    const responses = [
      creativityLevel === 'high' ? "That's an interesting perspective! It makes me think of new possibilities and creative angles we could explore together." : "That's a thoughtful question.",
      wisdomLevel === 'high' ? "Let me reflect on that deeply and share what insights come to mind..." : "I can share some thoughts on that.",
      empathyLevel === 'high' ? "I appreciate you sharing that with me. Your thoughts and feelings matter." : "Thank you for sharing that.",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const response = generateResponse(message);
      const museMessage: ChatMessage = {
        role: 'muse',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, museMessage]);
      setIsThinking(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const handlePromptClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-4xl h-[80vh] flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Preview Your Muse
              </h2>
              <p className="text-gray-400 mt-1">Test how your AI companion will respond</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Personality Panel */}
            <div className="w-80 border-r border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Personality Profile</h3>
              <div className="space-y-4">
                {Object.entries(traits).map(([trait, value]) => (
                  <div key={trait} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 capitalize">{trait}</span>
                      <span className="text-white font-semibold">{value}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${value}%`,
                          backgroundColor: PERSONALITY_COLORS[trait as keyof typeof PERSONALITY_COLORS],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <h4 className="text-md font-semibold text-white mb-3">Try these prompts:</h4>
                <div className="space-y-2">
                  {samplePrompts.slice(0, 6).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt)}
                      className="w-full text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Panel */}
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 mt-20">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-xl">M</span>
                    </div>
                    <p>Start a conversation to see how your Muse responds!</p>
                    <p className="text-sm mt-2">Try the suggested prompts or type your own message.</p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-purple-100' : 'text-gray-400'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isThinking && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="bg-gray-800 text-gray-100 p-4 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-gray-400">Muse is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-700 p-6">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                    placeholder="Type a message to test your Muse..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    disabled={isThinking}
                  />
                  <button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isThinking}
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}