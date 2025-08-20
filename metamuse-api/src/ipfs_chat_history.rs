use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use crate::config::Config;
use alith::data::storage::{PinataIPFS, DataStorage};
use alith::core::chat::Message;

/// Represents a complete chat session stored on IPFS
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IPFSChatSession {
    pub session_id: String,
    pub muse_id: String,
    pub user_address: String,
    pub created_at: u64,
    pub last_updated: u64,
    pub message_count: usize,
    pub total_tokens_estimate: usize,
    
    /// Full conversation history with compression metadata
    pub messages: Vec<IPFSChatMessage>,
    
    /// Compressed summaries of older conversation segments
    pub compressed_segments: Vec<CompressedSegment>,
    
    /// Metadata for semantic search and context retrieval
    pub topics: Vec<String>,
    pub emotional_tone: Option<EmotionalTone>,
    pub importance_score: f32,
    
    // IPFS metadata
    pub ipfs_hash: Option<String>,
    pub version: u32,
}

/// Individual message in the IPFS chat session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IPFSChatMessage {
    pub id: String,
    pub role: String, // "user", "assistant", "system"
    pub content: String,
    pub timestamp: u64,
    pub token_count: usize,
    pub importance: f32,
    pub compressed: bool, // Whether this message has been semantically compressed
    pub original_length: Option<usize>, // Original length before compression
}

/// Compressed conversation segment for older messages
#[derive(Debug, Clone, Serialize, Deserialize)]  
pub struct CompressedSegment {
    pub segment_id: String,
    pub start_timestamp: u64,
    pub end_timestamp: u64,
    pub original_message_count: usize,
    pub compressed_summary: String,
    pub key_topics: Vec<String>,
    pub emotional_context: String,
    pub importance_score: f32,
}

/// Emotional tone analysis for conversation segments
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmotionalTone {
    pub sentiment: f32, // -1.0 to 1.0
    pub emotions: Vec<(String, f32)>, // emotion name and intensity
    pub energy_level: f32, // 0.0 to 1.0
}

/// Configuration for chat history management
#[derive(Debug, Clone)]
pub struct ChatHistoryConfig {
    pub max_recent_messages: usize, // Messages to keep uncompressed
    pub compression_threshold_age: u64, // Age in seconds before compression
    pub max_context_tokens: usize, // Maximum tokens to include in ALITH history
    pub cache_size: usize, // Number of sessions to cache in memory
    pub compression_ratio: f32, // Target compression ratio (0.1 = 10% of original)
}

impl Default for ChatHistoryConfig {
    fn default() -> Self {
        Self {
            max_recent_messages: 50,
            compression_threshold_age: 3600, // 1 hour
            max_context_tokens: 8000, // Leave room for new responses
            cache_size: 100,
            compression_ratio: 0.2, // Compress to 20% of original
        }
    }
}

/// Manages IPFS-based chat history storage and retrieval
pub struct IPFSChatHistoryManager {
    ipfs_storage: Arc<PinataIPFS>,
    client: reqwest::Client,
    app_config: Config,
    chat_config: ChatHistoryConfig,
    
    // In-memory cache for performance
    session_cache: Arc<RwLock<HashMap<String, Arc<IPFSChatSession>>>>,
    
    // Maps session_id to current IPFS hash for quick lookup
    session_hashes: Arc<RwLock<HashMap<String, String>>>,
    
    // Maps user_address+muse_id to most recent session_id for continuity
    user_muse_sessions: Arc<RwLock<HashMap<String, String>>>,
}

impl IPFSChatHistoryManager {
    /// Create a new IPFS chat history manager
    pub async fn new(config: &Config) -> Result<Self> {
        let ipfs_storage = Arc::new(PinataIPFS::default());

        Ok(Self {
            ipfs_storage,
            client: reqwest::Client::new(),
            app_config: config.clone(),
            chat_config: ChatHistoryConfig::default(),
            session_cache: Arc::new(RwLock::new(HashMap::new())),  
            session_hashes: Arc::new(RwLock::new(HashMap::new())),
            user_muse_sessions: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Find existing session or create new one for user+muse combination
    pub async fn get_or_create_session(
        &self,
        muse_id: String,
        user_address: String,
    ) -> Result<Arc<IPFSChatSession>> {
        let user_muse_key = format!("{}:{}", user_address, muse_id);
        
        // Check if we have an existing session for this user+muse combination
        if let Some(existing_session_id) = self.get_user_muse_session(&user_muse_key).await {
            println!("🔄 Found existing session {} for user {} + muse {}", existing_session_id, user_address, muse_id);
            
            // Try to retrieve the existing session
            if let Some(cached_session) = self.get_cached_session(&existing_session_id).await {
                println!("✅ Continuing existing session from cache with {} messages", cached_session.messages.len());
                return Ok(cached_session);
            }
            
            // If not in cache, try to load from IPFS
            if let Some(ipfs_hash) = self.get_session_hash(&existing_session_id).await {
                match self.retrieve_session_from_ipfs(&ipfs_hash).await {
                    Ok(session) => {
                        println!("✅ Continuing existing session from IPFS with {} messages", session.messages.len());
                        let session_arc = Arc::new(session);
                        self.cache_session(existing_session_id, session_arc.clone()).await;
                        return Ok(session_arc);
                    }
                    Err(e) => {
                        println!("⚠️ Failed to retrieve existing session from IPFS: {}, creating new session", e);
                    }
                }
            }
        }
        
        // Create new session if none exists or retrieval failed
        let session_id = format!("session_{}_{}", muse_id, current_timestamp());
        println!("🆕 Creating new session {} for user {} + muse {}", session_id, user_address, muse_id);
        
        self.initialize_session(session_id, muse_id, user_address).await
    }

    /// Initialize a new chat session or retrieve existing one
    pub async fn initialize_session(
        &self,
        session_id: String,
        muse_id: String,
        user_address: String,
    ) -> Result<Arc<IPFSChatSession>> {
        // Check cache first
        if let Some(cached_session) = self.get_cached_session(&session_id).await {
            return Ok(cached_session);
        }

        // Check if session exists on IPFS
        if let Some(ipfs_hash) = self.get_session_hash(&session_id).await {
            match self.retrieve_session_from_ipfs(&ipfs_hash).await {
                Ok(session) => {
                    let session_arc = Arc::new(session);
                    self.cache_session(session_id.clone(), session_arc.clone()).await;
                    return Ok(session_arc);
                }
                Err(e) => {
                    println!("⚠️ Failed to retrieve session from IPFS {}: {}", ipfs_hash, e);
                    // Continue to create new session
                }
            }
        }

        // Create new session
        let session = IPFSChatSession {
            session_id: session_id.clone(),
            muse_id: muse_id.clone(),
            user_address: user_address.clone(),
            created_at: current_timestamp(),
            last_updated: current_timestamp(),
            message_count: 0,
            total_tokens_estimate: 0,
            messages: Vec::new(),
            compressed_segments: Vec::new(),
            topics: Vec::new(),
            emotional_tone: None,
            importance_score: 0.5,
            ipfs_hash: None,
            version: 1,
        };

        let session_arc = Arc::new(session);
        self.cache_session(session_id.clone(), session_arc.clone()).await;
        
        // Track this session for the user+muse combination
        let user_muse_key = format!("{}:{}", user_address, muse_id);
        self.set_user_muse_session(&user_muse_key, session_id).await;
        
        Ok(session_arc)
    }

    /// Add a new message to the chat session and update IPFS
    pub async fn add_message(
        &self,
        session_id: &str,
        role: String,
        content: String,
        message_id: String,
    ) -> Result<Arc<IPFSChatSession>> {
        let mut session = self.get_session_for_update(session_id).await.unwrap_or_else(|_| {
            // Create a minimal session if one doesn't exist
            Arc::new(IPFSChatSession {
                session_id: session_id.to_string(),
                muse_id: "unknown".to_string(),
                user_address: "unknown".to_string(),
                created_at: current_timestamp(),
                last_updated: current_timestamp(),
                message_count: 0,
                total_tokens_estimate: 0,
                messages: Vec::new(),
                compressed_segments: Vec::new(),
                topics: Vec::new(),
                emotional_tone: None,
                importance_score: 0.5,
                ipfs_hash: None,
                version: 1,
            })
        });
        
        let message = IPFSChatMessage {
            id: message_id,
            role,
            content: content.clone(),
            timestamp: current_timestamp(),
            token_count: estimate_token_count(&content),
            importance: calculate_message_importance(&content),
            compressed: false,
            original_length: None,
        };

        // Add message to session
        let mut session_mut = Arc::make_mut(&mut session);
        session_mut.messages.push(message);
        session_mut.message_count += 1;
        session_mut.total_tokens_estimate += estimate_token_count(&content);
        session_mut.last_updated = current_timestamp();
        session_mut.version += 1;

        // Check if compression is needed
        if session_mut.messages.len() > self.chat_config.max_recent_messages {
            self.compress_old_messages(&mut session_mut).await?;
        }

        // Update IPFS and cache - with fallback if IPFS fails
        let updated_session = match self.store_session_to_ipfs(session_mut).await {
            Ok(session) => {
                println!("✅ Successfully stored session to IPFS");
                session
            }
            Err(e) => {
                println!("⚠️ IPFS storage failed: {}, continuing with in-memory session", e);
                // Continue without IPFS storage but update the session
                let mut fallback_session = session_mut.clone();
                fallback_session.last_updated = current_timestamp();
                fallback_session.version += 1;
                fallback_session
            }
        };
        
        let session_arc = Arc::new(updated_session);
        self.cache_session(session_id.to_string(), session_arc.clone()).await;
        Ok(session_arc)
    }

    /// Retrieve conversation history formatted for ALITH Request
    pub async fn get_alith_history(&self, session_id: &str) -> Result<Vec<Message>> {
        let session = self.get_cached_session(session_id).await
            .ok_or_else(|| anyhow::anyhow!("Session not found: {}", session_id))?;

        let mut history = Vec::new();
        let mut token_count = 0;

        // Add compressed segments first (oldest context)
        for segment in &session.compressed_segments {
            if token_count + estimate_token_count(&segment.compressed_summary) > self.chat_config.max_context_tokens {
                break;
            }
            
            history.push(Message {
                role: "system".to_string(),
                content: format!(
                    "[Conversation Summary {}]: {}",
                    format_timestamp_range(segment.start_timestamp, segment.end_timestamp),
                    segment.compressed_summary
                ),
            });
            
            token_count += estimate_token_count(&segment.compressed_summary);
        }

        // Add recent messages (newest context)
        let recent_messages: Vec<_> = session.messages
            .iter()
            .rev() // Start from most recent
            .take_while(|msg| {
                token_count += msg.token_count;
                token_count <= self.chat_config.max_context_tokens
            })
            .collect();

        // Reverse to get chronological order
        for message in recent_messages.into_iter().rev() {
            history.push(Message {
                role: message.role.clone(),
                content: message.content.clone(),
            });
        }

        println!("📚 Retrieved {} history messages ({} tokens) for session {}", 
                history.len(), token_count, session_id);

        Ok(history)
    }

    /// Store session to IPFS using direct Pinata API (bypassing ALITH library issues)
    async fn store_session_to_ipfs(&self, session: &IPFSChatSession) -> Result<IPFSChatSession> {
        let session_json_string = serde_json::to_string_pretty(session)?;
        
        // Get token from config
        let token = {
            if let Some(jwt) = &self.app_config.ipfs_jwt_token {
                jwt.clone()
            } else if let Some(api_key) = &self.app_config.ipfs_api_key {
                api_key.clone()
            } else {
                return Err(anyhow::anyhow!("No IPFS authentication token available"));
            }
        };
        
        let ipfs_filename = format!("ChatSession_{}_{}.json", 
            session.session_id, session.version);
        
        println!("🔧 Using direct Pinata API with token: {}...", &token[..std::cmp::min(10, token.len())]);
        println!("📤 Storing chat session {} to IPFS ({} messages, {} bytes)", 
                session.session_id, session.message_count, session_json_string.len());

        // Direct Pinata API call to bypass ALITH library response parsing issues
        let ipfs_hash = match self.upload_to_pinata_directly(&session_json_string, &ipfs_filename, &token).await {
            Ok(hash) => {
                println!("✅ Direct Pinata upload successful: {}", hash);
                hash
            }
            Err(e) => {
                println!("❌ Direct Pinata upload failed: {}", e);
                return Err(anyhow::anyhow!("Direct Pinata upload failed: {}", e));
            }
        };

        let mut updated_session = session.clone();
        updated_session.ipfs_hash = Some(ipfs_hash.clone());

        // Update session hash mapping
        self.set_session_hash(&session.session_id, ipfs_hash.clone()).await;

        println!("✅ Chat session {} stored to IPFS: {}", 
                session.session_id, ipfs_hash);

        Ok(updated_session)
    }

    /// Direct Pinata API upload bypassing ALITH library
    async fn upload_to_pinata_directly(&self, content: &str, filename: &str, token: &str) -> Result<String> {
        use reqwest::multipart;
        
        let url = "https://uploads.pinata.cloud/v3/files";
        
        // Create multipart form
        let file_part = multipart::Part::text(content.to_string())
            .file_name(filename.to_string())
            .mime_str("application/json")?;
        
        let form = multipart::Form::new()
            .part("file", file_part);
        
        println!("🌐 Making direct request to Pinata API: {}", url);
        
        let response = self.client
            .post(url)
            .multipart(form)
            .bearer_auth(token)
            .send()
            .await?;
        
        let status = response.status();
        println!("📡 Pinata API response status: {}", status);
        
        if !status.is_success() {
            let error_text = response.text().await?;
            println!("❌ Pinata API error response: {}", error_text);
            return Err(anyhow::anyhow!("Pinata API error {}: {}", status, error_text));
        }
        
        let response_text = response.text().await?;
        println!("📥 Raw Pinata API response: {}", &response_text[..std::cmp::min(500, response_text.len())]);
        
        // Parse response to extract CID/hash
        let response_json: serde_json::Value = serde_json::from_str(&response_text)?;
        
        // Try different possible response formats from Pinata API
        let ipfs_hash = if let Some(data) = response_json.get("data") {
            // v3 API format: { "data": { "cid": "...", "id": "..." } }
            if let Some(cid) = data.get("cid") {
                cid.as_str().unwrap_or_default().to_string()
            } else if let Some(id) = data.get("id") {
                id.as_str().unwrap_or_default().to_string()
            } else {
                return Err(anyhow::anyhow!("No CID or ID found in Pinata response data"));
            }
        } else if let Some(cid) = response_json.get("cid") {
            // Direct CID format: { "cid": "..." }
            cid.as_str().unwrap_or_default().to_string()
        } else if let Some(id) = response_json.get("id") {
            // Direct ID format: { "id": "..." }
            id.as_str().unwrap_or_default().to_string()
        } else {
            return Err(anyhow::anyhow!("No recognizable hash/CID found in Pinata response: {}", response_text));
        };
        
        if ipfs_hash.is_empty() {
            return Err(anyhow::anyhow!("Empty hash returned from Pinata API"));
        }
        
        println!("🎯 Extracted IPFS hash: {}", ipfs_hash);
        Ok(ipfs_hash)
    }

    /// Retrieve session from IPFS using direct Gateway access
    async fn retrieve_session_from_ipfs(&self, ipfs_hash: &str) -> Result<IPFSChatSession> {
        println!("📥 Retrieving chat session from IPFS: {}", ipfs_hash);
        
        // Use direct IPFS gateway access for reliability
        let download_url = format!("https://gateway.pinata.cloud/ipfs/{}", ipfs_hash);
        println!("🌐 Fetching from IPFS gateway: {}", download_url);
        
        let response = self.client
            .get(&download_url)
            .send()
            .await?;
        
        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await?;
            return Err(anyhow::anyhow!("IPFS gateway error {}: {}", status, error_text));
        }
        
        let content = response.text().await?;
        println!("📥 Retrieved {} bytes from IPFS", content.len());
        
        let session: IPFSChatSession = serde_json::from_str(&content)
            .map_err(|e| anyhow::anyhow!("Failed to parse IPFS session data: {}", e))?;
        
        println!("✅ Retrieved chat session {} from IPFS ({} messages)", 
                session.session_id, session.message_count);
        
        Ok(session)
    }

    /// Compress old messages to reduce storage and context size
    async fn compress_old_messages(&self, session: &mut IPFSChatSession) -> Result<()> {
        let cutoff_time = current_timestamp() - self.chat_config.compression_threshold_age;
        let mut messages_to_compress = Vec::new();
        let mut remaining_messages = Vec::new();

        // Separate old and recent messages
        for message in session.messages.drain(..) {
            if message.timestamp < cutoff_time && !message.compressed {
                messages_to_compress.push(message);
            } else {
                remaining_messages.push(message);
            }
        }

        if messages_to_compress.is_empty() {
            session.messages = remaining_messages;
            return Ok(());
        }

        println!("🗜️ Compressing {} old messages for session {}", 
                messages_to_compress.len(), session.session_id);

        // Create compressed segment
        let segment = self.create_compressed_segment(messages_to_compress).await?;
        session.compressed_segments.push(segment);
        session.messages = remaining_messages;

        Ok(())
    }

    /// Create a compressed segment from a group of messages
    async fn create_compressed_segment(&self, messages: Vec<IPFSChatMessage>) -> Result<CompressedSegment> {
        if messages.is_empty() {
            return Err(anyhow::anyhow!("Cannot compress empty message list"));
        }

        let start_timestamp = messages.first().unwrap().timestamp;
        let end_timestamp = messages.last().unwrap().timestamp;
        let original_count = messages.len();

        // Create conversation text for compression
        let conversation_text = messages
            .iter()
            .map(|msg| format!("{}: {}", msg.role, msg.content))
            .collect::<Vec<_>>()
            .join("\n");

        // AI-powered semantic compression
        let compressed_summary = self.compress_conversation_semantically(&conversation_text).await?;
        
        // Extract key topics and emotional context
        let key_topics = self.extract_key_topics(&conversation_text).await?;
        let emotional_context = self.analyze_emotional_context(&conversation_text).await?;
        
        let importance_score = messages
            .iter()
            .map(|msg| msg.importance)
            .sum::<f32>() / messages.len() as f32;

        Ok(CompressedSegment {
            segment_id: generate_segment_id(),
            start_timestamp,
            end_timestamp,
            original_message_count: original_count,
            compressed_summary,
            key_topics,
            emotional_context,
            importance_score,
        })
    }

    /// Use AI to semantically compress conversation text
    async fn compress_conversation_semantically(&self, conversation: &str) -> Result<String> {
        let target_length = (conversation.len() as f32 * self.chat_config.compression_ratio) as usize;
        let target_length = target_length.max(100); // Minimum 100 chars

        // For now, use simple truncation with key information preservation
        // TODO: Integrate with ALITH for actual AI-powered compression
        if conversation.len() <= target_length {
            return Ok(conversation.to_string());
        }

        // Extract key sentences (simple heuristic)
        let sentences: Vec<&str> = conversation.split('.').collect();
        let important_sentences: Vec<&str> = sentences
            .iter()
            .filter(|s| {
                let s_lower = s.to_lowercase();
                s_lower.contains('?') || // Questions
                s_lower.contains("important") ||
                s_lower.contains("remember") ||
                s_lower.contains("key") ||
                s_lower.len() > 50 // Longer sentences likely more important
            })
            .cloned()
            .collect();

        let compressed = if important_sentences.is_empty() {
            // Fallback: take first and last parts
            let half = target_length / 2;
            format!("{}...<conversation continued>...{}", 
                   &conversation[..half.min(conversation.len())],
                   &conversation[conversation.len().saturating_sub(half)..])
        } else {
            important_sentences.join(". ") + "."
        };

        Ok(compressed)
    }

    /// Extract key topics from conversation
    async fn extract_key_topics(&self, conversation: &str) -> Result<Vec<String>> {
        // Simple keyword extraction (could be enhanced with NLP)
        let conversation_lower = conversation.to_lowercase();
        let words: Vec<&str> = conversation_lower
            .split_whitespace()
            .filter(|word| word.len() > 4) // Filter short words
            .collect();

        let mut word_counts = HashMap::new();
        for word in words {
            *word_counts.entry(word).or_insert(0) += 1;
        }

        let mut topics: Vec<_> = word_counts
            .into_iter()
            .filter(|(_, count)| *count > 1) // Only repeated words
            .collect();
        
        topics.sort_by(|a, b| b.1.cmp(&a.1)); // Sort by frequency
        
        Ok(topics
            .into_iter()
            .take(5) // Top 5 topics
            .map(|(word, _)| word.to_string())
            .collect())
    }

    /// Analyze emotional context of conversation
    async fn analyze_emotional_context(&self, conversation: &str) -> Result<String> {
        let conversation_lower = conversation.to_lowercase();
        
        // Simple emotional analysis
        let emotions = vec![
            ("happy", ["happy", "joy", "excited", "great", "amazing", "wonderful"]),
            ("sad", ["sad", "disappointed", "upset", "depressed", "down", "melancholy"]),
            ("angry", ["angry", "mad", "frustrated", "annoyed", "irritated", "furious"]),
            ("curious", ["curious", "wonder", "interesting", "question", "why", "how"]),
            ("supportive", ["help", "support", "encourage", "understand", "care", "assist"]),
        ];

        let mut emotion_scores = HashMap::new();
        for (emotion, keywords) in emotions {
            let score = keywords
                .iter()
                .map(|keyword| conversation_lower.matches(keyword).count())
                .sum::<usize>();
            
            if score > 0 {
                emotion_scores.insert(emotion, score);
            }
        }

        let dominant_emotion = emotion_scores
            .into_iter()
            .max_by_key(|(_, score)| *score)
            .map(|(emotion, _)| emotion)
            .unwrap_or("neutral");

        Ok(format!("Emotional tone: {}", dominant_emotion))
    }

    // Cache management methods
    async fn get_cached_session(&self, session_id: &str) -> Option<Arc<IPFSChatSession>> {
        self.session_cache.read().await.get(session_id).cloned()
    }

    async fn cache_session(&self, session_id: String, session: Arc<IPFSChatSession>) {
        let mut cache = self.session_cache.write().await;
        
        // Simple LRU eviction if cache is full
        if cache.len() >= self.chat_config.cache_size {
            if let Some(oldest_key) = cache.keys().next().cloned() {
                cache.remove(&oldest_key);
            }
        }
        
        cache.insert(session_id, session);
    }

    async fn get_session_for_update(&self, session_id: &str) -> Result<Arc<IPFSChatSession>> {
        self.get_cached_session(session_id).await
            .ok_or_else(|| anyhow::anyhow!("Session not initialized: {}", session_id))
    }

    async fn get_session_hash(&self, session_id: &str) -> Option<String> {
        self.session_hashes.read().await.get(session_id).cloned()
    }

    async fn set_session_hash(&self, session_id: &str, ipfs_hash: String) {
        self.session_hashes.write().await.insert(session_id.to_string(), ipfs_hash);
    }

    async fn get_user_muse_session(&self, user_muse_key: &str) -> Option<String> {
        self.user_muse_sessions.read().await.get(user_muse_key).cloned()
    }

    async fn set_user_muse_session(&self, user_muse_key: &str, session_id: String) {
        self.user_muse_sessions.write().await.insert(user_muse_key.to_string(), session_id);
    }

    /// Store training data contribution to IPFS
    pub async fn store_training_data(&self, data: &[u8], data_hash: &str) -> Result<String> {
        println!("📁 Storing training data to IPFS - Hash: {}", data_hash);
        
        // Convert data to string for direct upload
        let content = String::from_utf8(data.to_vec())
            .map_err(|e| anyhow::anyhow!("Invalid UTF-8 data: {}", e))?;
        
        let filename = format!("training_data_{}.json", data_hash);
        
        // Get token from config
        let token = self.app_config.ipfs_jwt_token.clone()
            .ok_or_else(|| anyhow::anyhow!("No IPFS JWT token configured"))?;
        
        // Use direct Pinata API upload (same as working implementations)
        match self.upload_to_pinata_directly(&content, &filename, &token).await {
            Ok(ipfs_hash) => {
                println!("✅ Training data uploaded to IPFS: {}", ipfs_hash);
                Ok(ipfs_hash)
            }
            Err(e) => {
                println!("❌ Failed to upload training data to IPFS: {}", e);
                Err(anyhow::anyhow!("IPFS upload failed: {}", e))
            }
        }
    }
}

// Utility functions
fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

fn estimate_token_count(text: &str) -> usize {
    // Rough estimation: ~4 characters per token
    text.len() / 4
}

fn calculate_message_importance(content: &str) -> f32 {
    let mut importance: f32 = 0.5; // Base importance
    
    // Boost for questions
    if content.contains('?') {
        importance += 0.2;
    }
    
    // Boost for longer messages
    if content.len() > 100 {
        importance += 0.1;
    }
    
    // Boost for emotional words
    let emotional_words = ["feel", "love", "hate", "excited", "worried", "happy", "sad"];
    for word in emotional_words {
        if content.to_lowercase().contains(word) {
            importance += 0.1;
            break;
        }
    }
    
    importance.min(1.0_f32)
}

fn generate_segment_id() -> String {
    format!("segment_{}", current_timestamp())
}

fn format_timestamp_range(start: u64, end: u64) -> String {
    use chrono::{DateTime, Utc, TimeZone};
    
    let start_dt = Utc.timestamp_opt(start as i64, 0).unwrap();
    let end_dt = Utc.timestamp_opt(end as i64, 0).unwrap();
    
    if start_dt.date_naive() == end_dt.date_naive() {
        format!("{} - {}", 
               start_dt.format("%H:%M"),
               end_dt.format("%H:%M"))
    } else {
        format!("{} - {}", 
               start_dt.format("%m/%d %H:%M"),
               end_dt.format("%m/%d %H:%M"))
    }
}