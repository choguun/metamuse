use axum::Router;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use dotenv::dotenv;
use tokio::sync::Mutex;
use crate::llama_engine_wrapper::LlamaEngineWrapper;

mod config;
mod agent_workflow;
mod blockchain_client;
mod muse_orchestrator;
mod route;
mod persist_memory;
mod memory_routes_enhanced;
mod plugin_system;
mod tools;
mod verification;
mod llama_engine_wrapper;
mod ai_worker;
mod ipfs_chat_history;
mod tee_attestation;
mod cot_personality;
mod rating_system;
mod semantic_search;

use crate::config::Config;
use crate::blockchain_client::BlockchainClient;
use crate::muse_orchestrator::MuseOrchestrator;
use crate::persist_memory::MemorySystem;
use crate::plugin_system::PluginSystem;
use crate::verification::VerificationSystem;
use crate::ipfs_chat_history::IPFSChatHistoryManager;
use crate::tee_attestation::MuseTEEService;
use crate::rating_system::AIAlignmentMarket;
use crate::semantic_search::SemanticSearchService;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub blockchain_client: Arc<BlockchainClient>,
    pub orchestrator: Arc<MuseOrchestrator>,
    pub memory_system: Arc<MemorySystem>,
    pub plugin_system: Arc<PluginSystem>,
    pub verification_system: Arc<VerificationSystem>,
    pub llama_engine: Option<Arc<Mutex<LlamaEngineWrapper>>>, // Shared LlamaEngine instance
    pub ipfs_chat_history: Arc<IPFSChatHistoryManager>, // IPFS-powered chat history
    pub tee_service: Arc<MuseTEEService>, // TEE attestation service
    pub rating_market: Arc<AIAlignmentMarket>, // AI alignment marketplace
    pub semantic_search: Arc<SemanticSearchService>, // Semantic search with embeddings
}

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    dotenv().ok();
    
    // Load configuration
    let config = Config::from_env()?;
    
    // Initialize shared LlamaEngineWrapper at startup
    let llama_engine = {
        let model_path = "./models/qwen2.5-1.5b-instruct-q5_k_m.gguf";
        println!("🚀 Initializing shared LlamaEngineWrapper at startup...");
        match LlamaEngineWrapper::new(model_path).await {
            Ok(engine) => {
                println!("✅ Shared LlamaEngineWrapper initialized successfully - all requests will use AI inference");
                Some(Arc::new(Mutex::new(engine)))
            }
            Err(e) => {
                println!("⚠️  Failed to initialize LlamaEngineWrapper: {}", e);
                println!("   Application will continue with personality-driven responses");
                None
            }
        }
    };
    
    // Initialize systems
    let blockchain_client = Arc::new(BlockchainClient::new(&config).await?);
    let orchestrator = Arc::new(MuseOrchestrator::new(config.clone()).await?);
    let memory_system = Arc::new(MemorySystem::new(&config).await?);
    let plugin_system = Arc::new(PluginSystem::new().await?);
    let verification_system = Arc::new(VerificationSystem::new(&config)?);
    let ipfs_chat_history = Arc::new(IPFSChatHistoryManager::new(&config).await?);
    let tee_service = Arc::new(MuseTEEService::new());
    let rating_market = Arc::new(AIAlignmentMarket::new(blockchain_client.clone(), config.clone()));
    let semantic_search = Arc::new(SemanticSearchService::new(config.clone(), ipfs_chat_history.clone()));
    
    println!("🌐 IPFS Chat History Manager initialized - Web3-native conversation persistence");
    println!("🔒 TEE Attestation Service initialized - World's first verifiable AI companions");
    println!("🏪 AI Alignment Market initialized - First decentralized AI improvement marketplace");
    println!("🔍 Semantic Search Service initialized - Advanced RAG with vector embeddings");
    
    // Initialize demo embeddings for semantic search
    if let Err(e) = semantic_search.initialize_demo_embeddings().await {
        println!("⚠️ Failed to initialize demo embeddings: {}", e);
    }
    
    // Create app state
    let app_state = Arc::new(AppState {
        config,
        blockchain_client,
        orchestrator,
        memory_system,
        plugin_system,
        verification_system,
        llama_engine,
        ipfs_chat_history,
        tee_service,
        rating_market,
        semantic_search,
    });
    
    // Build router
    let app = Router::new()
        .merge(route::muse_routes())
        .merge(route::chat_routes())
        .merge(route::memory_routes())
        .merge(memory_routes_enhanced::enhanced_memory_routes())
        .merge(route::plugin_routes())
        .merge(route::verification_routes())
        .merge(route::rating_routes())
        .merge(route::semantic_routes())
        .with_state(app_state)
        .layer(CorsLayer::permissive());
    
    // Start server
    let addr = "0.0.0.0:8080".parse::<std::net::SocketAddr>()?;
    println!("MetaMuse API server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}
