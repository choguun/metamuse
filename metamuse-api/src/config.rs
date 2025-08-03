use std::env;
use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub openai_api_key: String,
    pub signing_key: String,
    pub ipfs_api_key: Option<String>,
    pub ipfs_api_secret: Option<String>,
    pub ipfs_gateway_url: String,
    pub ethereum_rpc_url: String,
    pub chain_id: u64,
    pub metamuse_contract_address: String,
    pub commitment_verifier_address: String,
    pub muse_memory_contract_address: String,
    pub muse_plugins_contract_address: String,
    pub block_explorer_url: String,
    pub database_url: Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Config {
            openai_api_key: env::var("OPENAI_API_KEY")
                .map_err(|_| anyhow::anyhow!("OPENAI_API_KEY not set"))?,
            signing_key: env::var("SIGNING_KEY")
                .map_err(|_| anyhow::anyhow!("SIGNING_KEY not set"))?,
            ipfs_api_key: env::var("IPFS_API_KEY").ok(),
            ipfs_api_secret: env::var("IPFS_API_SECRET").ok(),
            ipfs_gateway_url: env::var("IPFS_GATEWAY_URL")
                .unwrap_or_else(|_| "https://gateway.pinata.cloud/ipfs".to_string()),
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
            database_url: env::var("DATABASE_URL").ok(),
        })
    }
}