use axum::Router;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use dotenv::dotenv;

mod config;
mod agent_workflow;
mod muse_orchestrator;
mod route;
mod persist_memory;
mod plugin_system;
mod tools;
mod verification;

use crate::config::Config;
use crate::muse_orchestrator::MuseOrchestrator;
use crate::persist_memory::MemorySystem;
use crate::plugin_system::PluginSystem;
use crate::verification::VerificationSystem;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub orchestrator: Arc<MuseOrchestrator>,
    pub memory_system: Arc<MemorySystem>,
    pub plugin_system: Arc<PluginSystem>,
    pub verification_system: Arc<VerificationSystem>,
}

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    dotenv().ok();
    
    // Load configuration
    let config = Config::from_env()?;
    
    // Initialize systems
    let orchestrator = Arc::new(MuseOrchestrator::new().await?);
    let memory_system = Arc::new(MemorySystem::new(&config).await?);
    let plugin_system = Arc::new(PluginSystem::new().await?);
    let verification_system = Arc::new(VerificationSystem::new(&config)?);
    
    // Create app state
    let app_state = Arc::new(AppState {
        config,
        orchestrator,
        memory_system,
        plugin_system,
        verification_system,
    });
    
    // Build router
    let app = Router::new()
        .merge(route::muse_routes())
        .merge(route::chat_routes())
        .merge(route::memory_routes())
        .merge(route::plugin_routes())
        .merge(route::verification_routes())
        .with_state(app_state)
        .layer(CorsLayer::permissive());
    
    // Start server
    let addr = "0.0.0.0:8080".parse::<std::net::SocketAddr>()?;
    println!("MetaMuse API server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}
