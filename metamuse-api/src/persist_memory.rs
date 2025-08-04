use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;
use tokio::sync::RwLock;
use crate::config::Config;
use alith::data::storage::{DataStorage, PinataIPFS, UploadOptions};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MuseMemory {
    pub memory_id: String,
    pub muse_id: String,
    pub interaction_data: InteractionData,
    pub embedding: Option<Vec<f32>>,
    pub importance: f32,
    pub timestamp: u64,
    pub ipfs_hash: Option<String>,
    
    // Enhanced metadata
    pub tags: Vec<String>,
    pub category: MemoryCategory,
    pub emotional_tone: Option<EmotionalTone>,
    pub context_window: Option<Vec<String>>, // Previous memories that influenced this
    pub version: u32,
    pub access_count: u32,
    pub last_accessed: u64,
    pub retention_priority: RetentionPriority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MemoryCategory {
    Conversation,
    Learning,
    Personal,
    Creative,
    ProblemSolving,
    Emotional,
    Factual,
    Other(String),
}

impl fmt::Display for MemoryCategory {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MemoryCategory::Conversation => write!(f, "conversation"),
            MemoryCategory::Learning => write!(f, "learning"),
            MemoryCategory::Personal => write!(f, "personal"),
            MemoryCategory::Creative => write!(f, "creative"),
            MemoryCategory::ProblemSolving => write!(f, "problem_solving"),
            MemoryCategory::Emotional => write!(f, "emotional"),
            MemoryCategory::Factual => write!(f, "factual"),
            MemoryCategory::Other(s) => write!(f, "{}", s),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmotionalTone {
    pub sentiment: f32, // -1.0 to 1.0
    pub emotions: Vec<(String, f32)>, // emotion name, intensity
    pub energy_level: f32, // 0.0 to 1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RetentionPriority {
    Critical,   // Never delete
    High,       // Keep for months
    Medium,     // Keep for weeks
    Low,        // Keep for days
    Temporary,  // Delete after session
}

// Memory index for faster retrieval
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryIndex {
    pub muse_id: String,
    pub total_memories: usize,
    pub memories_by_category: HashMap<String, Vec<String>>, // category -> memory_ids
    pub memories_by_tag: HashMap<String, Vec<String>>,      // tag -> memory_ids
    pub recent_memories: Vec<String>,                       // last 50 memory IDs
    pub important_memories: Vec<String>,                    // high importance memory IDs
    pub last_updated: u64,
    pub ipfs_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionData {
    pub user_prompt: String,
    pub ai_response: String,
    pub personality_traits: crate::muse_orchestrator::MuseTraits,
    pub context_used: Vec<String>,
    
    // Enhanced interaction metadata
    pub session_id: Option<String>,
    pub conversation_turn: u32,
    pub response_time_ms: u64,
    pub model_used: String,
    pub prompt_tokens: Option<u32>,
    pub response_tokens: Option<u32>,
    pub user_satisfaction: Option<f32>, // 0.0 to 1.0 if available
}

pub struct MemorySystem {
    // In-memory storage for quick access
    memories: RwLock<HashMap<String, Vec<MuseMemory>>>,
    // Memory indexes for each muse
    indexes: RwLock<HashMap<String, MemoryIndex>>,
    config: Config,
    ipfs_client: Option<PinataIPFS>,
    // Cache for frequently accessed memories
    memory_cache: RwLock<HashMap<String, MuseMemory>>,
}

impl MemorySystem {
    pub async fn new(config: &Config) -> Result<Self> {
        let ipfs_client = if config.ipfs_jwt_token.is_some() || config.ipfs_api_key.is_some() {
            Some(PinataIPFS::default())
        } else {
            None
        };
        
        Ok(Self {
            memories: RwLock::new(HashMap::new()),
            indexes: RwLock::new(HashMap::new()),
            config: config.clone(),
            ipfs_client,
            memory_cache: RwLock::new(HashMap::new()),
        })
    }
    
    pub async fn store_interaction_memory(
        &self,
        muse_id: &str,
        interaction: &InteractionData,
    ) -> Result<String> {
        let memory_id = format!("mem_{}_{}", muse_id, std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_nanos());
            
        let mut memory = MuseMemory {
            memory_id: memory_id.clone(),
            muse_id: muse_id.to_string(),
            interaction_data: interaction.clone(),
            embedding: self.generate_embedding(&interaction.user_prompt).await?,
            importance: self.calculate_enhanced_importance(interaction),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_secs(),
            ipfs_hash: None,
            
            // Enhanced metadata
            tags: self.extract_tags(interaction),
            category: self.categorize_interaction(interaction),
            emotional_tone: self.analyze_emotional_tone(interaction),
            context_window: Some(self.get_recent_context(muse_id, 3).await?),
            version: 1,
            access_count: 0,
            last_accessed: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_secs(),
            retention_priority: self.determine_retention_priority(interaction),
        };
        
        // Upload to IPFS if configured
        let ipfs_token = self.config.ipfs_jwt_token.as_ref().or(self.config.ipfs_api_key.as_ref());
        if let (Some(ipfs_client), Some(token)) = (&self.ipfs_client, ipfs_token) {
            let memory_json = serde_json::to_vec(&memory)?;
            let file_name = format!("muse_{}_memory_{}_{}.json", 
                muse_id, 
                memory.timestamp, 
                memory.category.to_string().to_lowercase()
            );
            
            let file_meta = ipfs_client.upload(
                UploadOptions::builder()
                    .data(memory_json)
                    .name(file_name)
                    .token(token.clone())
                    .build(),
            ).await?;
            
            println!("📁 Memory stored to IPFS: {} (importance: {:.2})", file_meta.id, memory.importance);
            memory.ipfs_hash = Some(file_meta.id);
        }
        
        // Store in memory
        let mut memories = self.memories.write().await;
        memories.entry(muse_id.to_string())
            .or_insert_with(Vec::new)
            .push(memory.clone());
        
        // Update memory index
        self.update_memory_index(muse_id, &memory).await?;
        
        // Add to cache for quick access
        self.memory_cache.write().await.insert(memory.memory_id.clone(), memory.clone());
        
        Ok(memory.memory_id.clone())
    }
    
    pub async fn get_recent_memories(
        &self,
        muse_id: &str,
        limit: usize,
    ) -> Result<Vec<String>> {
        let memories = self.memories.read().await;
        
        if let Some(muse_memories) = memories.get(muse_id) {
            let recent: Vec<String> = muse_memories
                .iter()
                .rev() // Most recent first
                .take(limit)
                .map(|m| format!("User: {} | AI: {}", 
                    m.interaction_data.user_prompt,
                    m.interaction_data.ai_response
                ))
                .collect();
            
            Ok(recent)
        } else {
            Ok(vec![])
        }
    }
    
    /// Get recent memory objects (for enhanced API endpoints)
    pub async fn get_recent_memory_objects(
        &self,
        muse_id: &str,
        limit: usize,
    ) -> Result<Vec<MuseMemory>> {
        let memories = self.memories.read().await;
        
        if let Some(muse_memories) = memories.get(muse_id) {
            let recent: Vec<MuseMemory> = muse_memories
                .iter()
                .rev() // Most recent first
                .take(limit)
                .cloned()
                .collect();
            
            Ok(recent)
        } else {
            Ok(vec![])
        }
    }
    
    pub async fn get_contextual_memories(
        &self,
        muse_id: &str,
        query: &str,
        limit: usize,
    ) -> Result<Vec<String>> {
        // In production, this would use vector similarity search
        // For now, simple keyword matching
        let memories = self.memories.read().await;
        
        if let Some(muse_memories) = memories.get(muse_id) {
            let mut relevant: Vec<(f32, &MuseMemory)> = muse_memories
                .iter()
                .map(|m| {
                    let relevance = self.calculate_relevance(&m.interaction_data, query);
                    (relevance, m)
                })
                .filter(|(score, _)| *score > 0.3) // Threshold
                .collect();
            
            relevant.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
            
            let result: Vec<String> = relevant
                .into_iter()
                .take(limit)
                .map(|(_, m)| format!("Previous: User said '{}', I responded '{}'", 
                    m.interaction_data.user_prompt,
                    m.interaction_data.ai_response
                ))
                .collect();
            
            Ok(result)
        } else {
            Ok(vec![])
        }
    }
    
    fn calculate_importance(&self, interaction: &InteractionData) -> f32 {
        let mut importance: f32 = 0.5; // Base importance
        
        // Longer interactions are more important
        if interaction.user_prompt.len() > 100 {
            importance += 0.2;
        }
        
        // Questions are more important
        if interaction.user_prompt.contains('?') {
            importance += 0.15;
        }
        
        // Emotional content is more important
        let emotional_words = ["feel", "emotion", "sad", "happy", "excited", "worried"];
        for word in emotional_words {
            if interaction.user_prompt.to_lowercase().contains(word) {
                importance += 0.1;
                break;
            }
        }
        
        importance.min(1.0_f32)
    }
    
    fn calculate_relevance(&self, interaction: &InteractionData, query: &str) -> f32 {
        let query_lower = query.to_lowercase();
        let prompt_lower = interaction.user_prompt.to_lowercase();
        let response_lower = interaction.ai_response.to_lowercase();
        
        let mut relevance = 0.0;
        
        // Check for keyword overlap
        let query_words: Vec<&str> = query_lower.split_whitespace().collect();
        let prompt_words: Vec<&str> = prompt_lower.split_whitespace().collect();
        
        let common_words = query_words.iter()
            .filter(|word| prompt_words.contains(word))
            .count();
        
        relevance += (common_words as f32) / (query_words.len() as f32);
        
        // Boost for exact phrase matches
        if prompt_lower.contains(&query_lower) || response_lower.contains(&query_lower) {
            relevance += 0.3;
        }
        
        relevance.min(1.0_f32)
    }
    
    pub async fn get_memory_stats(&self, muse_id: &str) -> Result<(usize, f32)> {
        let memories = self.memories.read().await;
        
        if let Some(muse_memories) = memories.get(muse_id) {
            let count = muse_memories.len();
            let avg_importance = if count > 0 {
                muse_memories.iter().map(|m| m.importance).sum::<f32>() / count as f32
            } else {
                0.0
            };
            
            Ok((count, avg_importance))
        } else {
            Ok((0, 0.0))
        }
    }
    
    // ============ ENHANCED MEMORY METHODS ============
    
    /// Generate embeddings for text (placeholder - would use actual embedding model)
    async fn generate_embedding(&self, text: &str) -> Result<Option<Vec<f32>>> {
        // Placeholder: In production, use a proper embedding model
        // For now, create a simple hash-based embedding
        let hash = md5::compute(text.as_bytes());
        let embedding: Vec<f32> = hash.0.iter().map(|&b| b as f32 / 255.0).collect();
        Ok(Some(embedding))
    }
    
    /// Enhanced importance calculation with multiple factors
    fn calculate_enhanced_importance(&self, interaction: &InteractionData) -> f32 {
        let mut importance: f32 = 0.3; // Base importance
        
        // Length factor
        let prompt_len = interaction.user_prompt.len();
        let response_len = interaction.ai_response.len();
        if prompt_len > 100 { importance += 0.1; }
        if response_len > 200 { importance += 0.1; }
        
        // Question factor
        if interaction.user_prompt.contains('?') { importance += 0.15; }
        
        // Emotional words
        let emotional_words = ["feel", "emotion", "sad", "happy", "excited", "worried", "love", "hate", "fear", "joy"];
        for word in emotional_words {
            if interaction.user_prompt.to_lowercase().contains(word) {
                importance += 0.2;
                break;
            }
        }
        
        // Personal information
        let personal_words = ["my", "i am", "i'm", "me", "myself", "family", "friend"];
        for word in personal_words {
            if interaction.user_prompt.to_lowercase().contains(word) {
                importance += 0.15;
                break;
            }
        }
        
        // Learning/educational content
        let learning_words = ["learn", "teach", "explain", "understand", "how", "why", "what"];
        for word in learning_words {
            if interaction.user_prompt.to_lowercase().contains(word) {
                importance += 0.1;
                break;
            }
        }
        
        // Response time factor (longer response time might indicate complex/important topic)
        if interaction.response_time_ms > 5000 { importance += 0.1; }
        
        importance.min(1.0)
    }
    
    /// Extract relevant tags from interaction
    fn extract_tags(&self, interaction: &InteractionData) -> Vec<String> {
        let mut tags = Vec::new();
        let combined_text = format!("{} {}", interaction.user_prompt, interaction.ai_response).to_lowercase();
        
        // Question tags
        if interaction.user_prompt.contains('?') { tags.push("question".to_string()); }
        
        // Emotional tags
        if combined_text.contains("happy") || combined_text.contains("joy") { tags.push("positive".to_string()); }
        if combined_text.contains("sad") || combined_text.contains("worry") { tags.push("negative".to_string()); }
        
        // Topic tags
        if combined_text.contains("code") || combined_text.contains("programming") { tags.push("programming".to_string()); }
        if combined_text.contains("learn") || combined_text.contains("study") { tags.push("learning".to_string()); }
        if combined_text.contains("create") || combined_text.contains("build") { tags.push("creative".to_string()); }
        if combined_text.contains("help") || combined_text.contains("support") { tags.push("assistance".to_string()); }
        
        // Length tags
        if interaction.user_prompt.len() > 200 { tags.push("detailed".to_string()); }
        if interaction.ai_response.len() > 500 { tags.push("comprehensive".to_string()); }
        
        tags
    }
    
    /// Categorize interaction type
    fn categorize_interaction(&self, interaction: &InteractionData) -> MemoryCategory {
        let combined_text = format!("{} {}", interaction.user_prompt, interaction.ai_response).to_lowercase();
        
        // Check for emotional content
        let emotional_words = ["feel", "emotion", "sad", "happy", "excited", "worried", "love", "anxious"];
        if emotional_words.iter().any(|word| combined_text.contains(word)) {
            return MemoryCategory::Emotional;
        }
        
        // Check for learning content
        let learning_words = ["learn", "teach", "explain", "understand", "lesson", "tutorial"];
        if learning_words.iter().any(|word| combined_text.contains(word)) {
            return MemoryCategory::Learning;
        }
        
        // Check for creative content
        let creative_words = ["create", "build", "design", "imagine", "story", "art", "creative"];
        if creative_words.iter().any(|word| combined_text.contains(word)) {
            return MemoryCategory::Creative;
        }
        
        // Check for problem-solving
        let problem_words = ["solve", "problem", "issue", "fix", "debug", "error", "troubleshoot"];
        if problem_words.iter().any(|word| combined_text.contains(word)) {
            return MemoryCategory::ProblemSolving;
        }
        
        // Check for personal content
        let personal_words = ["my", "i am", "personal", "family", "friend", "relationship"];
        if personal_words.iter().any(|word| combined_text.contains(word)) {
            return MemoryCategory::Personal;
        }
        
        // Check for factual content
        let factual_words = ["fact", "data", "information", "definition", "what is", "when", "where"];
        if factual_words.iter().any(|word| combined_text.contains(word)) {
            return MemoryCategory::Factual;
        }
        
        MemoryCategory::Conversation // Default
    }
    
    /// Analyze emotional tone of interaction
    fn analyze_emotional_tone(&self, interaction: &InteractionData) -> Option<EmotionalTone> {
        let combined_text = format!("{} {}", interaction.user_prompt, interaction.ai_response).to_lowercase();
        
        // Simple sentiment analysis
        let positive_words = ["happy", "joy", "great", "good", "excellent", "love", "amazing", "wonderful"];
        let negative_words = ["sad", "bad", "terrible", "awful", "hate", "worried", "anxious", "frustrated"];
        
        let positive_count = positive_words.iter().filter(|word| combined_text.contains(*word)).count();
        let negative_count = negative_words.iter().filter(|word| combined_text.contains(*word)).count();
        
        if positive_count == 0 && negative_count == 0 {
            return None;
        }
        
        let sentiment = if positive_count > negative_count {
            0.7 // Positive
        } else if negative_count > positive_count {
            -0.7 // Negative
        } else {
            0.0 // Neutral
        };
        
        let mut emotions = Vec::new();
        if combined_text.contains("happy") { emotions.push(("happiness".to_string(), 0.8)); }
        if combined_text.contains("sad") { emotions.push(("sadness".to_string(), 0.8)); }
        if combined_text.contains("excited") { emotions.push(("excitement".to_string(), 0.9)); }
        if combined_text.contains("worried") { emotions.push(("worry".to_string(), 0.7)); }
        
        // Energy level based on punctuation and word choice
        let energy_level = if combined_text.contains('!') || combined_text.contains("excited") {
            0.8
        } else if combined_text.contains("calm") || combined_text.contains("peaceful") {
            0.3
        } else {
            0.5
        };
        
        Some(EmotionalTone {
            sentiment,
            emotions,
            energy_level,
        })
    }
    
    /// Get recent context for new memory
    async fn get_recent_context(&self, muse_id: &str, limit: usize) -> Result<Vec<String>> {
        let memories = self.memories.read().await;
        
        if let Some(muse_memories) = memories.get(muse_id) {
            let recent: Vec<String> = muse_memories
                .iter()
                .rev()
                .take(limit)
                .map(|m| m.memory_id.clone())
                .collect();
            Ok(recent)
        } else {
            Ok(Vec::new())
        }
    }
    
    /// Determine retention priority
    fn determine_retention_priority(&self, interaction: &InteractionData) -> RetentionPriority {
        let combined_text = format!("{} {}", interaction.user_prompt, interaction.ai_response).to_lowercase();
        
        // Critical: Personal information, important decisions
        let critical_words = ["password", "secret", "important", "remember", "never forget"];
        if critical_words.iter().any(|word| combined_text.contains(word)) {
            return RetentionPriority::Critical;
        }
        
        // High: Learning content, emotional conversations
        let high_words = ["learn", "feel", "emotion", "personal", "family"];
        if high_words.iter().any(|word| combined_text.contains(word)) {
            return RetentionPriority::High;
        }
        
        // Low: Simple questions, basic interactions
        if interaction.user_prompt.len() < 50 && interaction.ai_response.len() < 100 {
            return RetentionPriority::Low;
        }
        
        // Temporary: Greetings, basic acknowledgments
        let temporary_words = ["hello", "hi", "bye", "thanks", "ok", "yes", "no"];
        if temporary_words.iter().any(|word| combined_text.trim() == *word) {
            return RetentionPriority::Temporary;
        }
        
        RetentionPriority::Medium // Default
    }
    
    /// Update memory index for faster retrieval
    async fn update_memory_index(&self, muse_id: &str, memory: &MuseMemory) -> Result<()> {
        let mut indexes = self.indexes.write().await;
        let index = indexes.entry(muse_id.to_string()).or_insert_with(|| MemoryIndex {
            muse_id: muse_id.to_string(),
            total_memories: 0,
            memories_by_category: HashMap::new(),
            memories_by_tag: HashMap::new(),
            recent_memories: Vec::new(),
            important_memories: Vec::new(),
            last_updated: 0,
            ipfs_hash: None,
        });
        
        // Update counts
        index.total_memories += 1;
        
        // Update category index
        let category_key = memory.category.to_string();
        index.memories_by_category
            .entry(category_key)
            .or_insert_with(Vec::new)
            .push(memory.memory_id.clone());
        
        // Update tag index
        for tag in &memory.tags {
            index.memories_by_tag
                .entry(tag.clone())
                .or_insert_with(Vec::new)
                .push(memory.memory_id.clone());
        }
        
        // Update recent memories (keep last 50)
        index.recent_memories.push(memory.memory_id.clone());
        if index.recent_memories.len() > 50 {
            index.recent_memories.remove(0);
        }
        
        // Update important memories
        if memory.importance > 0.7 {
            index.important_memories.push(memory.memory_id.clone());
        }
        
        index.last_updated = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_secs();
        
        Ok(())
    }
    
    /// Search memories by tags
    pub async fn search_by_tags(&self, muse_id: &str, tags: &[String], limit: usize) -> Result<Vec<MuseMemory>> {
        let indexes = self.indexes.read().await;
        let memories = self.memories.read().await;
        
        if let (Some(index), Some(muse_memories)) = (indexes.get(muse_id), memories.get(muse_id)) {
            let mut matching_ids = Vec::new();
            
            for tag in tags {
                if let Some(tag_memories) = index.memories_by_tag.get(tag) {
                    matching_ids.extend(tag_memories.clone());
                }
            }
            
            // Remove duplicates and get actual memories
            matching_ids.sort();
            matching_ids.dedup();
            
            let result: Vec<MuseMemory> = muse_memories
                .iter()
                .filter(|m| matching_ids.contains(&m.memory_id))
                .take(limit)
                .cloned()
                .collect();
            
            Ok(result)
        } else {
            Ok(Vec::new())
        }
    }
    
    /// Search memories by category
    pub async fn search_by_category(&self, muse_id: &str, category: &MemoryCategory, limit: usize) -> Result<Vec<MuseMemory>> {
        let indexes = self.indexes.read().await;
        let memories = self.memories.read().await;
        
        if let (Some(index), Some(muse_memories)) = (indexes.get(muse_id), memories.get(muse_id)) {
            let category_key = category.to_string();
            
            if let Some(category_memories) = index.memories_by_category.get(&category_key) {
                let result: Vec<MuseMemory> = muse_memories
                    .iter()
                    .filter(|m| category_memories.contains(&m.memory_id))
                    .take(limit)
                    .cloned()
                    .collect();
                
                Ok(result)
            } else {
                Ok(Vec::new())
            }
        } else {
            Ok(Vec::new())
        }
    }
    
    /// Get memories by importance threshold
    pub async fn get_important_memories(&self, muse_id: &str, min_importance: f32, limit: usize) -> Result<Vec<MuseMemory>> {
        let memories = self.memories.read().await;
        
        if let Some(muse_memories) = memories.get(muse_id) {
            let mut important: Vec<&MuseMemory> = muse_memories
                .iter()
                .filter(|m| m.importance >= min_importance)
                .collect();
            
            important.sort_by(|a, b| b.importance.partial_cmp(&a.importance).unwrap());
            
            let result: Vec<MuseMemory> = important
                .into_iter()
                .take(limit)
                .cloned()
                .collect();
            
            Ok(result)
        } else {
            Ok(Vec::new())
        }
    }
    
    /// Advanced semantic search using embeddings (placeholder)
    pub async fn semantic_search(&self, muse_id: &str, query: &str, limit: usize) -> Result<Vec<MuseMemory>> {
        // Placeholder: In production, use proper vector similarity search
        let query_embedding = self.generate_embedding(query).await?;
        
        if let Some(query_emb) = query_embedding {
            let memories = self.memories.read().await;
            
            if let Some(muse_memories) = memories.get(muse_id) {
                let mut scored: Vec<(f32, &MuseMemory)> = muse_memories
                    .iter()
                    .filter_map(|m| {
                        if let Some(ref emb) = m.embedding {
                            let similarity = self.cosine_similarity(&query_emb, emb);
                            Some((similarity, m))
                        } else {
                            None
                        }
                    })
                    .collect();
                
                scored.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
                
                let result: Vec<MuseMemory> = scored
                    .into_iter()
                    .take(limit)
                    .map(|(_, m)| m.clone())
                    .collect();
                
                Ok(result)
            } else {
                Ok(Vec::new())
            }
        } else {
            // Fallback to keyword search
            self.get_contextual_memories(muse_id, query, limit).await.map(|_| Vec::new())
        }
    }
    
    /// Calculate cosine similarity between embeddings
    fn cosine_similarity(&self, a: &[f32], b: &[f32]) -> f32 {
        if a.len() != b.len() {
            return 0.0;
        }
        
        let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
        let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
        let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
        
        if norm_a == 0.0 || norm_b == 0.0 {
            0.0
        } else {
            dot_product / (norm_a * norm_b)
        }
    }
    
    /// Get enhanced memory statistics
    pub async fn get_enhanced_stats(&self, muse_id: &str) -> Result<serde_json::Value> {
        let memories = self.memories.read().await;
        let indexes = self.indexes.read().await;
        
        if let Some(muse_memories) = memories.get(muse_id) {
            let total_memories = muse_memories.len();
            let avg_importance = if total_memories > 0 {
                muse_memories.iter().map(|m| m.importance).sum::<f32>() / total_memories as f32
            } else {
                0.0
            };
            
            // Category breakdown
            let mut category_counts = HashMap::new();
            for memory in muse_memories {
                let category = memory.category.to_string();
                *category_counts.entry(category).or_insert(0) += 1;
            }
            
            // Tag analysis
            let mut tag_counts = HashMap::new();
            for memory in muse_memories {
                for tag in &memory.tags {
                    *tag_counts.entry(tag.clone()).or_insert(0) += 1;
                }
            }
            
            let stats = serde_json::json!({
                "total_memories": total_memories,
                "average_importance": avg_importance,
                "category_breakdown": category_counts,
                "top_tags": tag_counts,
                "has_index": indexes.contains_key(muse_id),
                "cache_size": self.memory_cache.read().await.len()
            });
            
            Ok(stats)
        } else {
            Ok(serde_json::json!({
                "total_memories": 0,
                "average_importance": 0.0,
                "category_breakdown": {},
                "top_tags": {},
                "has_index": false,
                "cache_size": 0
            }))
        }
    }
}