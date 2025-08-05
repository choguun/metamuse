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
        
        let vector_embedding = VectorEmbedding {
            content_hash: content_hash.clone(),
            embedding,
            content_type: content_type.to_string(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            metadata,
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

        println!("📦 Stored embedding for content hash: {}", content_hash);
        Ok(content_hash)
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
                // Mock content retrieval - in production this would fetch from IPFS
                let mock_content = format!("Content for hash {} with {} relevance", 
                                          &stored_embedding.content_hash[..8], 
                                          (relevance_score * 100.0) as i32);

                results.push(SemanticSearchResult {
                    content_hash: stored_embedding.content_hash.clone(),
                    content: mock_content,
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

    /// Initialize with sample embeddings for demo
    pub async fn initialize_demo_embeddings(&self) -> Result<()> {
        println!("🚀 Initializing demo embeddings for semantic search");

        let demo_content = vec![
            ("Tell me a creative story about space exploration", "memory", "Creative storytelling about space"),
            ("What is the meaning of life according to philosophy?", "memory", "Philosophical wisdom discussion"),
            ("Can you make me laugh with a good joke?", "memory", "Humor and entertainment request"),
            ("I'm feeling sad today, can you help me feel better?", "memory", "Emotional support and empathy"),
            ("How do neural networks learn from data?", "memory", "Technical knowledge about AI"),
            ("What's your favorite color and why?", "memory", "Personal preferences discussion"),
            ("Explain quantum physics in simple terms", "memory", "Educational content request"),
            ("I had a great day at the beach today!", "memory", "Personal experience sharing"),
            ("Can you help me solve this math problem?", "memory", "Problem-solving assistance"),
            ("What do you think about the future of AI?", "memory", "AI and technology discussion"),
        ];

        for (content, content_type, description) in demo_content {
            let mut metadata = HashMap::new();
            metadata.insert("description".to_string(), description.to_string());
            metadata.insert("demo".to_string(), "true".to_string());

            self.store_embedding(content, content_type, metadata).await?;
        }

        println!("✅ Initialized {} demo embeddings", 10);
        Ok(())
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