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
        .route("/api/v1/muses/:id/events", get(get_muse_events))
        .route("/api/v1/blockchain/balance", get(get_account_balance))
        .route("/api/v1/blockchain/gas-price", get(get_gas_price))
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

    // Pre-initialize the AI agents for this muse (using temporary ID for preparation)
    let temp_muse_id = format!("temp_muse_{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs());
    
    let _ = state.orchestrator
        .get_or_create_agents(&temp_muse_id, &traits)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = MuseCreateResponse {
        muse_id: "pending_blockchain_creation".to_string(),
        dna_hash: "pending_blockchain_creation".to_string(),
        traits,
        preparation_complete: true,
    };

    Ok((StatusCode::OK, Json(response)))
}

async fn get_muse(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    // Parse muse ID as token ID
    let token_id: u64 = muse_id.parse()
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    // Get muse data from blockchain
    let muse_data = state.blockchain_client
        .get_muse_data(token_id)
        .await
        .map_err(|e| {
            println!("Failed to get muse data: {:?}", e);
            StatusCode::NOT_FOUND
        })?;

    let response = serde_json::json!({
        "muse_id": muse_data.token_id,
        "owner": muse_data.owner,
        "traits": {
            "creativity": muse_data.creativity,
            "wisdom": muse_data.wisdom,
            "humor": muse_data.humor,
            "empathy": muse_data.empathy
        },
        "birth_block": muse_data.birth_block,
        "total_interactions": muse_data.total_interactions,
        "dna_hash": muse_data.dna_hash
    });

    Ok((StatusCode::OK, Json(response)))
}

async fn create_muse(
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

    // Create the NFT on the blockchain
    let (token_id, _tx_info) = state.blockchain_client
        .create_muse(&traits)
        .await
        .map_err(|e| {
            println!("Blockchain error: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // Get the muse data from blockchain (includes DNA hash)
    let muse_data = state.blockchain_client
        .get_muse_data(token_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Pre-initialize the AI agents for this muse
    let muse_id = token_id.to_string();
    let _ = state.orchestrator
        .get_or_create_agents(&muse_id, &traits)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = MuseCreateResponse {
        muse_id: muse_data.token_id.to_string(),
        dna_hash: muse_data.dna_hash,
        traits,
        preparation_complete: true,
    };

    Ok((StatusCode::OK, Json(response)))
}

// Chat handlers
async fn handle_chat(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(request): Json<ChatRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let start_time = std::time::Instant::now();
    
    // Parse muse ID and get traits from blockchain
    let token_id: u64 = muse_id.parse()
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    let muse_data = state.blockchain_client
        .get_muse_data(token_id)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;
    
    let traits = MuseTraits {
        creativity: muse_data.creativity,
        wisdom: muse_data.wisdom,
        humor: muse_data.humor,
        empathy: muse_data.empathy,
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

    // Create verifiable interaction for cryptographic verification
    let verifiable_interaction = state.verification_system
        .create_interaction_from_data(
            token_id,
            hex::decode(&muse_data.dna_hash[2..])
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
                .try_into()
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
            &interaction,
        );

    // Create commitment and signature
    let commitment = state.verification_system
        .create_commitment(&verifiable_interaction)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let commitment_hash = hex::encode(commitment.commitment_hash);
    let signature = hex::encode(&commitment.signature);

    // Commit interaction to blockchain (optional - for full transparency)
    let _commit_tx = state.blockchain_client
        .commit_interaction(token_id, &commitment.commitment_hash)
        .await
        .map_err(|e| {
            println!("Failed to commit interaction to blockchain: {:?}", e);
            // Don't fail the request if blockchain commit fails
        });

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
    State(state): State<Arc<AppState>>,
    Json(request): Json<VerificationRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    // Parse commitment hash
    let commitment_hash_bytes = hex::decode(&request.commitment_hash)
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    if commitment_hash_bytes.len() != 32 {
        return Err(StatusCode::BAD_REQUEST);
    }
    
    let mut commitment_hash = [0u8; 32];
    commitment_hash.copy_from_slice(&commitment_hash_bytes);
    
    // Parse muse ID
    let token_id: u64 = request.muse_id.parse()
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    // Get muse data from blockchain (verify muse exists)
    let _muse_data = state.blockchain_client
        .get_muse_data(token_id)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;
    
    // For now, create a mock signature (in production, this would come from the interaction data)
    let mock_signature = [0u8; 64]; // Would be actual signature from interaction
    
    // Verify interaction on blockchain
    let verification_result = state.blockchain_client
        .verify_interaction(token_id, &commitment_hash, &mock_signature)
        .await;
    
    match verification_result {
        Ok(tx_info) => {
            let response = VerificationResponse {
                success: tx_info.status,
                signature: Some(hex::encode(mock_signature)),
                verification_hash: Some(tx_info.hash),
            };
            Ok((StatusCode::OK, Json(response)))
        },
        Err(e) => {
            println!("Verification failed: {:?}", e);
            let response = VerificationResponse {
                success: false,
                signature: None,
                verification_hash: None,
            };
            Ok((StatusCode::OK, Json(response)))
        }
    }
}

// Blockchain utility handlers
async fn get_muse_events(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let token_id: u64 = muse_id.parse()
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    let events = state.blockchain_client
        .get_muse_events(token_id, None)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok((StatusCode::OK, Json(events)))
}

async fn get_account_balance(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let balance = state.blockchain_client
        .get_balance()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let response = serde_json::json!({
        "balance_eth": balance,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    });
    
    Ok((StatusCode::OK, Json(response)))
}

async fn get_gas_price(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let gas_price = state.blockchain_client
        .get_gas_price()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let response = serde_json::json!({
        "gas_price_wei": gas_price.to_string(),
        "gas_price_gwei": format!("{:.2}", gas_price.as_u64() as f64 / 1_000_000_000.0),
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    });
    
    Ok((StatusCode::OK, Json(response)))
}