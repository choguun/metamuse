use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::RwLock;
use crate::config::Config;
use alith::data::storage::{DataStorage, PinataIPFS, UploadOptions};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MuseMemory {
    pub muse_id: String,
    pub interaction_data: InteractionData,
    pub embedding: Option<Vec<f32>>,
    pub importance: f32,
    pub timestamp: u64,
    pub ipfs_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionData {
    pub user_prompt: String,
    pub ai_response: String,
    pub personality_traits: crate::muse_orchestrator::MuseTraits,
    pub context_used: Vec<String>,
}

pub struct MemorySystem {
    // In-memory storage for quick access
    memories: RwLock<HashMap<String, Vec<MuseMemory>>>,
    config: Config,
    ipfs_client: Option<PinataIPFS>,
}

impl MemorySystem {
    pub async fn new(config: &Config) -> Result<Self> {
        let ipfs_client = if config.ipfs_api_key.is_some() {
            Some(PinataIPFS::default())
        } else {
            None
        };
        
        Ok(Self {
            memories: RwLock::new(HashMap::new()),
            config: config.clone(),
            ipfs_client,
        })
    }
    
    pub async fn store_interaction_memory(
        &self,
        muse_id: &str,
        interaction: &InteractionData,
    ) -> Result<String> {
        let mut memory = MuseMemory {
            muse_id: muse_id.to_string(),
            interaction_data: interaction.clone(),
            embedding: None, // Would generate embedding here
            importance: self.calculate_importance(interaction),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_secs(),
            ipfs_hash: None,
        };
        
        // Upload to IPFS if configured
        if let (Some(ipfs_client), Some(api_key)) = (&self.ipfs_client, &self.config.ipfs_api_key) {
            let memory_json = serde_json::to_vec(&memory)?;
            let file_name = format!("muse_{}_memory_{}.json", muse_id, memory.timestamp);
            
            let file_meta = ipfs_client.upload(
                UploadOptions::builder()
                    .data(memory_json)
                    .name(file_name)
                    .token(api_key.clone())
                    .build(),
            ).await?;
            
            memory.ipfs_hash = Some(file_meta.id);
        }
        
        // Store in memory
        let mut memories = self.memories.write().await;
        memories.entry(muse_id.to_string())
            .or_insert_with(Vec::new)
            .push(memory.clone());
        
        Ok(format!("memory_{}__{}", muse_id, memory.timestamp))
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
}