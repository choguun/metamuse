'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Avatar,
  AvatarListResponse,
  AvatarCategory,
  AvatarStyle,
  MuseTraits,
} from '@/types';
import { API_BASE_URL } from '@/constants';
import { MuseAvatar } from './MuseAvatar';
import { AvatarUploader } from './AvatarUploader';

interface AvatarSelectorProps {
  currentTraits: MuseTraits;
  onAvatarSelected: (avatar: Avatar | null) => void; // null = use generated avatar
  selectedAvatarId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AvatarSelector({
  currentTraits,
  onAvatarSelected,
  selectedAvatarId,
  isOpen,
  onClose,
}: AvatarSelectorProps) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<AvatarCategory | 'generated' | 'all'>('all');
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvatars();
    }
  }, [isOpen, selectedCategory, selectedStyle]);

  const loadAvatars = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${API_BASE_URL}/api/v1/avatars`;
      
      if (selectedCategory !== 'all' && selectedCategory !== 'generated') {
        url = `${API_BASE_URL}/api/v1/avatars/category/${selectedCategory}`;
      } else if (selectedStyle !== 'all') {
        url = `${API_BASE_URL}/api/v1/avatars/style/${selectedStyle}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load avatars');

      const data: AvatarListResponse = await response.json();
      setAvatars(data.avatars);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load avatars');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (avatar: Avatar | null) => {
    onAvatarSelected(avatar);
    onClose();
  };

  const handleAvatarUploaded = (avatar: Avatar) => {
    // Refresh the avatars list to include the new upload
    loadAvatars();
    // Auto-select the newly uploaded avatar
    onAvatarSelected(avatar);
    setIsUploaderOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-2xl border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Choose Avatar</h2>
            <p className="text-gray-400 mt-1">
              Select a custom avatar or use the personality-generated one
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsUploaderOpen(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-700 space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all' as const, label: 'All Avatars' },
              { key: 'generated' as const, label: 'Generated' },
              { key: AvatarCategory.CURATED_GALLERY, label: 'Curated' },
              { key: AvatarCategory.AI_GENERATED, label: 'AI Created' },
              { key: AvatarCategory.USER_UPLOAD, label: 'User Uploads' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Style Filter */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all' as const, label: 'All Styles' },
              { key: AvatarStyle.REALISTIC, label: 'Realistic' },
              { key: AvatarStyle.CARTOON, label: 'Cartoon' },
              { key: AvatarStyle.ANIME, label: 'Anime' },
              { key: AvatarStyle.ABSTRACT, label: 'Abstract' },
              { key: AvatarStyle.MINIMALIST, label: 'Minimalist' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedStyle(key)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedStyle === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-400">Loading avatars...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">{error}</div>
              <button
                onClick={loadAvatars}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {/* Generated Avatar Option */}
              {selectedCategory === 'all' || selectedCategory === 'generated' ? (
                <AvatarOption
                  isSelected={selectedAvatarId === undefined || selectedAvatarId === null}
                  onSelect={() => handleAvatarSelect(null)}
                  title="Personality Generated"
                  subtitle="Based on your traits"
                >
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                    <MuseAvatar
                      traits={currentTraits}
                      tokenId="preview"
                      size="lg"
                      interactive={false}
                      showGlow={false}
                    />
                  </div>
                </AvatarOption>
              ) : null}

              {/* Custom Avatars */}
              <AnimatePresence>
                {avatars.map((avatar) => (
                  <AvatarOption
                    key={avatar.id}
                    isSelected={selectedAvatarId === avatar.id}
                    onSelect={() => handleAvatarSelect(avatar)}
                    title={avatar.name || 'Unnamed Avatar'}
                    subtitle={`${avatar.style} style`}
                    rating={avatar.rating}
                  >
                    <img
                      src={avatar.cdn_url || `/api/avatar/${avatar.id}`}
                      alt={avatar.name || 'Avatar'}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </AvatarOption>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && !error && avatars.length === 0 && selectedCategory !== 'generated' && (
            <div className="text-center py-12 text-gray-400">
              <p>No avatars found in this category.</p>
              <button
                onClick={() => setSelectedCategory('all')}
                className="mt-2 text-purple-400 hover:text-purple-300"
              >
                View all avatars
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="text-sm text-gray-400">
            💡 Tip: Generated avatars are unique to your personality traits
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>

      {/* Avatar Uploader Modal */}
      <AvatarUploader
        onAvatarUploaded={handleAvatarUploaded}
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
      />
    </div>
  );
}

interface AvatarOptionProps {
  isSelected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  rating?: number;
  children: React.ReactNode;
}

function AvatarOption({
  isSelected,
  onSelect,
  title,
  subtitle,
  rating,
  children,
}: AvatarOptionProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-purple-500 bg-purple-500/10'
          : 'ring-1 ring-gray-700 hover:ring-gray-600'
      }`}
    >
      {/* Avatar Image */}
      <div className="aspect-square relative">
        {children}
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 bg-gray-800/50">
        <h3 className="text-white text-sm font-medium truncate">{title}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-gray-400 text-xs truncate">{subtitle}</p>
          {rating !== undefined && (
            <div className="flex items-center text-xs text-gray-400">
              <svg className="w-3 h-3 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}