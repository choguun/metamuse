use std::env;
use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    // GGUF Model Configuration
    pub base_model_url: String,
    pub creative_model_url: String,
    pub wisdom_model_url: String,
    pub empathy_model_url: String,
    pub humor_model_url: String,
    pub model_cache_dir: String,
    
    // Blockchain Configuration
    pub signing_key: String,
    pub ethereum_rpc_url: String,
    pub chain_id: u64,
    pub metamuse_contract_address: String,
    pub commitment_verifier_address: String,
    pub muse_memory_contract_address: String,
    pub muse_plugins_contract_address: String,
    pub block_explorer_url: String,
    
    // Storage Configuration
    pub ipfs_api_key: Option<String>,
    pub ipfs_api_secret: Option<String>,
    pub ipfs_gateway_url: String,
    pub database_url: Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Config {
            // GGUF Model Configuration
            base_model_url: env::var("BASE_MODEL_URL")
                .unwrap_or_else(|_| "https://huggingface.co/Qwen/Qwen2.5-14B-Instruct-GGUF/resolve/main/qwen2.5-14b-instruct-q8_0.gguf".to_string()),
            creative_model_url: env::var("CREATIVE_MODEL_URL")
                .unwrap_or_else(|_| "https://huggingface.co/TheBloke/Nous-Hermes-2-Mixtral-8x7B-DPO-GGUF/resolve/main/nous-hermes-2-mixtral-8x7b-dpo.Q4_K_M.gguf".to_string()),
            wisdom_model_url: env::var("WISDOM_MODEL_URL")
                .unwrap_or_else(|_| "https://huggingface.co/TheBloke/SOLAR-10.7B-Instruct-v1.0-GGUF/resolve/main/solar-10.7b-instruct-v1.0.Q8_0.gguf".to_string()),
            empathy_model_url: env::var("EMPATHY_MODEL_URL")
                .unwrap_or_else(|_| "https://huggingface.co/bartowski/Llama-3-Lumimaid-8B-v0.1-OAS-GGUF/resolve/main/Llama-3-Lumimaid-8B-v0.1-OAS-Q6_K.gguf".to_string()),
            humor_model_url: env::var("HUMOR_MODEL_URL")
                .unwrap_or_else(|_| "https://huggingface.co/bartowski/dolphin-2.9.1-llama-3-8b-GGUF/resolve/main/dolphin-2.9.1-llama-3-8b-Q6_K.gguf".to_string()),
            model_cache_dir: env::var("MODEL_CACHE_DIR")
                .unwrap_or_else(|_| "./models".to_string()),
                
            // Blockchain Configuration
            signing_key: env::var("SIGNING_KEY")
                .map_err(|_| anyhow::anyhow!("SIGNING_KEY not set"))?,
            ethereum_rpc_url: env::var("ETHEREUM_RPC_URL")
                .unwrap_or_else(|_| "https://hyperion-testnet.metisdevops.link".to_string()),
            chain_id: env::var("CHAIN_ID")
                .unwrap_or_else(|_| "133717".to_string())
                .parse()
                .unwrap_or(133717),
            metamuse_contract_address: env::var("METAMUSE_CONTRACT_ADDRESS")
                .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string()),
            commitment_verifier_address: env::var("COMMITMENT_VERIFIER_ADDRESS")
                .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string()),
            muse_memory_contract_address: env::var("MUSE_MEMORY_CONTRACT_ADDRESS")
                .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string()),
            muse_plugins_contract_address: env::var("MUSE_PLUGINS_CONTRACT_ADDRESS")
                .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string()),
            block_explorer_url: env::var("BLOCK_EXPLORER_URL")
                .unwrap_or_else(|_| "https://hyperion-testnet-explorer.metisdevops.link".to_string()),
                
            // Storage Configuration
            ipfs_api_key: env::var("IPFS_API_KEY").ok(),
            ipfs_api_secret: env::var("IPFS_API_SECRET").ok(),
            ipfs_gateway_url: env::var("IPFS_GATEWAY_URL")
                .unwrap_or_else(|_| "https://gateway.pinata.cloud/ipfs".to_string()),
            database_url: env::var("DATABASE_URL").ok(),
        })
    }
}