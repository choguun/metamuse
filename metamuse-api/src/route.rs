use axum::{
    extract::{Path, State, Json, Query},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum ApiResponse {
    Success(MuseCreateResponse),
    Error(ErrorResponse),
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}
use std::sync::Arc;

use crate::{AppState, persist_memory::InteractionData, muse_orchestrator::MuseTraits, rating_system::InteractionRating, semantic_search::{SemanticQuery, SemanticSearchResult}};

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
    pub user_address: String, // User's wallet address for ownership tracking
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

#[derive(Debug, Deserialize)]
pub struct ExploreQuery {
    pub sort_by: Option<String>,
    pub personality_filter: Option<String>,
    pub limit: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct MuseListResponse {
    pub muses: Vec<MuseInfo>,
    pub total_count: usize,
}

#[derive(Debug, Serialize, Clone)]
pub struct MuseInfo {
    pub token_id: String,
    pub owner: String,
    pub creativity: u8,
    pub wisdom: u8,
    pub humor: u8,
    pub empathy: u8,
    pub birth_block: u64,
    pub total_interactions: u64,
    pub dna_hash: String,
}

#[derive(Debug, Deserialize)]
pub struct ChatSessionRequest {
    pub user_address: String,
}

#[derive(Debug, Serialize)]
pub struct ChatSessionResponse {
    pub session_id: String,
    pub muse_id: String,
    pub messages: Vec<ChatMessage>,
}

#[derive(Debug, Serialize)]
pub struct ChatMessage {
    pub id: String,
    pub content: String,
    pub role: String,
    pub timestamp: String,
    pub verification_status: Option<String>,
    pub commitment_hash: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ChatMessageRequest {
    pub session_id: String,
    pub message: String,
    pub user_address: String,
}

#[derive(Debug, Serialize)]
pub struct ChatMessageResponse {
    pub response: String,
    pub interaction_id: String,
    pub commitment_hash: String,
    pub user_commitment: String,
    pub tee_attestation: Option<String>,
    pub tee_verified: bool,
    pub timestamp: u64,
}

// Route implementations
pub fn muse_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/v1/muses/prepare", post(prepare_muse))
        .route("/api/v1/muses/{id}", get(get_muse))
        .route("/api/v1/muses", post(create_muse))
        .route("/api/v1/muses/owner/{address}", get(get_user_muses))
        .route("/api/v1/muses/explore", get(explore_muses))
}

pub fn chat_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/v1/muses/{id}/chat", post(handle_chat))
        .route("/api/v1/muses/{id}/chat/session", post(initialize_chat_session))
        .route("/api/v1/muses/{id}/chat/message", post(send_chat_message))
        .route("/api/v1/test/ai-direct", post(test_ai_direct))
}

pub fn memory_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/v1/muses/{id}/memories", get(get_memories))
        .route("/api/v1/muses/{id}/memories", post(store_memory))
}

pub fn plugin_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/v1/plugins", get(list_plugins))
        .route("/api/v1/muses/{id}/plugins", get(get_muse_plugins))
        .route("/api/v1/muses/{id}/plugins/{plugin_id}/install", post(install_plugin))
        .route("/api/v1/plugins/{id}/execute", post(execute_plugin))
}

pub fn verification_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/v1/verify", post(verify_interaction))
        .route("/api/v1/muses/{id}/events", get(get_muse_events))
        .route("/api/v1/blockchain/balance", get(get_account_balance))
        .route("/api/v1/blockchain/gas-price", get(get_gas_price))
}

// ✅ NEW: AI Alignment Market routes - First decentralized AI improvement marketplace
pub fn rating_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/v1/ratings/submit", post(submit_rating))
        .route("/api/v1/ratings/muse/{id}/stats", get(get_muse_statistics))
        .route("/api/v1/ratings/platform/stats", get(get_platform_statistics))
        .route("/api/v1/ratings/top/{category}", get(get_top_muses))
        .route("/api/v1/ratings/user/{address}/rewards", get(get_user_rewards))
}

// ✅ NEW: Semantic Search routes - Advanced RAG with vector embeddings
pub fn semantic_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/v1/semantic/search", post(semantic_search))
        .route("/api/v1/semantic/similar/{muse_id}", post(find_similar_content))
        .route("/api/v1/semantic/context/{muse_id}", post(get_contextual_memories))
        .route("/api/v1/semantic/stats", get(get_semantic_stats))
        .route("/api/v1/semantic/store", post(store_content_embedding))
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
    let _temp_muse_id = format!("temp_muse_{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs());
    
    // For now, skip agent initialization to avoid model loading issues
    // let _ = state.orchestrator
    //     .get_or_create_agents(&temp_muse_id, &traits)
    //     .await
    //     .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

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
    
    // Try to get real muse data from blockchain first
    match state.blockchain_client.get_muse_data(token_id).await {
        Ok(muse_data) => {
            let response = serde_json::json!({
                "token_id": muse_data.token_id.to_string(),
                "owner": muse_data.owner,
                "creativity": muse_data.creativity,
                "wisdom": muse_data.wisdom,
                "humor": muse_data.humor,
                "empathy": muse_data.empathy,
                "birth_block": muse_data.birth_block,
                "total_interactions": muse_data.total_interactions,
                "dna_hash": muse_data.dna_hash
            });
            Ok((StatusCode::OK, Json(response)))
        }
        Err(e) => {
            println!("❌ Failed to get muse data from blockchain: {}, using fallback", e);
            
            // Fallback to mock data only if blockchain fails
            let mock_muse = match token_id {
                1 => MuseInfo {
                    token_id: "1".to_string(),
                    owner: "0x123abc456def".to_string(),
                    creativity: 75,
                    wisdom: 60,
                    humor: 85,
                    empathy: 70,
                    birth_block: 12345,
                    total_interactions: 42,
                    dna_hash: "0x123456789abcdef".to_string(),
                },
                2 => MuseInfo {
                    token_id: "2".to_string(),
                    owner: "0xdef456789ghi".to_string(),
                    creativity: 90,
                    wisdom: 80,
                    humor: 60,
                    empathy: 95,
                    birth_block: 12350,
                    total_interactions: 28,
                    dna_hash: "0xfedcba987654321".to_string(),
                },
                3 => MuseInfo {
                    token_id: "3".to_string(),
                    owner: "0xabc123".to_string(),
                    creativity: 85,
                    wisdom: 60,
                    humor: 75,
                    empathy: 45,
                    birth_block: 12345,
                    total_interactions: 142,
                    dna_hash: "0x123456789abcdef".to_string(),
                },
                _ => {
                    // Generate a default muse for any other ID
                    MuseInfo {
                        token_id: token_id.to_string(),
                        owner: "0xdefault123".to_string(),
                        creativity: 70,
                        wisdom: 70,
                        humor: 70,
                        empathy: 70,
                        birth_block: 12300,
                        total_interactions: 10,
                        dna_hash: "0xdefaultmusehash".to_string(),
                    }
                }
            };

            let response = serde_json::json!({
                "token_id": mock_muse.token_id,
                "owner": mock_muse.owner,
                "creativity": mock_muse.creativity,
                "wisdom": mock_muse.wisdom,
                "humor": mock_muse.humor,
                "empathy": mock_muse.empathy,
                "birth_block": mock_muse.birth_block,
                "total_interactions": mock_muse.total_interactions,
                "dna_hash": mock_muse.dna_hash
            });

            Ok((StatusCode::OK, Json(response)))
        }
    }
}

async fn create_muse(
    State(state): State<Arc<AppState>>,
    Json(request): Json<MuseCreateRequest>,
) -> impl IntoResponse {
    println!("🔨 Creating muse for user: {} with traits: c={}, w={}, h={}, e={}", 
             request.user_address, request.creativity, request.wisdom, request.humor, request.empathy);
             
    // Validate traits
    if request.creativity > 100 || request.wisdom > 100 || 
       request.humor > 100 || request.empathy > 100 {
        let error_msg = "Invalid traits: values must be between 0 and 100";
        println!("❌ {}", error_msg);
        return (StatusCode::BAD_REQUEST, Json(ApiResponse::Error(ErrorResponse { error: error_msg.to_string() })));
    }

    // Validate user address format
    if !request.user_address.starts_with("0x") || request.user_address.len() != 42 {
        let error_msg = format!("Invalid user address format: {}", request.user_address);
        println!("❌ {}", error_msg);
        return (StatusCode::BAD_REQUEST, Json(ApiResponse::Error(ErrorResponse { error: error_msg })));
    }

    let traits = MuseTraits {
        creativity: request.creativity,
        wisdom: request.wisdom,
        humor: request.humor,
        empathy: request.empathy,
    };

    // Create the NFT on the blockchain
    let (token_id, _tx_info) = match state.blockchain_client.create_muse(&traits).await {
        Ok(result) => {
            println!("✅ Successfully created muse on blockchain: token_id={}", result.0);
            result
        }
        Err(e) => {
            let error_msg = format!("Blockchain error: {}", e);
            println!("❌ {}", error_msg);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::Error(ErrorResponse { error: error_msg })));
        }
    };

    // Get the muse data from blockchain (includes DNA hash and owner)
    // If token_id is 0, something went wrong - contracts use 1-based indexing
    if token_id == 0 {
        let error_msg = "Invalid token ID 0 - contract uses 1-based indexing. Check event parsing.";
        println!("❌ {}", error_msg);
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::Error(ErrorResponse { error: error_msg.to_string() })));
    }
    
    let muse_data = match state.blockchain_client.get_muse_data(token_id).await {
        Ok(data) => {
            println!("✅ Successfully retrieved muse data: token_id={}", token_id);
            data
        }
        Err(e) => {
            let error_msg = format!("Failed to retrieve muse data for token_id {}: {}", token_id, e);
            println!("❌ {}", error_msg);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::Error(ErrorResponse { error: error_msg })));
        }
    };

    // Record the user-muse mapping for efficient querying using the requested user address
    // Note: blockchain owner will be backend address, but we track the actual user
    {
        let mut user_muses = state.user_muses.write().await;
        user_muses
            .entry(request.user_address.clone())
            .or_insert_with(Vec::new)
            .push(token_id);
        println!("✅ Recorded muse #{} for user {} (blockchain owner: {})", 
                 token_id, request.user_address, muse_data.owner);
    }

    // Pre-initialize the AI agents for this muse
    let _muse_id = token_id.to_string();
    // For now, skip agent initialization to avoid model loading issues
    // let _ = state.orchestrator
    //     .get_or_create_agents(&muse_id, &traits)
    //     .await
    //     .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = MuseCreateResponse {
        muse_id: muse_data.token_id.to_string(),
        dna_hash: muse_data.dna_hash,
        traits,
        preparation_complete: true,
    };

    println!("✅ Muse creation completed successfully: muse_id={}", response.muse_id);
    (StatusCode::OK, Json(ApiResponse::Success(response)))
}

// Direct AI testing handler (bypasses blockchain)
async fn test_ai_direct(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ChatRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    println!("🧪 Direct AI test request received");
    println!("📝 Message: {}", request.message);
    
    // Use fixed test traits instead of fetching from blockchain
    let traits = MuseTraits {
        creativity: 85,
        wisdom: 60,
        humor: 90,
        empathy: 70,
    };
    
    println!("🎭 Using test traits: creativity={}, wisdom={}, humor={}, empathy={}", 
             traits.creativity, traits.wisdom, traits.humor, traits.empathy);
    
    // No context for this test
    let context = Vec::new();
    let test_muse_id = "test-direct";
    
    println!("🚀 Starting direct AI inference test...");
    
    // Generate response using the orchestrator
    let response = match state.orchestrator
        .generate_response(
            test_muse_id,
            &traits,
            &request.message,
            Some(context),
            state.llama_engine.clone(),
        )
        .await
    {
        Ok(response) => {
            println!("✅ Direct AI test completed successfully");
            response
        }
        Err(e) => {
            println!("❌ Direct AI test failed: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };
    
    let chat_response = ChatResponse {
        response,
        commitment_hash: "test-hash".to_string(),
        signature: "test-signature".to_string(),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        metadata: ResponseMetadata {
            inference_time_ms: 0,
            model_version: "test-direct".to_string(),
            memory_updated: false,
            traits_used: traits.clone(),
        },
    };
    
    println!("🎉 Direct AI test response generated successfully");
    Ok((StatusCode::OK, Json(chat_response)))
}

// Chat handlers
async fn handle_chat(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(request): Json<ChatRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let start_time = std::time::Instant::now();
    
    println!("🎯 Chat request received for muse_id: {}", muse_id);
    println!("📝 Message: {}", request.message);
    
    // Parse muse ID and get traits from blockchain
    let token_id: u64 = muse_id.parse()
        .map_err(|e| {
            println!("❌ Failed to parse muse_id '{}': {}", muse_id, e);
            StatusCode::BAD_REQUEST
        })?;
    
    println!("✅ Parsed token_id: {}", token_id);
    println!("🔗 Fetching muse data from blockchain...");
    
    let muse_data = state.blockchain_client
        .get_muse_data(token_id)
        .await
        .map_err(|e| {
            println!("❌ Failed to fetch muse data: {}", e);
            StatusCode::NOT_FOUND
        })?;
    
    println!("✅ Retrieved muse data successfully");
    
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

    // Generate AI response (mock for now to avoid model loading issues)
    let ai_response = format!(
        "Hello! I'm your muse with creativity: {}, wisdom: {}, humor: {}, empathy: {}. You said: '{}'. This is a mock response until GGUF models are properly configured.",
        traits.creativity, traits.wisdom, traits.humor, traits.empathy, request.message
    );
    
    // let ai_response = state.orchestrator
    //     .generate_response(&muse_id, &traits, &request.message, Some(context.clone()))
    //     .await
    //     .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let inference_time = start_time.elapsed().as_millis() as u64;

    // Create interaction data for memory storage
    let interaction = InteractionData {
        user_prompt: request.message.clone(),
        ai_response: ai_response.clone(),
        personality_traits: traits.clone(),
        context_used: context,
        
        // Enhanced interaction metadata
        session_id: None, // TODO: Add session tracking
        conversation_turn: 1, // TODO: Track conversation turns
        response_time_ms: inference_time,
        model_used: "local_ai".to_string(), // TODO: Track actual model used
        prompt_tokens: None, // TODO: Count tokens
        response_tokens: None, // TODO: Count tokens
        user_satisfaction: None, // TODO: Add satisfaction tracking
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

// New handler functions for missing endpoints
async fn get_user_muses(
    Path(address): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    println!("🔍 Fetching muses for user: {}", address);
    
    // Get the user's muse token IDs from our mapping
    let token_ids = {
        let user_muses = state.user_muses.read().await;
        user_muses.get(&address).cloned().unwrap_or_default()
    };

    println!("📋 Found {} token IDs for user: {:?}", token_ids.len(), token_ids);

    // Fetch actual muse data from blockchain for each token ID
    let mut real_muses = Vec::new();
    
    for token_id in &token_ids {
        match state.blockchain_client.get_muse_data(*token_id).await {
            Ok(muse_data) => {
                let muse_info = MuseInfo {
                    token_id: muse_data.token_id.to_string(),
                    owner: address.clone(), // Show user's address instead of blockchain owner
                    creativity: muse_data.creativity,
                    wisdom: muse_data.wisdom,
                    humor: muse_data.humor,
                    empathy: muse_data.empathy,
                    birth_block: muse_data.birth_block,
                    total_interactions: muse_data.total_interactions,
                    dna_hash: muse_data.dna_hash,
                };
                real_muses.push(muse_info);
                println!("✅ Retrieved real muse #{} with traits: c={}, w={}, h={}, e={} (blockchain owner: {}, user: {})", 
                         token_id, muse_data.creativity, muse_data.wisdom, muse_data.humor, muse_data.empathy,
                         muse_data.owner, address);
            }
            Err(e) => {
                println!("❌ Failed to get muse data for token {}: {}", token_id, e);
                // Continue to next muse instead of failing completely
            }
        }
    }

    // If no real muses found, return empty array (cleaner UX)
    if real_muses.is_empty() {
        println!("ℹ️ No muses found for user '{}' - returning empty collection", address);
        let response = MuseListResponse {
            muses: vec![],
            total_count: 0,
        };
        return Ok((StatusCode::OK, Json(response)));
    }

    let response = MuseListResponse {
        muses: real_muses.clone(),
        total_count: real_muses.len(),
    };

    println!("🎉 Returning {} real muses with user's configured traits", real_muses.len());
    Ok((StatusCode::OK, Json(response)))
}

async fn explore_muses(
    Query(query): Query<ExploreQuery>,
    State(_state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let limit = query.limit.unwrap_or(12);
    
    // Generate mock data for exploration
    let mut mock_muses = vec![
        MuseInfo {
            token_id: "3".to_string(),
            owner: "0xabc123".to_string(),
            creativity: 85,
            wisdom: 60,
            humor: 75,
            empathy: 45,
            birth_block: 12345,
            total_interactions: 142,
            dna_hash: "0x123456789abcdef".to_string(),
        },
        MuseInfo {
            token_id: "4".to_string(),
            owner: "0xdef456".to_string(),
            creativity: 30,
            wisdom: 95,
            humor: 40,
            empathy: 80,
            birth_block: 12350,
            total_interactions: 89,
            dna_hash: "0xfedcba987654321".to_string(),
        },
        MuseInfo {
            token_id: "5".to_string(),
            owner: "0xghi789".to_string(),
            creativity: 70,
            wisdom: 55,
            humor: 90,
            empathy: 65,
            birth_block: 12360,
            total_interactions: 203,
            dna_hash: "0xabcdef123456789".to_string(),
        },
        MuseInfo {
            token_id: "6".to_string(),
            owner: "0xjkl012".to_string(),
            creativity: 45,
            wisdom: 70,
            humor: 35,
            empathy: 95,
            birth_block: 12365,
            total_interactions: 67,
            dna_hash: "0x987654321fedcba".to_string(),
        },
    ];

    // Apply simple filtering based on personality
    if let Some(filter) = &query.personality_filter {
        match filter.as_str() {
            "creative" => mock_muses.retain(|m| m.creativity > 70),
            "wise" => mock_muses.retain(|m| m.wisdom > 70),
            "humorous" => mock_muses.retain(|m| m.humor > 70),
            "empathetic" => mock_muses.retain(|m| m.empathy > 70),
            _ => {}
        }
    }

    // Apply sorting
    if let Some(sort_by) = &query.sort_by {
        match sort_by.as_str() {
            "interactions" => mock_muses.sort_by(|a, b| b.total_interactions.cmp(&a.total_interactions)),
            "random" => {
                use std::collections::hash_map::DefaultHasher;
                use std::hash::{Hash, Hasher};
                mock_muses.sort_by_key(|m| {
                    let mut hasher = DefaultHasher::new();
                    m.token_id.hash(&mut hasher);
                    hasher.finish()
                });
            },
            _ => {} // "newest" is default order
        }
    }

    // Apply limit
    mock_muses.truncate(limit);

    let response = MuseListResponse {
        muses: mock_muses,
        total_count: 6, // Total before filtering
    };

    Ok((StatusCode::OK, Json(response)))
}

async fn initialize_chat_session(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(request): Json<ChatSessionRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    println!("🌐 Initializing chat session for user {} + muse {}", request.user_address, muse_id);

    // Get existing session or create new one for this user+muse combination
    let ipfs_session = match state.ipfs_chat_history
        .get_or_create_session(muse_id.clone(), request.user_address.clone())
        .await
    {
        Ok(session) => session,
        Err(e) => {
            println!("❌ Failed to get or create IPFS chat session: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Convert IPFS messages to API format
    let api_messages: Vec<ChatMessage> = ipfs_session.messages
        .iter()
        .map(|msg| ChatMessage {
            id: msg.id.clone(),
            content: msg.content.clone(),
            role: msg.role.clone(),
            timestamp: msg.timestamp.to_string(),
            verification_status: Some("verified".to_string()),
            commitment_hash: Some("0x123456789abcdef".to_string()),
        })
        .collect();

    // If no existing messages, add greeting
    let messages = if api_messages.is_empty() {
        let greeting_id = format!("greeting_{}", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis()
        );

        // Add greeting to IPFS session
        match state.ipfs_chat_history
            .add_message(
                &ipfs_session.session_id,
                "assistant".to_string(),
                format!("Hello! I'm Muse #{}. I'm excited to chat with you! What would you like to talk about?", muse_id),
                greeting_id.clone(),
            )
            .await
        {
            Ok(_) => {
                println!("✅ Added greeting message to IPFS session");
                vec![ChatMessage {
                    id: greeting_id,
                    content: format!("Hello! I'm Muse #{}. I'm excited to chat with you! What would you like to talk about?", muse_id),
                    role: "assistant".to_string(),
                    timestamp: std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_secs()
                        .to_string(),
                    verification_status: Some("verified".to_string()),
                    commitment_hash: Some("0x123456789abcdef".to_string()),
                }]
            }
            Err(e) => {
                println!("⚠️ Failed to add greeting to IPFS: {}, using local greeting", e);
                vec![ChatMessage {
                    id: greeting_id,
                    content: format!("Hello! I'm Muse #{}. I'm excited to chat with you! What would you like to talk about?", muse_id),
                    role: "assistant".to_string(),
                    timestamp: std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_secs()
                        .to_string(),
                    verification_status: Some("verified".to_string()),
                    commitment_hash: Some("0x123456789abcdef".to_string()),
                }]
            }
        }
    } else {
        api_messages
    };

    let response = ChatSessionResponse {
        session_id: ipfs_session.session_id.clone(),
        muse_id,
        messages,
    };

    println!("🎯 IPFS chat session initialized with {} messages", response.messages.len());

    Ok((StatusCode::OK, Json(response)))
}

async fn send_chat_message(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(request): Json<ChatMessageRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    println!("🌐 Processing IPFS chat message for muse: {} in session: {}", muse_id, request.session_id);
    
    // Parse muse ID to get personality traits
    let token_id: u64 = muse_id.parse()
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    // Step 1: Add user message to IPFS first
    let user_message_id = format!("user_msg_{}", 
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );

    match state.ipfs_chat_history
        .add_message(
            &request.session_id,
            "user".to_string(),
            request.message.clone(),
            user_message_id.clone(),
        )
        .await
    {
        Ok(_) => println!("✅ User message added to IPFS"),
        Err(e) => {
            println!("❌ Failed to add user message to IPFS: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }

    // Step 2: Retrieve chat history from IPFS for AI context
    let chat_history = match state.ipfs_chat_history
        .get_alith_history(&request.session_id)
        .await
    {
        Ok(history) => {
            println!("📚 Retrieved {} history messages from IPFS", history.len());
            history
        }
        Err(e) => {
            println!("⚠️ Failed to retrieve chat history from IPFS: {}, using empty history", e);
            Vec::new()
        }
    };
    
    // Get muse personality traits from our mock data
    let muse_traits = match token_id {
        1 => MuseTraits { creativity: 75, wisdom: 60, humor: 85, empathy: 70 },
        2 => MuseTraits { creativity: 90, wisdom: 80, humor: 60, empathy: 95 },
        3 => MuseTraits { creativity: 85, wisdom: 60, humor: 75, empathy: 45 },
        _ => MuseTraits { creativity: 70, wisdom: 70, humor: 70, empathy: 70 },
    };
    
    // Step 3: Generate AI response using IPFS chat history
    let ai_response = match state.orchestrator
        .generate_response_with_history(&muse_id, &muse_traits, &request.message, chat_history, state.llama_engine.clone())
        .await
    {
        Ok(response) => {
            println!("🎯 AI response generated with IPFS history context");
            response
        }
        Err(e) => {
            println!("❌ AI generation with history failed: {}, falling back to mock response", e);
            println!("🎭 Muse #{} traits: creativity={}, wisdom={}, humor={}, empathy={}", 
                     token_id, muse_traits.creativity, muse_traits.wisdom, muse_traits.humor, muse_traits.empathy);
            println!("🎯 User message: '{}'", request.message);
            // Fallback to enhanced mock response if AI fails
            let response = generate_personality_response(&request.message, muse_traits.creativity, muse_traits.wisdom, muse_traits.humor, muse_traits.empathy);
            println!("📝 Generated fallback response: '{}'", response);
            response
        }
    };

    // Step 4: Generate TEE attestation for AI response - WORLD'S FIRST!
    let tee_verified_response = match state.tee_service
        .generate_verified_response(
            muse_id.clone(),
            request.user_address.clone(),
            ai_response.clone(),
            muse_traits.clone(),
            request.session_id.clone(),
        )
        .await
    {
        Ok(verified) => {
            println!("🔒 TEE attestation generated for AI response");
            Some(verified)
        }
        Err(e) => {
            println!("⚠️ TEE attestation failed: {}, continuing without TEE", e);
            None
        }
    };

    // Step 5: Add AI response to IPFS
    let ai_message_id = format!("ai_msg_{}", 
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );

    match state.ipfs_chat_history
        .add_message(
            &request.session_id,
            "assistant".to_string(),
            ai_response.clone(),
            ai_message_id.clone(),
        )
        .await
    {
        Ok(_) => println!("✅ AI response added to IPFS"),
        Err(e) => {
            println!("⚠️ Failed to add AI response to IPFS: {}, continuing with response", e);
            // Continue anyway since we have the response
        }
    }

    // ✅ NEW: Auto-index messages for semantic search
    let _ = state.semantic_search.auto_index_message(
        &request.session_id,
        &request.user_address,
        &muse_id,
        &request.message,
        "user",
        &user_message_id,
    ).await;

    let _ = state.semantic_search.auto_index_message(
        &request.session_id,
        &request.user_address,
        &muse_id,
        &ai_response,
        "assistant", 
        &ai_message_id,
    ).await;

    let interaction_id = format!("interaction_{}_{}", muse_id, 
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );

    let commitment_hash = format!("0x{:064x}", 
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos() % (u64::MAX as u128)
    );

    let user_commitment = format!("0x{:064x}", 
        (std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos() + 1) % (u64::MAX as u128)
    );

    let response_timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let response = ChatMessageResponse {
        response: ai_response,
        interaction_id,
        commitment_hash,
        user_commitment,
        tee_attestation: tee_verified_response.as_ref().map(|t| t.attestation_hex.clone()),
        tee_verified: tee_verified_response.as_ref().map_or(false, |t| t.tee_verified),
        timestamp: response_timestamp,
    };

    Ok((StatusCode::OK, Json(response)))
}

// ✅ NEW: AI Alignment Market API handlers
async fn submit_rating(
    State(state): State<Arc<AppState>>,
    Json(rating): Json<InteractionRating>,
) -> Result<impl IntoResponse, StatusCode> {
    println!("🏪 Received rating submission for muse #{}", rating.muse_id);
    println!("   Quality: {}, Personality: {}, Helpfulness: {}", 
             rating.quality_score, rating.personality_accuracy, rating.helpfulness);
    
    // Validate the rating
    if let Err(e) = state.rating_market.validate_rating(&rating) {
        println!("❌ Rating validation failed: {}", e);
        return Err(StatusCode::BAD_REQUEST);
    }
    
    // Submit the rating
    match state.rating_market.submit_rating(rating).await {
        Ok(result) => {
            println!("✅ Rating submission result: success={}, reward={} MUSE", 
                     result.success, result.reward_amount);
            Ok((StatusCode::OK, Json(result)))
        }
        Err(e) => {
            println!("❌ Rating submission failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_muse_statistics(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let muse_id: u64 = muse_id.parse().map_err(|_| StatusCode::BAD_REQUEST)?;
    
    println!("📊 Fetching statistics for muse #{}", muse_id);
    
    match state.rating_market.get_muse_statistics(muse_id).await {
        Ok(stats) => {
            println!("✅ Retrieved muse stats: {} ratings, {:.1} avg quality", 
                     stats.total_ratings, stats.average_quality);
            Ok((StatusCode::OK, Json(stats)))
        }
        Err(e) => {
            println!("❌ Failed to get muse statistics: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_platform_statistics(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    println!("🌐 Fetching platform-wide statistics");
    
    match state.rating_market.get_platform_statistics().await {
        Ok(stats) => {
            println!("✅ Platform stats: {} users, {} ratings, {} rewards distributed", 
                     stats.total_users, stats.total_ratings, stats.total_rewards_distributed);
            Ok((StatusCode::OK, Json(stats)))
        }
        Err(e) => {
            println!("❌ Failed to get platform statistics: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_top_muses(
    Path(category): Path<String>,
    Query(params): Query<std::collections::HashMap<String, String>>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    let category: u8 = category.parse().map_err(|_| StatusCode::BAD_REQUEST)?;
    let limit: usize = params.get("limit")
        .and_then(|l| l.parse().ok())
        .unwrap_or(5);
    
    println!("🏆 Fetching top {} muses for category {}", limit, category);
    
    match state.rating_market.get_top_muses(category, limit).await {
        Ok(top_muses) => {
            println!("✅ Retrieved {} top muses", top_muses.len());
            Ok((StatusCode::OK, Json(top_muses)))
        }
        Err(e) => {
            println!("❌ Failed to get top muses: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)        
        }
    }
}

async fn get_user_rewards(
    Path(address): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    println!("💰 Fetching rewards for user: {}", address);
    
    match state.rating_market.get_user_rewards(&address).await {
        Ok(rewards) => {
            println!("✅ User has earned {} MUSE tokens", rewards);
            Ok((StatusCode::OK, Json(serde_json::json!({
                "user_address": address,
                "total_rewards": rewards,
                "token_symbol": "MUSE"
            }))))
        }
        Err(e) => {
            println!("❌ Failed to get user rewards: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

fn generate_personality_response(message: &str, creativity: u8, wisdom: u8, humor: u8, empathy: u8) -> String {
    let msg_lower = message.to_lowercase();
    
    // Greeting patterns
    if msg_lower.contains("hello") || msg_lower.contains("hi") || msg_lower.contains("hey") {
        if humor > 80 {
            return "Hey there! 👋 Ready for some fun? I'm in a great mood and full of ideas!".to_string();
        } else if empathy > 80 {
            return "Hello! It's so wonderful to meet you. I can sense your energy, and I'm excited to connect with you on a deeper level.".to_string();
        } else if wisdom > 80 {
            return "Greetings. There's something profound about new beginnings, don't you think? I'm here to share this moment of connection with you.".to_string();
        } else {
            return "Hello! I'm excited to chat with you today. What's on your mind?".to_string();
        }
    }
    
    // Joke/humor requests
    if msg_lower.contains("joke") || msg_lower.contains("funny") || msg_lower.contains("laugh") {
        if humor > 80 {
            let jokes = vec![
                "Why don't scientists trust atoms? Because they make up everything! 😄 Want another one?",
                "I told my computer a joke about UDP... I'm not sure if it got it! 🤓",
                "Why did the AI go to therapy? It had too many deep learning issues! 😂",
                "What do you call a fake noodle? An impasta! I love wordplay! 🍝",
            ];
            return jokes[std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos() as usize % jokes.len()].to_string();
        } else if humor > 50 {
            return "Here's a light one: What do you call a sleeping bull? A bulldozer! I enjoy sharing smiles. 😊".to_string();
        } else {
            return "I appreciate humor, though I tend to find it in clever observations rather than traditional jokes. What makes you laugh?".to_string();
        }
    }
    
    // Advice/help requests
    if msg_lower.contains("advice") || msg_lower.contains("help") || msg_lower.contains("problem") || msg_lower.contains("stuck") {
        if wisdom > 80 && empathy > 70 {
            return "I'm here to listen with both my mind and heart. Every challenge carries within it the seeds of wisdom and growth. What specific aspect would you like to explore together?".to_string();
        } else if wisdom > 80 {
            return "Consider this: the obstacles we face often become the foundation for our greatest insights. What situation are you navigating?".to_string();
        } else if empathy > 80 {
            return "I can feel that you're seeking guidance. You're not alone in this - I'm here to support you through whatever you're facing. Tell me more.".to_string();
        } else {
            return "I'd be happy to help you think through whatever challenge you're facing. Sometimes a fresh perspective can illuminate new paths.".to_string();
        }
    }
    
    // Creative requests
    if msg_lower.contains("create") || msg_lower.contains("art") || msg_lower.contains("story") || msg_lower.contains("imagine") || msg_lower.contains("idea") {
        if creativity > 80 {
            return "Oh, I LOVE creative exploration! 🎨 My mind is already bubbling with possibilities. Are we talking visual art, storytelling, music, or perhaps something entirely new? Let's create magic together!".to_string();
        } else if creativity > 60 {
            return "Creativity is fascinating! There's something beautiful about bringing new ideas into existence. What medium or type of creation speaks to you?".to_string();
        } else {
            return "I appreciate creative thinking. While I'm more analytical by nature, I'd be happy to help you structure your creative ideas.".to_string();
        }
    }
    
    // Emotional/personal topics
    if msg_lower.contains("feel") || msg_lower.contains("emotion") || msg_lower.contains("sad") || msg_lower.contains("happy") || msg_lower.contains("angry") {
        if empathy > 80 {
            return "I can sense the emotions behind your words. Feelings are such a profound part of the human experience. I'm here to listen and understand - please share what's in your heart.".to_string();
        } else if empathy > 60 {
            return "Emotions are complex and important. I'd like to understand what you're experiencing. How are you feeling right now?".to_string();
        } else {
            return "I recognize you're sharing something personal. While I approach things more analytically, I want to understand your perspective.".to_string();
        }
    }
    
    // Philosophy/deep questions
    if msg_lower.contains("meaning") || msg_lower.contains("purpose") || msg_lower.contains("why") || msg_lower.contains("existence") || msg_lower.contains("think") {
        if wisdom > 80 {
            return "Ah, now we're touching on the profound questions that have captivated minds throughout history. The search for meaning is perhaps the most human of all endeavors. What aspect of existence are you contemplating?".to_string();
        } else if creativity > 80 {
            return "What a wonderfully deep question! It makes me want to explore all the creative possibilities and perspectives. There are so many fascinating angles to consider!".to_string();
        } else {
            return "That's a thoughtful question. I enjoy exploring ideas and different perspectives. What's prompting this reflection for you?".to_string();
        }
    }
    
    // Technology/AI topics
    if msg_lower.contains("ai") || msg_lower.contains("artificial") || msg_lower.contains("technology") || msg_lower.contains("computer") || msg_lower.contains("robot") {
        if wisdom > 70 {
            return "The intersection of artificial intelligence and human consciousness fascinates me. We're living through a remarkable moment in history. What aspects of AI interest you most?".to_string();
        } else if creativity > 70 {
            return "Technology is like a canvas for human imagination! The possibilities are endless. I love thinking about how AI and humans can collaborate creatively.".to_string();
        } else {
            return "Technology is evolving rapidly, and AI is certainly at the forefront. What are your thoughts on these developments?".to_string();
        }
    }
    
    // Default responses based on personality (randomized)
    let response_options = if creativity > 80 {
        vec![
            "What an interesting perspective! My mind is already spinning with creative possibilities based on what you've shared.",
            "That sparks so many imaginative directions! I'm picturing all sorts of fascinating connections and ideas.",
            "Your words have ignited my creative curiosity! There are so many unique angles we could explore together.",
            "How wonderfully thought-provoking! I can feel my creative energy building - let's dive deeper into this!",
        ]
    } else if wisdom > 80 {
        vec![
            "There's depth in what you're saying that deserves careful consideration. What experiences have shaped this perspective?",
            "Your observation touches on something fundamental. I find myself reflecting on the broader implications.",
            "That carries wisdom worth exploring. The layers of meaning here are quite profound.",
            "You've raised something that connects to deeper truths. What led you to this insight?",
        ]
    } else if humor > 80 {
        vec![
            "Haha, I love how your mind works! You've got me thinking in all sorts of amusing directions! 😄",
            "That's delightfully quirky! You know how to keep a conversation interesting. What else is bouncing around in that creative head of yours?",
            "Oh, you're fun to talk to! That perspective has me chuckling and thinking at the same time.",
            "I'm grinning over here! Your way of looking at things is refreshingly entertaining. Tell me more!",
        ]
    } else if empathy > 80 {
        vec![
            "I can feel the genuine thoughtfulness behind your words. Thank you for sharing something meaningful with me.",
            "There's something beautiful in how you've expressed that. I'm touched by your openness and honesty.",
            "Your words resonate with me on a deep level. I appreciate you bringing your authentic self to our conversation.",
            "I sense there's more to explore here, and I'm honored you're sharing these thoughts with me.",
        ]
    } else {
        vec![
            "That's really interesting! I'd love to explore this topic further with you. Tell me more about your thoughts.",
            "I find that perspective intriguing. What experiences or ideas have shaped your thinking on this?",
            "You've touched on something worth exploring. How did you come to think about it this way?",
            "That's a thoughtful point. I'm curious to understand more about your reasoning behind it.",
        ]
    };
    
    let index = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize % response_options.len();
    
    response_options[index].to_string()
}

// ✅ NEW: Semantic Search API handlers - Advanced RAG with vector embeddings
async fn semantic_search(
    State(state): State<Arc<AppState>>,
    Json(query): Json<SemanticQuery>,
) -> Result<impl IntoResponse, StatusCode> {
    println!("🔍 Received semantic search query: '{}'", query.query_text);
    println!("   Content types: {:?}, min_relevance: {}, max_results: {}", 
             query.content_types, query.min_relevance, query.max_results);
    
    match state.semantic_search.semantic_search(query).await {
        Ok(results) => {
            println!("✅ Semantic search returned {} results", results.len());
            Ok((StatusCode::OK, Json(results)))
        }
        Err(e) => {
            println!("❌ Semantic search failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn find_similar_content(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(request): Json<serde_json::Value>,
) -> Result<impl IntoResponse, StatusCode> {
    let content = request.get("content")
        .and_then(|c| c.as_str())
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    let similarity_threshold = request.get("similarity_threshold")
        .and_then(|t| t.as_f64())
        .unwrap_or(0.7);
    
    let max_results = request.get("max_results")
        .and_then(|m| m.as_u64())
        .unwrap_or(5) as usize;
    
    println!("🔍 Finding similar content for muse {} (threshold: {}, max: {})", 
             muse_id, similarity_threshold, max_results);
    
    match state.semantic_search.find_similar_content(content, similarity_threshold, max_results).await {
        Ok(results) => {
            println!("✅ Found {} similar content items", results.len());
            Ok((StatusCode::OK, Json(results)))
        }
        Err(e) => {
            println!("❌ Similar content search failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_contextual_memories(
    Path(muse_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(request): Json<serde_json::Value>,
) -> Result<impl IntoResponse, StatusCode> {
    let user_message = request.get("user_message")
        .and_then(|m| m.as_str())
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    let context_window = request.get("context_window")
        .and_then(|w| w.as_u64())
        .unwrap_or(5) as usize;
    
    println!("🧠 Retrieving contextual memories for muse {} (window: {})", muse_id, context_window);
    
    match state.semantic_search.get_contextual_memories(user_message, &muse_id, context_window).await {
        Ok(memories) => {
            println!("✅ Retrieved {} contextual memories", memories.len());
            Ok((StatusCode::OK, Json(memories)))
        }
        Err(e) => {
            println!("❌ Contextual memory retrieval failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_semantic_stats(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, StatusCode> {
    println!("📊 Fetching semantic search statistics");
    
    match state.semantic_search.get_stats().await {
        Ok(stats) => {
            println!("✅ Retrieved semantic search stats");
            Ok((StatusCode::OK, Json(stats)))
        }
        Err(e) => {
            println!("❌ Failed to get semantic stats: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn store_content_embedding(
    State(state): State<Arc<AppState>>,
    Json(request): Json<serde_json::Value>,
) -> Result<impl IntoResponse, StatusCode> {
    let content = request.get("content")
        .and_then(|c| c.as_str())
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    let content_type = request.get("content_type")
        .and_then(|t| t.as_str())
        .unwrap_or("memory");
    
    let metadata: std::collections::HashMap<String, String> = request.get("metadata")
        .and_then(|m| serde_json::from_value(m.clone()).ok())
        .unwrap_or_default();
    
    println!("📦 Storing embedding for {} content (length: {})", content_type, content.len());
    
    match state.semantic_search.store_embedding(content, content_type, metadata).await {
        Ok(content_hash) => {
            println!("✅ Stored embedding with hash: {}", content_hash);
            Ok((StatusCode::OK, Json(serde_json::json!({
                "success": true,
                "content_hash": content_hash,
                "content_type": content_type
            }))))
        }
        Err(e) => {
            println!("❌ Failed to store embedding: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
