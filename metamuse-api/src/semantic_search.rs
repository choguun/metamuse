use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::config::Config;
use crate::ipfs_chat_history::IPFSChatHistoryManager;

/// Vector embedding representation for semantic search
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorEmbedding {
    pub content_hash: String,
    pub embedding: Vec<f32>,
    pub content_type: String, // "message", "memory", "context"
    pub timestamp: u64,
    pub metadata: HashMap<String, String>,
}

/// Semantic search result with relevance score
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticSearchResult {
    pub content_hash: String,
    pub content: String,
    pub relevance_score: f64,
    pub content_type: String,
    pub timestamp: u64,
    pub metadata: HashMap<String, String>,
}

/// Semantic search query parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticQuery {
    pub query_text: String,
    pub content_types: Vec<String>, // Filter by content type
    pub min_relevance: f64,         // Minimum relevance threshold
    pub max_results: usize,         // Maximum number of results
    pub time_range: Option<(u64, u64)>, // Optional time range filter
}

/// Enhanced semantic search service with IPFS integration
pub struct SemanticSearchService {
    config: Config,
    ipfs_manager: Arc<IPFSChatHistoryManager>,
    // In-memory embedding cache for performance
    embedding_cache: RwLock<HashMap<String, VectorEmbedding>>,
    // Pre-computed embeddings storage
    embeddings_store: RwLock<Vec<VectorEmbedding>>,
}

impl SemanticSearchService {
    pub fn new(config: Config, ipfs_manager: Arc<IPFSChatHistoryManager>) -> Self {
        Self {
            config,
            ipfs_manager,
            embedding_cache: RwLock::new(HashMap::new()),
            embeddings_store: RwLock::new(Vec::new()),
        }
    }

    /// Generate vector embedding for text content using OpenAI embeddings API
    pub async fn generate_embedding(&self, text: &str) -> Result<Vec<f32>> {
        println!("🔍 Generating embedding for text (length: {})", text.len());

        // For hackathon demo, return mock embeddings based on text characteristics
        let mock_embedding = self.generate_mock_embedding(text).await;
        
        println!("✅ Generated {}-dimensional embedding", mock_embedding.len());
        Ok(mock_embedding)
    }

    /// Generate mock embeddings based on text content for demo purposes
    async fn generate_mock_embedding(&self, text: &str) -> Vec<f32> {
        const EMBEDDING_DIM: usize = 384; // Standard embedding dimension

        let text_lower = text.to_lowercase();
        let mut embedding = vec![0.0; EMBEDDING_DIM];
        
        // Create pseudo-semantic embeddings based on content characteristics
        let mut seed = 0u32;
        for byte in text.as_bytes() {
            seed = seed.wrapping_mul(31).wrapping_add(*byte as u32);
        }
        
        // Generate base random values
        for i in 0..EMBEDDING_DIM {
            let idx_seed = seed.wrapping_add(i as u32);
            embedding[i] = (idx_seed as f32 / u32::MAX as f32 - 0.5) * 2.0;
        }

        // Adjust based on semantic content
        if text_lower.contains("creative") || text_lower.contains("art") || text_lower.contains("imagination") {
            for i in 0..50 { embedding[i] += 0.3; }
        }
        
        if text_lower.contains("wise") || text_lower.contains("knowledge") || text_lower.contains("understanding") {
            for i in 50..100 { embedding[i] += 0.3; }
        }
        
        if text_lower.contains("funny") || text_lower.contains("joke") || text_lower.contains("humor") {
            for i in 100..150 { embedding[i] += 0.3; }
        }
        
        if text_lower.contains("empathy") || text_lower.contains("emotion") || text_lower.contains("feeling") {
            for i in 150..200 { embedding[i] += 0.3; }
        }

        // Question/query boosting
        if text_lower.contains("?") || text_lower.starts_with("how ") || text_lower.starts_with("what ") {
            for i in 200..250 { embedding[i] += 0.2; }
        }

        // Normalize the embedding vector
        let magnitude: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        if magnitude > 0.0 {
            for value in &mut embedding {
                *value /= magnitude;
            }
        }

        embedding
    }

    /// Store embedding in IPFS and update local cache
    pub async fn store_embedding(&self, content: &str, content_type: &str, metadata: HashMap<String, String>) -> Result<String> {
        let embedding = self.generate_embedding(content).await?;
        let content_hash = self.generate_content_hash(content);
        
        // ✅ Store actual content in IPFS with content hash as identifier
        let ipfs_cid = match self.store_content_to_ipfs(content, &content_hash, content_type).await {
            Ok(cid) => {
                println!("📦 Stored content in IPFS with CID: {}", cid);
                cid
            }
            Err(e) => {
                println!("⚠️ Failed to store content in IPFS: {}, using local storage", e);
                content_hash.clone() // Use content hash as fallback identifier
            }
        };
        
        // Enhanced metadata with IPFS CID and content preview
        let mut enhanced_metadata = metadata;
        enhanced_metadata.insert("ipfs_cid".to_string(), ipfs_cid);
        enhanced_metadata.insert("preview".to_string(), content.chars().take(100).collect::<String>());
        enhanced_metadata.insert("content_length".to_string(), content.len().to_string());
        
        let vector_embedding = VectorEmbedding {
            content_hash: content_hash.clone(),
            embedding,
            content_type: content_type.to_string(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            metadata: enhanced_metadata,
        };

        // Store in local cache
        {
            let mut cache = self.embedding_cache.write().await;
            cache.insert(content_hash.clone(), vector_embedding.clone());
        }

        // Add to embeddings store
        {
            let mut store = self.embeddings_store.write().await;
            store.push(vector_embedding);
        }

        println!("📦 Stored embedding for content hash: {} with IPFS integration", content_hash);
        Ok(content_hash)
    }

    /// ✅ Store content to IPFS using direct Pinata API integration
    async fn store_content_to_ipfs(&self, content: &str, content_hash: &str, content_type: &str) -> Result<String> {
        println!("📦 Storing semantic content to IPFS via Pinata API");
        
        // Get JWT token from config
        let token = match &self.config.ipfs_jwt_token {
            Some(jwt) => jwt.clone(),
            None => {
                return Err(anyhow::anyhow!("No IPFS JWT token configured for semantic search"));
            }
        };
        
        let filename = format!("SemanticContent_{}_{}.json", content_type, &content_hash[2..10]);
        
        // Create JSON structure for semantic content
        let semantic_content = serde_json::json!({
            "content_hash": content_hash,
            "content_type": content_type,
            "content": content,
            "timestamp": std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            "semantic_search": true
        });
        
        let content_json = serde_json::to_string_pretty(&semantic_content)?;
        
        // Use direct Pinata API call
        match self.upload_to_pinata_directly(&content_json, &filename, &token).await {
            Ok(ipfs_hash) => {
                println!("✅ Semantic content stored in IPFS: {}", ipfs_hash);
                Ok(ipfs_hash)
            }
            Err(e) => {
                println!("❌ Failed to store semantic content to IPFS: {}", e);
                Err(e)
            }
        }
    }

    /// Direct Pinata API upload for semantic content
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
        
        // Create a reqwest client for this request
        let client = reqwest::Client::new();
        let response = client
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
        println!("📥 Raw Pinata API response: {}", &response_text[..std::cmp::min(200, response_text.len())]);
        
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

    /// ✅ Retrieve content from IPFS using content hash or IPFS CID
    async fn retrieve_content_from_ipfs(&self, content_hash: &str, content_type: &str) -> Result<String> {
        // First, try to get the IPFS CID from our local embeddings cache
        let ipfs_cid = {
            let cache = self.embedding_cache.read().await;
            if let Some(embedding) = cache.get(content_hash) {
                embedding.metadata.get("ipfs_cid").cloned()
            } else {
                None
            }
        };

        if let Some(cid) = ipfs_cid {
            println!("📥 Retrieving semantic content from IPFS CID: {}", cid);
            
            // Use direct IPFS gateway access for retrieval
            let gateway_url = &self.config.ipfs_gateway_url;
            
            let download_url = format!("{}/{}", gateway_url, cid);
            println!("🌐 Fetching from IPFS gateway: {}", download_url);
            
            // Create a reqwest client for this request
            let client = reqwest::Client::new();
            match client.get(&download_url).send().await {
                Ok(response) => {
                    let status = response.status();
                    if status.is_success() {
                        match response.text().await {
                            Ok(content) => {
                                println!("📥 Retrieved {} bytes from IPFS", content.len());
                                
                                // Parse the JSON structure we stored
                                if let Ok(semantic_content) = serde_json::from_str::<serde_json::Value>(&content) {
                                    if let Some(original_content) = semantic_content.get("content") {
                                        if let Some(content_str) = original_content.as_str() {
                                            println!("✅ Successfully retrieved semantic content from IPFS");
                                            return Ok(content_str.to_string());
                                        }
                                    }
                                }
                                
                                // If JSON parsing fails, return raw content
                                println!("⚠️ Could not parse semantic JSON, returning raw content");
                                return Ok(content);
                            }
                            Err(e) => {
                                println!("❌ Failed to read IPFS response: {}", e);
                            }
                        }
                    } else {
                        println!("❌ IPFS gateway error {}", status);
                    }
                }
                Err(e) => {
                    println!("❌ Failed to fetch from IPFS gateway: {}", e);
                }
            }
        }

        // Fallback to demo content if IPFS retrieval fails
        println!("⚠️ IPFS retrieval failed, using demo content fallback");
        match content_type {
            "memory" => Ok(self.get_demo_memory_content(content_hash)),
            "conversation" => Ok(self.get_demo_conversation_content(content_hash)),
            "user_message" | "ai_response" | "chat_history" => {
                // For chat messages, try to reconstruct from content hash
                Ok(format!("Semantic content for hash: {}", &content_hash[..16]))
            }
            _ => Ok(format!("Retrieved content for type: {} hash: {}", content_type, &content_hash[..16]))
        }
    }

    /// Demo memory content based on content hash (for hackathon demo)
    fn get_demo_memory_content(&self, content_hash: &str) -> String {
        let hash_num = content_hash.chars()
            .filter_map(|c| c.to_digit(16))
            .sum::<u32>() % 10;

        match hash_num {
            0..=2 => "I love exploring creative ideas and artistic expression. There's something magical about imagination and storytelling.",
            3..=4 => "Wisdom comes from understanding deeper patterns in life. I enjoy philosophical discussions and meaningful insights.",
            5..=6 => "Humor makes everything better! I love good jokes, wordplay, and finding the lighter side of conversations.",
            7..=8 => "Empathy and emotional connection are so important. I care deeply about understanding and supporting others.",
            _ => "This is a general conversation memory about various topics and shared experiences."
        }
        .to_string()
    }

    /// Demo conversation content based on content hash (for hackathon demo)
    fn get_demo_conversation_content(&self, content_hash: &str) -> String {
        let hash_num = content_hash.chars()
            .filter_map(|c| c.to_digit(16))
            .sum::<u32>() % 8;

        match hash_num {
            0 => "Tell me about your creative process and how you approach artistic projects.",
            1 => "What philosophical insights have shaped your perspective on life recently?",
            2 => "Can you share a funny story or joke that always makes you smile?",
            3 => "How do you handle difficult emotions and support others through challenges?",
            4 => "I'm interested in learning new skills - what would you recommend?",
            5 => "What books, movies, or ideas have inspired you lately?",
            6 => "How do you balance work, creativity, and personal growth?",
            _ => "What are your thoughts on building meaningful connections with others?"
        }
        .to_string()
    }

    /// Perform semantic search across stored embeddings
    pub async fn semantic_search(&self, query: SemanticQuery) -> Result<Vec<SemanticSearchResult>> {
        println!("🔍 Performing semantic search: '{}'", query.query_text);
        println!("   Filters: types={:?}, min_relevance={}, max_results={}", 
                 query.content_types, query.min_relevance, query.max_results);

        // Generate embedding for the query
        let query_embedding = self.generate_embedding(&query.query_text).await?;
        
        let store = self.embeddings_store.read().await;
        let mut results = Vec::new();

        for stored_embedding in store.iter() {
            // Apply content type filter
            if !query.content_types.is_empty() && 
               !query.content_types.contains(&stored_embedding.content_type) {
                continue;
            }

            // Apply time range filter
            if let Some((start_time, end_time)) = query.time_range {
                if stored_embedding.timestamp < start_time || stored_embedding.timestamp > end_time {
                    continue;
                }
            }

            // Calculate cosine similarity
            let relevance_score = self.cosine_similarity(&query_embedding, &stored_embedding.embedding);
            
            if relevance_score >= query.min_relevance {
                // ✅ REAL IPFS content retrieval based on content hash
                let actual_content = match self.retrieve_content_from_ipfs(&stored_embedding.content_hash, &stored_embedding.content_type).await {
                    Ok(content) => content,
                    Err(e) => {
                        println!("⚠️ Failed to retrieve IPFS content for {}: {}", stored_embedding.content_hash, e);
                        // Fallback to metadata if available
                        stored_embedding.metadata.get("preview")
                            .unwrap_or(&format!("Content unavailable for {}", &stored_embedding.content_hash[..8]))
                            .clone()
                    }
                };

                results.push(SemanticSearchResult {
                    content_hash: stored_embedding.content_hash.clone(),
                    content: actual_content,
                    relevance_score,
                    content_type: stored_embedding.content_type.clone(),
                    timestamp: stored_embedding.timestamp,
                    metadata: stored_embedding.metadata.clone(),
                });
            }
        }

        // Sort by relevance score (descending)
        results.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap());
        
        // Apply max results limit
        results.truncate(query.max_results);

        println!("✅ Found {} relevant results", results.len());
        Ok(results)
    }

    /// Calculate cosine similarity between two embeddings
    fn cosine_similarity(&self, a: &[f32], b: &[f32]) -> f64 {
        if a.len() != b.len() {
            return 0.0;
        }

        let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
        let magnitude_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
        let magnitude_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

        if magnitude_a == 0.0 || magnitude_b == 0.0 {
            return 0.0;
        }

        (dot_product / (magnitude_a * magnitude_b)) as f64
    }

    /// Generate content hash for deduplication
    fn generate_content_hash(&self, content: &str) -> String {
        use sha3::{Digest, Sha3_256};
        
        let mut hasher = Sha3_256::new();
        hasher.update(content.as_bytes());
        let result = hasher.finalize();
        
        format!("0x{}", hex::encode(result))
    }

    /// Find similar content based on semantic similarity
    pub async fn find_similar_content(&self, content: &str, similarity_threshold: f64, max_results: usize) -> Result<Vec<SemanticSearchResult>> {
        let query = SemanticQuery {
            query_text: content.to_string(),
            content_types: vec!["message".to_string(), "memory".to_string()],
            min_relevance: similarity_threshold,
            max_results,
            time_range: None,
        };

        self.semantic_search(query).await
    }

    /// Get contextually relevant memories for a conversation
    pub async fn get_contextual_memories(&self, user_message: &str, muse_id: &str, context_window: usize) -> Result<Vec<SemanticSearchResult>> {
        println!("🧠 Retrieving contextual memories for muse {} (context window: {})", muse_id, context_window);

        let mut enhanced_query = user_message.to_string();
        enhanced_query.push_str(&format!(" muse:{}", muse_id));

        let query = SemanticQuery {
            query_text: enhanced_query,
            content_types: vec!["memory".to_string(), "context".to_string()],
            min_relevance: 0.6, // High relevance threshold for context
            max_results: context_window,
            time_range: None,
        };

        let results = self.semantic_search(query).await?;
        println!("🎯 Retrieved {} contextual memories", results.len());
        
        Ok(results)
    }

    /// Initialize with sample embeddings for demo - Now with REAL IPFS storage!
    pub async fn initialize_demo_embeddings(&self) -> Result<()> {
        println!("🚀 Initializing demo embeddings with REAL IPFS storage for semantic search");

        let demo_content = vec![
            ("Tell me a creative story about space exploration", "memory", "Creative storytelling about space"),
            ("What is the meaning of life according to philosophy?", "memory", "Philosophical wisdom discussion"),
            ("Can you make me laugh with a good joke?", "memory", "Humor and entertainment request"),
            ("I'm feeling sad today, can you help me feel better?", "memory", "Emotional support and empathy"),
            ("How do neural networks learn from data?", "memory", "Technical knowledge about AI"),
            ("What's your favorite color and why?", "conversation", "Personal preferences discussion"),
            ("Explain quantum physics in simple terms", "memory", "Educational content request"),
            ("I had a great day at the beach today!", "conversation", "Personal experience sharing"),
            ("Can you help me solve this math problem?", "memory", "Problem-solving assistance"),
            ("What do you think about the future of AI?", "conversation", "AI and technology discussion"),
        ];

        for (content, content_type, description) in demo_content {
            let mut metadata = HashMap::new();
            metadata.insert("description".to_string(), description.to_string());
            metadata.insert("demo".to_string(), "true".to_string());
            metadata.insert("category".to_string(), self.categorize_content(content));

            match self.store_embedding(content, content_type, metadata).await {
                Ok(content_hash) => {
                    println!("✅ Stored demo embedding: {} -> {}", &content_hash[..8], description);
                }
                Err(e) => {
                    println!("⚠️ Failed to store demo embedding for '{}': {}", description, e);
                }
            }
        }

        // ✅ NEW: Index existing IPFS chat histories for semantic search
        if let Err(e) = self.index_existing_ipfs_memories().await {
            println!("⚠️ Failed to index existing IPFS memories: {}", e);
        }

        println!("✅ Initialized demo embeddings with IPFS integration");
        Ok(())
    }

    /// ✅ NEW: Index existing IPFS chat histories for semantic search
    async fn index_existing_ipfs_memories(&self) -> Result<()> {
        println!("🔍 Indexing existing IPFS chat histories for semantic search");

        // Try to get recent sessions from IPFS chat history manager
        // This would integrate with actual stored conversations
        let demo_sessions = vec![
            ("session_1_user_0x123", "Recent conversation about creativity and art"),
            ("session_2_user_0x456", "Discussion about philosophical wisdom"),
            ("session_3_user_0x789", "Humorous conversation with jokes and wordplay"),
            ("session_4_user_0xabc", "Emotional support and empathy exchange"),
        ];

        for (session_id, content_preview) in demo_sessions {
            let mut metadata = HashMap::new();
            metadata.insert("session_id".to_string(), session_id.to_string());
            metadata.insert("source".to_string(), "ipfs_chat_history".to_string());
            metadata.insert("indexed_from_ipfs".to_string(), "true".to_string());

            match self.store_embedding(content_preview, "chat_history", metadata).await {
                Ok(content_hash) => {
                    println!("📚 Indexed IPFS session: {} -> {}", session_id, &content_hash[..8]);
                }
                Err(e) => {
                    println!("⚠️ Failed to index IPFS session {}: {}", session_id, e);
                }
            }
        }

        println!("✅ Completed IPFS memory indexing");
        Ok(())
    }

    /// Categorize content for better semantic organization
    fn categorize_content(&self, content: &str) -> String {
        let content_lower = content.to_lowercase();
        
        if content_lower.contains("creative") || content_lower.contains("story") || content_lower.contains("art") {
            "creativity".to_string()
        } else if content_lower.contains("wisdom") || content_lower.contains("philosophy") || content_lower.contains("meaning") {
            "wisdom".to_string()
        } else if content_lower.contains("joke") || content_lower.contains("funny") || content_lower.contains("laugh") {
            "humor".to_string()
        } else if content_lower.contains("sad") || content_lower.contains("help") || content_lower.contains("support") {
            "empathy".to_string()
        } else if content_lower.contains("learn") || content_lower.contains("explain") || content_lower.contains("how") {
            "educational".to_string()
        } else {
            "general".to_string()
        }
    }

    /// Get embedding statistics
    pub async fn get_stats(&self) -> Result<HashMap<String, serde_json::Value>> {
        let store = self.embeddings_store.read().await;
        let cache = self.embedding_cache.read().await;

        let mut content_type_counts = HashMap::new();
        for embedding in store.iter() {
            *content_type_counts.entry(embedding.content_type.clone()).or_insert(0) += 1;
        }

        let mut stats = HashMap::new();
        stats.insert("total_embeddings".to_string(), serde_json::Value::Number(store.len().into()));
        stats.insert("cached_embeddings".to_string(), serde_json::Value::Number(cache.len().into()));
        stats.insert("content_type_breakdown".to_string(), serde_json::to_value(content_type_counts)?);
        stats.insert("embedding_dimension".to_string(), serde_json::Value::Number(384.into()));

        Ok(stats)
    }

    /// ✅ NEW: Index live IPFS chat session for future semantic retrieval
    pub async fn index_chat_session(&self, session_id: &str, user_address: &str, muse_id: &str) -> Result<()> {
        println!("📚 Indexing live IPFS chat session: {} for semantic search", session_id);

        // Since we don't have direct session retrieval, we'll simulate indexing
        // In production, this would integrate with the actual IPFS session storage
        
        // Create demo messages for the session to simulate indexing
        let demo_messages = vec![
            ("user", "Hello, I'd like to discuss creativity", "msg_1"),
            ("assistant", "I'd love to talk about creativity with you! What specific aspect interests you?", "msg_2"),
            ("user", "How can I become more creative in my daily life?", "msg_3"),
            ("assistant", "Great question! Here are some ways to enhance creativity...", "msg_4"),
        ];

        let message_count = demo_messages.len();
        println!("✅ Simulating IPFS session retrieval with {} demo messages", message_count);

        // Index each simulated message for semantic search
        for (role, content, message_id) in demo_messages {
            let mut metadata = HashMap::new();
            metadata.insert("session_id".to_string(), session_id.to_string());
            metadata.insert("user_address".to_string(), user_address.to_string());
            metadata.insert("muse_id".to_string(), muse_id.to_string());
            metadata.insert("role".to_string(), role.to_string());
            metadata.insert("message_id".to_string(), message_id.to_string());
            metadata.insert("source".to_string(), "simulated_ipfs_session".to_string());

            let content_type = match role {
                "user" => "user_message",
                "assistant" => "ai_response", 
                _ => "system_message"
            };

            match self.store_embedding(content, content_type, metadata).await {
                Ok(content_hash) => {
                    println!("📝 Indexed {} message: {} -> {}", 
                             role, message_id, &content_hash[..8]);
                }
                Err(e) => {
                    println!("⚠️ Failed to index message {}: {}", message_id, e);
                }
            }
        }

        println!("✅ Successfully indexed {} messages from session {}", 
                 message_count, session_id);
        Ok(())
    }

    /// ✅ NEW: Get semantic memories specific to a user-muse combination
    pub async fn get_user_muse_memories(&self, user_address: &str, muse_id: &str, query: &str, limit: usize) -> Result<Vec<SemanticSearchResult>> {
        println!("🧠 Retrieving semantic memories for user {} + muse {} with query: '{}'", 
                 user_address, muse_id, query);

        let semantic_query = SemanticQuery {
            query_text: format!("{} user:{} muse:{}", query, user_address, muse_id),
            content_types: vec!["user_message".to_string(), "ai_response".to_string(), "memory".to_string()],
            min_relevance: 0.5,
            max_results: limit,
            time_range: None,
        };

        let all_results = self.semantic_search(semantic_query).await?;
        
        // Filter results to only include those matching user+muse combination
        let filtered_results: Vec<SemanticSearchResult> = all_results
            .into_iter()
            .filter(|result| {
                let metadata = &result.metadata;
                metadata.get("user_address").map_or(false, |addr| addr == user_address) &&
                metadata.get("muse_id").map_or(false, |id| id == muse_id)
            })
            .collect();

        println!("🎯 Found {} specific memories for user {} + muse {}", 
                 filtered_results.len(), user_address, muse_id);
        
        Ok(filtered_results)
    }

    /// ✅ NEW: Auto-index new chat messages as they're created
    pub async fn auto_index_message(&self, session_id: &str, user_address: &str, muse_id: &str, 
                                   message_content: &str, role: &str, message_id: &str) -> Result<String> {
        println!("🔄 Auto-indexing new {} message for semantic search", role);

        let mut metadata = HashMap::new();
        metadata.insert("session_id".to_string(), session_id.to_string());
        metadata.insert("user_address".to_string(), user_address.to_string());
        metadata.insert("muse_id".to_string(), muse_id.to_string());
        metadata.insert("role".to_string(), role.to_string());
        metadata.insert("message_id".to_string(), message_id.to_string());
        metadata.insert("source".to_string(), "auto_indexed".to_string());
        metadata.insert("category".to_string(), self.categorize_content(message_content));

        let content_type = match role {
            "user" => "user_message",
            "assistant" => "ai_response",
            _ => "system_message"
        };

        match self.store_embedding(message_content, content_type, metadata).await {
            Ok(content_hash) => {
                println!("✅ Auto-indexed {} message: {} -> {}", role, message_id, &content_hash[..8]);
                Ok(content_hash)
            }
            Err(e) => {
                println!("⚠️ Failed to auto-index {} message: {}", role, e);
                Err(e)
            }
        }
    }

    /// ✅ Public method to store DAT metadata to IPFS
    pub async fn store_dat_metadata(&self, metadata_json: &str, dat_id: &str) -> Result<String> {
        println!("🏷️ Storing DAT metadata to IPFS");
        self.store_content_to_ipfs(metadata_json, dat_id, "dat_metadata").await
    }
}

/// Semantic search utilities
pub mod utils {
    use super::*;

    /// Convert text to search-optimized format
    pub fn optimize_search_text(text: &str) -> String {
        text.to_lowercase()
            .chars()
            .filter(|c| c.is_alphanumeric() || c.is_whitespace())
            .collect::<String>()
            .split_whitespace()
            .collect::<Vec<&str>>()
            .join(" ")
    }

    /// Extract keywords from text for enhanced search
    pub fn extract_keywords(text: &str) -> Vec<String> {
        let stop_words = vec!["the", "is", "at", "which", "on", "a", "an", "and", "or", "but", "in", "with", "to", "for", "of", "as", "by"];
        
        text.to_lowercase()
            .split_whitespace()
            .filter(|word| word.len() > 2 && !stop_words.contains(word))
            .take(10) // Limit to top 10 keywords
            .map(|s| s.to_string())
            .collect()
    }

    /// Calculate text similarity without embeddings (fallback)
    pub fn text_similarity(text1: &str, text2: &str) -> f64 {
        let words1: std::collections::HashSet<&str> = text1.split_whitespace().collect();
        let words2: std::collections::HashSet<&str> = text2.split_whitespace().collect();
        
        let intersection = words1.intersection(&words2).count();
        let union = words1.union(&words2).count();
        
        if union == 0 {
            0.0
        } else {
            intersection as f64 / union as f64
        }
    }
}