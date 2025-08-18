// Core MetaMuse types for frontend application

export interface MuseTraits {
  creativity: number;
  wisdom: number;
  humor: number;
  empathy: number;
}

export interface MuseData {
  token_id: string;
  creativity: number;
  wisdom: number;
  humor: number;
  empathy: number;
  dna_hash: string;
  birth_block: number;
  total_interactions: number;
  owner: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  commitment_hash?: string;
  verification_status?: 'pending' | 'committed' | 'verified' | 'failed';
  tx_hash?: string;
}

export interface ChatResponse {
  response: string;
  commitment_hash: string;
  signature: string;
  timestamp: number;
  metadata: {
    inference_time_ms: number;
    model_version: string;
    memory_updated: boolean;
    traits_used: MuseTraits;
  };
}

export interface PendingMuse {
  traits: MuseTraits;
  status: 'creating' | 'confirming' | 'completed' | 'failed';
  dna_hash?: string;
  tx_hash?: string;
  error?: string;
}

export interface Memory {
  id: string;
  content: string;
  importance: number;
  timestamp: number;
  context?: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: 'Personality' | 'Creative' | 'Utility';
  creator: string;
  version: string;
  active: boolean;
  installed?: boolean;
}

export interface ContractAddresses {
  MetaMuse: `0x${string}`;
  CommitmentVerifier: `0x${string}`;
  MuseMemory: `0x${string}`;
  MusePlugins: `0x${string}`;
  MuseRating: `0x${string}`;
  InteractionDAT: `0x${string}`;
  TrainingDataDAT: `0x${string}`;
}

export interface AppConfig {
  apiUrl: string;
  chainId: number;
  contracts: ContractAddresses;
}

// Event types for real-time updates
export interface StateEvent {
  type: 'INTERACTION_VERIFIED' | 'MEMORY_UPDATED' | 'MUSE_STATE_CHANGED';
  data: any;
}

// ===== TEMPLATE SYSTEM TYPES =====

export enum TemplateCategory {
  COMPANION = 'companion',
  MENTOR = 'mentor',
  CREATIVE = 'creative',
  PROFESSIONAL = 'professional',
  CUSTOM = 'custom',
}

export enum CommunicationStyle {
  FORMAL = 'formal',
  CASUAL = 'casual',
  FRIENDLY = 'friendly',
  PROFESSIONAL = 'professional',
  ENTHUSIASTIC = 'enthusiastic',
  CALM = 'calm',
  PLAYFUL = 'playful',
  THOUGHTFUL = 'thoughtful',
}

export enum VariableType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  MULTI_SELECT = 'multiselect',
  BOOLEAN = 'boolean',
  RANGE = 'range',
}

export interface TemplateVariable {
  key: string;
  name: string;
  description: string;
  variable_type: VariableType;
  options?: string[];
  default_value: any;
  required: boolean;
}

export interface ScenarioBehaviors {
  casual: string;
  emotional_support: string;
  intellectual: string;
  creative: string;
  problem_solving: string;
  custom_scenarios?: { [key: string]: string };
}

export interface BasePersonality {
  system_prompt: string;
  communication_style: CommunicationStyle;
  response_patterns: any[];
  knowledge_domains: string[];
  personality_modifiers: { [key: string]: number };
}

export interface TraitRange {
  trait_name: string;
  min_value: number;
  max_value: number;
  optimal_value?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  base_personality: BasePersonality;
  scenarios: ScenarioBehaviors;
  variables: TemplateVariable[];
  compatible_traits: TraitRange[];
  tags: string[];
  is_custom: boolean;
  created_by: string;
  usage_count: number;
  ipfs_hash?: string;
  version: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  rating: number;
  rating_count: number;
  price_muse_tokens: number;
}

export interface TemplateCreateRequest {
  name: string;
  description: string;
  category: TemplateCategory;
  system_prompt: string;
  scenarios: { [key: string]: string };
  variables: TemplateVariable[];
  tags: string[];
  is_public: boolean;
}

export interface TemplateApplyRequest {
  template_id: string;
  variables: { [key: string]: any };
  traits: MuseTraits;
}

export interface TemplateListResponse {
  templates: PromptTemplate[];
  total_count: number;
}

export interface TemplateApplyResponse {
  system_prompt: string;
  template_used: string;
  variables_applied: { [key: string]: any };
}

// ===== AVATAR SYSTEM TYPES =====

export enum AvatarCategory {
  USER_UPLOAD = 'user_upload',
  AI_GENERATED = 'ai_generated',
  CURATED_GALLERY = 'curated_gallery',
  COMMUNITY_CONTRIBUTED = 'community_contributed',
  ARTIST = 'artist',
}

export enum AvatarStyle {
  REALISTIC = 'realistic',
  ANIME = 'anime',
  CARTOON = 'cartoon',
  ABSTRACT = 'abstract',
  PIXEL_ART = 'pixel_art',
  MINIMALIST = 'minimalist',
  FANTASY = 'fantasy',
  SCI_FI = 'scifi',
  VINTAGE = 'vintage',
  MODERN = 'modern',
}

export enum AvatarMood {
  HAPPY = 'happy',
  CALM = 'calm',
  MYSTERIOUS = 'mysterious',
  ENERGETIC = 'energetic',
  WISE = 'wise',
  PLAYFUL = 'playful',
  SERIOUS = 'serious',
  CREATIVE = 'creative',
  CONFIDENT = 'confident',
  GENTLE = 'gentle',
}

export enum ImageFormat {
  PNG = 'png',
  JPG = 'jpg',
  GIF = 'gif',
  SVG = 'svg',
  WEBP = 'webp',
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface Avatar {
  id: string;
  name?: string;
  ipfs_hash: string;
  cdn_url?: string;
  local_path?: string;
  format: ImageFormat;
  dimensions: ImageDimensions;
  file_size: number;
  created_by: string;
  is_public: boolean;
  tags: string[];
  category: AvatarCategory;
  usage_count: number;
  last_used: string;
  generated_description?: string;
  color_palette: string[];
  style: AvatarStyle;
  mood?: AvatarMood;
  price_muse_tokens: number;
  rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  version: string;
}

export interface AvatarGenerationRequest {
  style: AvatarStyle;
  mood: AvatarMood;
  color_scheme?: string[];
  personality_traits: MuseTraits;
  custom_prompt?: string;
  size: ImageDimensions;
}

export interface AvatarUploadRequest {
  name?: string;
  tags: string[];
  is_public: boolean;
  category: AvatarCategory;
  description?: string;
}

export interface AvatarUploadResponse {
  avatar_id: string;
  ipfs_hash: string;
  cdn_url?: string;
  processing_status: 'uploaded' | 'processing' | 'optimizing' | 'complete' | 'failed';
}

export interface AvatarListResponse {
  avatars: Avatar[];
  total_count: number;
}

export interface AvatarCollection {
  id: string;
  name: string;
  description: string;
  owner: string;
  avatar_ids: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}