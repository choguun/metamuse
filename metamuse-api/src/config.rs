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
    pub metamuse_contract_address: String,
    pub commitment_verifier_address: String,
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
                .unwrap_or_else(|_| "http://localhost:8545".to_string()),
            metamuse_contract_address: env::var("METAMUSE_CONTRACT_ADDRESS")
                .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string()),
            commitment_verifier_address: env::var("COMMITMENT_VERIFIER_ADDRESS")
                .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string()),
            database_url: env::var("DATABASE_URL").ok(),
        })
    }
}