use axum::{
    extract::{Path, State, Json, Query},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{AppState, persist_memory::InteractionData, muse_orchestrator::MuseTraits};

// Request/Response types
#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    pub message: String,
    pub user_address: String,
    pub context_window: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct ChatResponse {
    pub response: String,
    pub commitment_hash: String,
    pub signature: String,
    pub timestamp: u64,
    pub metadata: ResponseMetadata,
}

#[derive(Debug, Serialize)]
pub struct ResponseMetadata {
    pub inference_time_ms: u64,
    pub model_version: String,
    pub memory_updated: bool,
    pub traits_used: MuseTraits,
}

#[derive(Debug, Deserialize)]
pub struct MuseCreateRequest {
    pub creativity: u8,
    pub wisdom: u8,
    pub humor: u8,
    pub empathy: u8,
}

#[derive(Debug, Serialize)]
pub struct MuseCreateResponse {
    pub muse_id: String,
    pub dna_hash: String,
    pub traits: MuseTraits,
    pub preparation_complete: bool,
}

#[derive(Debug, Deserialize)]
pub struct MemoryQuery {
    pub limit: Option<usize>,
    pub context: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct MemoryResponse {
    pub memories: Vec<String>,
    pub total_count: usize,
    pub avg_importance: f32,
}

#[derive(Debug, Deserialize)]
pub struct VerificationRequest {
    pub muse_id: String,
    pub commitment_hash: String,
    pub interaction_data: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct VerificationResponse {
    pub success: bool,
    pub signature: Option<String>,
    pub verification_hash: Option<String>,
}

// Route implementations
pub fn muse_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/v1/muses/prepare", post(prepare_muse))
        .route("/api/v1/muses/:id", get(get_muse))
        .route("/api/v1/muses", post(create_muse))
}

pub fn chat_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/v1/muses/:id/chat", post(handle_chat))
}

pub fn memory_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/v1/muses/:id/memories", get(get_memories))
        .route("/api/v1/muses/:id/memories", post(store_memory))
}

pub fn plugin_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/v1/plugins", get(list_plugins))
        .route("/api/v1/muses/:id/plugins", get(get_muse_plugins))
        .route("/api/v1/muses/:id/plugins/:plugin_id/install", post(install_plugin))
        .route("/api/v1/plugins/:id/execute", post(execute_plugin))
}

pub fn verification_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/v1/verify", post(verify_interaction))
}

// Muse management handlers
async fn prepare_muse(
    State(state): State<Arc<AppState>>,
    Json(request): Json<MuseCreateRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    // Validate traits
    if request.creativity > 100 || request.wisdom > 100 || 
       request.humor > 100 || request.empathy > 100 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let traits = MuseTraits {
        creativity: request.creativity,
        wisdom: request.wisdom,
        humor: request.humor,
        empathy: request.empathy,
    };

    // Generate unique muse ID (in production, this would be from blockchain)
    let muse_id = format!("muse_{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs());
    
    // Generate DNA hash (simplified)
    let dna_data = format!("{}{}{}{}{}", 
        request.creativity, request.wisdom, request.humor, request.empathy, muse_id);
    let dna_hash = format!("0x{:x}", md5::compute(dna_data.as_bytes()));

    // Pre-initialize the AI agents for this muse
    let _ = state.orchestrator
        .get_or_create_agents(&muse_id, &traits)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = MuseCreateResponse {
        muse_id,
        dna_hash,
        traits,
        preparation_complete: true,
    };

    Ok((StatusCode::OK, Json(response)))
}

async fn get_muse(
    Path(muse_id): Path<String>,
    State(_state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    // In production, this would query the blockchain
    // For now, return mock data if the muse exists in our orchestrator
    
    let response = serde_json::json!({
        "muse_id": muse_id,
        "owner": "0x742d35Cc6634C0532925a3b8D9C072a8c0c8E8C1",
        "traits": {
            "creativity": 75,
            "wisdom": 60,
            "humor": 85,
            "empathy": 70
        },
        "birth_block": 12345678,
        "total_interactions": 42,
        "last_interaction_time": 1640995200,
        "dna_hash": "0x1234567890abcdef"
    });

    Ok((StatusCode::OK, Json(response)))
}

async fn create_muse(
    State(state): State<Arc<AppState>>,
    Json(request): Json<MuseCreateRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    // This would interact with the blockchain to actually create the NFT
    // For now, just prepare the muse
    prepare_muse(State(state), Json(request)).await
}

// Chat handlers
async fn handle_chat(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(request): Json<ChatRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let start_time = std::time::Instant::now();
    
    // Get muse traits (in production, from blockchain)
    let traits = MuseTraits {
        creativity: 75,
        wisdom: 60,
        humor: 85,
        empathy: 70,
    };

    // Retrieve context if requested
    let context = if let Some(window) = request.context_window {
        state.memory_system
            .get_recent_memories(&muse_id, window)
            .await
            .unwrap_or_default()
    } else {
        Vec::new()
    };

    // Generate AI response
    let ai_response = state.orchestrator
        .generate_response(&muse_id, &traits, &request.message, Some(context.clone()))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let inference_time = start_time.elapsed().as_millis() as u64;

    // Create interaction data for memory storage
    let interaction = InteractionData {
        user_prompt: request.message.clone(),
        ai_response: ai_response.clone(),
        personality_traits: traits.clone(),
        context_used: context,
    };

    // Store memory
    let memory_updated = state.memory_system
        .store_interaction_memory(&muse_id, &interaction)
        .await
        .is_ok();

    // Create commitment hash (simplified - in production would be proper cryptographic hash)
    let commitment_data = format!("{}{}{}", muse_id, request.message, ai_response);
    let commitment_hash = format!("0x{:x}", md5::compute(commitment_data.as_bytes()));

    // Generate signature (mock - in production would use proper cryptographic signing)
    let signature = format!("0x{}", "a".repeat(130)); // Mock 65-byte signature as hex

    let response = ChatResponse {
        response: ai_response,
        commitment_hash,
        signature,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        metadata: ResponseMetadata {
            inference_time_ms: inference_time,
            model_version: "gpt-4-alith".to_string(),
            memory_updated,
            traits_used: traits,
        },
    };

    Ok((StatusCode::OK, Json(response)))
}

// Memory handlers
async fn get_memories(
    Path(muse_id): Path<String>,
    Query(query): Query<MemoryQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let limit = query.limit.unwrap_or(10);
    
    let memories = if let Some(context) = query.context {
        state.memory_system
            .get_contextual_memories(&muse_id, &context, limit)
            .await
    } else {
        state.memory_system
            .get_recent_memories(&muse_id, limit)
            .await
    }.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let (total_count, avg_importance) = state.memory_system
        .get_memory_stats(&muse_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = MemoryResponse {
        memories,
        total_count,
        avg_importance,
    };

    Ok((StatusCode::OK, Json(response)))
}

async fn store_memory(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(interaction): Json<InteractionData>,
) -> Result<impl IntoResponse, StatusCode> {
    let memory_id = state.memory_system
        .store_interaction_memory(&muse_id, &interaction)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = serde_json::json!({
        "success": true,
        "memory_id": memory_id
    });

    Ok((StatusCode::OK, Json(response)))
}

// Plugin handlers
async fn list_plugins(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let stats = state.plugin_system
        .get_plugin_stats()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::OK, Json(stats)))
}

async fn get_muse_plugins(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let plugins = state.plugin_system
        .get_muse_plugins(&muse_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::OK, Json(plugins)))
}

async fn install_plugin(
    Path((muse_id, plugin_id)): Path<(String, String)>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    state.plugin_system
        .install_plugin_for_muse(&muse_id, &plugin_id)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let response = serde_json::json!({
        "success": true,
        "muse_id": muse_id,
        "plugin_id": plugin_id
    });

    Ok((StatusCode::OK, Json(response)))
}

async fn execute_plugin(
    Path(plugin_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(input): Json<serde_json::Value>,
) -> Result<impl IntoResponse, StatusCode> {
    let execution = state.plugin_system
        .execute_plugin(&plugin_id, input)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::OK, Json(execution)))
}

// Verification handlers
async fn verify_interaction(
    State(_state): State<Arc<AppState>>,
    Json(request): Json<VerificationRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    // In production, this would:
    // 1. Validate the commitment hash
    // 2. Create proper cryptographic signature
    // 3. Submit to blockchain for verification
    
    // Mock response for now
    let response = VerificationResponse {
        success: true,
        signature: Some(format!("0x{}", "b".repeat(130))),
        verification_hash: Some(request.commitment_hash),
    };

    Ok((StatusCode::OK, Json(response)))
}