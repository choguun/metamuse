// Enhanced Memory API Routes
// This shows the additional endpoints needed for the enhanced memory system

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json, Router,
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::{AppState, persist_memory::{MemoryCategory, RetentionPriority}};

#[derive(Debug, Deserialize)]
pub struct EnhancedMemoryQuery {
    pub limit: Option<usize>,
    pub category: Option<String>,
    pub tags: Option<String>, // comma-separated
    pub min_importance: Option<f32>,
    pub search: Option<String>,
    pub search_type: Option<String>, // "semantic" | "keyword"
}

#[derive(Debug, Serialize)]
pub struct EnhancedMemoryResponse {
    pub memories: Vec<MemoryEntry>,
    pub stats: MemoryStats,
    pub has_more: bool,
}

#[derive(Debug, Serialize)]
pub struct MemoryEntry {
    pub id: String,
    pub content: String,
    pub ai_response: String,
    pub importance: f32,
    pub timestamp: u64,
    pub category: String,
    pub tags: Vec<String>,
    pub emotional_tone: Option<EmotionalToneInfo>,
    pub ipfs_hash: Option<String>,
    pub access_count: u32,
    pub retention_priority: String,
}

#[derive(Debug, Serialize)]
pub struct EmotionalToneInfo {
    pub sentiment: f32,
    pub emotions: Vec<(String, f32)>,
    pub energy_level: f32,
}

#[derive(Debug, Serialize)]
pub struct MemoryStats {
    pub total_memories: usize,
    pub average_importance: f32,
    pub category_breakdown: std::collections::HashMap<String, usize>,
    pub top_tags: std::collections::HashMap<String, usize>,
    pub emotional_distribution: std::collections::HashMap<String, f32>,
}

// Additional routes for enhanced memory system
pub fn enhanced_memory_routes() -> Router<Arc<AppState>> {
    Router::new()
        // Enhanced memory retrieval with filtering
        .route("/api/v1/muses/{id}/memories/enhanced", get(get_enhanced_memories))
        
        // Search memories by different criteria
        .route("/api/v1/muses/{id}/memories/search", get(search_memories))
        .route("/api/v1/muses/{id}/memories/semantic", get(semantic_search_memories))
        
        // Category-specific retrieval
        .route("/api/v1/muses/{id}/memories/category/{category}", get(get_memories_by_category))
        
        // Tag operations
        .route("/api/v1/muses/{id}/memories/tags", get(get_memory_tags))
        .route("/api/v1/muses/{id}/memories/tagged/{tag}", get(get_memories_by_tag))
        
        // Importance-based filtering
        .route("/api/v1/muses/{id}/memories/important", get(get_important_memories))
        
        // Enhanced statistics
        .route("/api/v1/muses/{id}/memories/stats", get(get_enhanced_memory_stats))
        
        // Memory timeline
        .route("/api/v1/muses/{id}/memories/timeline", get(get_memory_timeline))
}

// Enhanced memory retrieval with all filtering options
async fn get_enhanced_memories(
    Path(muse_id): Path<String>,
    Query(query): Query<EnhancedMemoryQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let limit = query.limit.unwrap_or(20);
    
    // Parse tags if provided
    let tags: Vec<String> = query.tags
        .map(|t| t.split(',').map(|s| s.trim().to_string()).collect())
        .unwrap_or_default();
    
    // Get memories based on query parameters
    let memories = if !tags.is_empty() {
        state.memory_system.search_by_tags(&muse_id, &tags, limit).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else if let Some(category_str) = &query.category {
        let category = match category_str.as_str() {
            "emotional" => MemoryCategory::Emotional,
            "learning" => MemoryCategory::Learning,
            "creative" => MemoryCategory::Creative,
            "problem_solving" => MemoryCategory::ProblemSolving,
            "personal" => MemoryCategory::Personal,
            "factual" => MemoryCategory::Factual,
            _ => MemoryCategory::Conversation,
        };
        state.memory_system.search_by_category(&muse_id, &category, limit).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else if let Some(min_importance) = query.min_importance {
        state.memory_system.get_important_memories(&muse_id, min_importance, limit).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else if let Some(search_query) = &query.search {
        match query.search_type.as_deref() {
            Some("semantic") => state.memory_system.semantic_search(&muse_id, search_query, limit).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
            _ => {
                // For keyword search, return empty for now (needs proper implementation)
                Vec::new()
            }
        }
    } else {
        // Get recent memory objects with enhanced metadata
        state.memory_system.get_recent_memory_objects(&muse_id, limit).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    };
    
    // Convert to response format
    let memory_entries: Vec<MemoryEntry> = memories.into_iter().map(|m| MemoryEntry {
        id: m.memory_id,
        content: m.interaction_data.user_prompt,
        ai_response: m.interaction_data.ai_response,
        importance: m.importance,
        timestamp: m.timestamp,
        category: m.category.to_string(),
        tags: m.tags,
        emotional_tone: m.emotional_tone.map(|et| EmotionalToneInfo {
            sentiment: et.sentiment,
            emotions: et.emotions,
            energy_level: et.energy_level,
        }),
        ipfs_hash: m.ipfs_hash,
        access_count: m.access_count,
        retention_priority: format!("{:?}", m.retention_priority),
    }).collect();
    
    // Get enhanced statistics
    let stats_json = state.memory_system.get_enhanced_stats(&muse_id).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let stats = MemoryStats {
        total_memories: stats_json["total_memories"].as_u64().unwrap_or(0) as usize,
        average_importance: stats_json["average_importance"].as_f64().unwrap_or(0.0) as f32,
        category_breakdown: serde_json::from_value(stats_json["category_breakdown"].clone()).unwrap_or_default(),
        top_tags: serde_json::from_value(stats_json["top_tags"].clone()).unwrap_or_default(),
        emotional_distribution: std::collections::HashMap::new(), // TODO: Implement
    };
    
    let response = EnhancedMemoryResponse {
        memories: memory_entries,
        stats,
        has_more: false, // TODO: Implement pagination
    };
    
    Ok((StatusCode::OK, Json(response)))
}

// Semantic search endpoint
async fn semantic_search_memories(
    Path(muse_id): Path<String>,
    Query(query): Query<EnhancedMemoryQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let search_query = query.search.ok_or(StatusCode::BAD_REQUEST)?;
    let limit = query.limit.unwrap_or(10);
    
    let memories = state.memory_system
        .semantic_search(&muse_id, &search_query, limit)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let memory_entries: Vec<MemoryEntry> = memories.into_iter().map(|m| MemoryEntry {
        id: m.memory_id,
        content: m.interaction_data.user_prompt,
        ai_response: m.interaction_data.ai_response,
        importance: m.importance,
        timestamp: m.timestamp,
        category: m.category.to_string(),
        tags: m.tags,
        emotional_tone: m.emotional_tone.map(|et| EmotionalToneInfo {
            sentiment: et.sentiment,
            emotions: et.emotions,
            energy_level: et.energy_level,
        }),
        ipfs_hash: m.ipfs_hash,
        access_count: m.access_count,
        retention_priority: format!("{:?}", m.retention_priority),
    }).collect();
    
    Ok((StatusCode::OK, Json(memory_entries)))
}

// Get memories by category
async fn get_memories_by_category(
    Path((muse_id, category)): Path<(String, String)>,
    Query(query): Query<EnhancedMemoryQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let limit = query.limit.unwrap_or(20);
    
    let category_enum = match category.as_str() {
        "emotional" => MemoryCategory::Emotional,
        "learning" => MemoryCategory::Learning,
        "creative" => MemoryCategory::Creative,
        "problem_solving" => MemoryCategory::ProblemSolving,
        "personal" => MemoryCategory::Personal,
        "factual" => MemoryCategory::Factual,
        _ => MemoryCategory::Conversation,
    };
    
    let memories = state.memory_system
        .search_by_category(&muse_id, &category_enum, limit)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let memory_entries: Vec<MemoryEntry> = memories.into_iter().map(|m| MemoryEntry {
        id: m.memory_id,
        content: m.interaction_data.user_prompt,
        ai_response: m.interaction_data.ai_response,
        importance: m.importance,
        timestamp: m.timestamp,
        category: m.category.to_string(),
        tags: m.tags,
        emotional_tone: m.emotional_tone.map(|et| EmotionalToneInfo {
            sentiment: et.sentiment,
            emotions: et.emotions,
            energy_level: et.energy_level,
        }),
        ipfs_hash: m.ipfs_hash,
        access_count: m.access_count,
        retention_priority: format!("{:?}", m.retention_priority),
    }).collect();
    
    Ok((StatusCode::OK, Json(memory_entries)))
}

// Get all available tags for a muse
async fn get_memory_tags(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let stats = state.memory_system.get_enhanced_stats(&muse_id).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let tags = stats["top_tags"].as_object()
        .map(|obj| obj.keys().cloned().collect::<Vec<_>>())
        .unwrap_or_default();
    
    Ok((StatusCode::OK, Json(serde_json::json!({ "tags": tags }))))
}

// Get enhanced memory statistics
async fn get_enhanced_memory_stats(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let stats = state.memory_system.get_enhanced_stats(&muse_id).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok((StatusCode::OK, Json(stats)))
}

// Get memory timeline (simplified)
async fn get_memory_timeline(
    Path(muse_id): Path<String>,
    Query(query): Query<EnhancedMemoryQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let limit = query.limit.unwrap_or(50);
    
    // Get recent memories for timeline
    let memories = state.memory_system.get_recent_memories(&muse_id, limit).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // Group by date for timeline view
    let timeline = serde_json::json!({
        "timeline": memories,
        "total_days": 7 // Simplified
    });
    
    Ok((StatusCode::OK, Json(timeline)))
}

// Placeholder implementations for other endpoints
async fn search_memories(
    Path(muse_id): Path<String>,
    Query(query): Query<EnhancedMemoryQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    get_enhanced_memories(Path(muse_id), Query(query), State(state)).await
}

async fn get_memories_by_tag(
    Path((muse_id, tag)): Path<(String, String)>,
    Query(query): Query<EnhancedMemoryQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let limit = query.limit.unwrap_or(20);
    let tags = vec![tag];
    
    let memories = state.memory_system
        .search_by_tags(&muse_id, &tags, limit)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let memory_entries: Vec<MemoryEntry> = memories.into_iter().map(|m| MemoryEntry {
        id: m.memory_id,
        content: m.interaction_data.user_prompt,
        ai_response: m.interaction_data.ai_response,
        importance: m.importance,
        timestamp: m.timestamp,
        category: m.category.to_string(),
        tags: m.tags,
        emotional_tone: m.emotional_tone.map(|et| EmotionalToneInfo {
            sentiment: et.sentiment,
            emotions: et.emotions,
            energy_level: et.energy_level,
        }),
        ipfs_hash: m.ipfs_hash,
        access_count: m.access_count,
        retention_priority: format!("{:?}", m.retention_priority),
    }).collect();
    
    Ok((StatusCode::OK, Json(memory_entries)))
}

async fn get_important_memories(
    Path(muse_id): Path<String>,
    Query(query): Query<EnhancedMemoryQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let limit = query.limit.unwrap_or(20);
    let min_importance = query.min_importance.unwrap_or(0.7);
    
    let memories = state.memory_system
        .get_important_memories(&muse_id, min_importance, limit)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let memory_entries: Vec<MemoryEntry> = memories.into_iter().map(|m| MemoryEntry {
        id: m.memory_id,
        content: m.interaction_data.user_prompt,
        ai_response: m.interaction_data.ai_response,
        importance: m.importance,
        timestamp: m.timestamp,
        category: m.category.to_string(),
        tags: m.tags,
        emotional_tone: m.emotional_tone.map(|et| EmotionalToneInfo {
            sentiment: et.sentiment,
            emotions: et.emotions,
            energy_level: et.energy_level,
        }),
        ipfs_hash: m.ipfs_hash,
        access_count: m.access_count,
        retention_priority: format!("{:?}", m.retention_priority),
    }).collect();
    
    Ok((StatusCode::OK, Json(memory_entries)))
}