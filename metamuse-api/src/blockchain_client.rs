use anyhow::Result;
use ethers::{
    core::types::{Address, U256, Bytes, Filter, Log},
    middleware::SignerMiddleware,
    providers::{Provider, Http, Middleware, StreamExt},
    signers::{LocalWallet, Signer},
    contract::abigen,
    utils::{format_ether, parse_ether},
};
use serde::{Deserialize, Serialize};
use std::{sync::Arc, str::FromStr, collections::HashMap};
use tokio::sync::RwLock;
use crate::{config::Config, muse_orchestrator::MuseTraits};

// ✅ NEW: AI Alignment Market data structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MuseBlockchainStats {
    pub total_ratings: u64,
    pub average_quality: u64,    // Scaled by 100 on blockchain
    pub average_personality: u64, // Scaled by 100 on blockchain  
    pub average_helpfulness: u64, // Scaled by 100 on blockchain
    pub total_rewards: u64,
    pub last_updated: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformBlockchainStats {
    pub total_users: u64,
    pub total_ratings: u64,
    pub total_rewards_distributed: u64,
    pub active_muses: u64,
}

// Generate contract bindings from ABI
abigen!(
    MetaMuseContract,
    r#"[
        {
            "inputs": [
                {"internalType": "uint8", "name": "_creativity", "type": "uint8"},
                {"internalType": "uint8", "name": "_wisdom", "type": "uint8"},
                {"internalType": "uint8", "name": "_humor", "type": "uint8"},
                {"internalType": "uint8", "name": "_empathy", "type": "uint8"}
            ],
            "name": "createMuse",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "_tokenId", "type": "uint256"},
                {"internalType": "bytes32", "name": "_commitmentHash", "type": "bytes32"}
            ],
            "name": "commitInteraction",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "_tokenId", "type": "uint256"},
                {"internalType": "bytes32", "name": "_commitmentHash", "type": "bytes32"},
                {"internalType": "bytes", "name": "_signature", "type": "bytes"}
            ],
            "name": "verifyInteraction",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "uint256", "name": "_tokenId", "type": "uint256"}],
            "name": "getMuseData",
            "outputs": [
                {"internalType": "uint8", "name": "creativity", "type": "uint8"},
                {"internalType": "uint8", "name": "wisdom", "type": "uint8"},
                {"internalType": "uint8", "name": "humor", "type": "uint8"},
                {"internalType": "uint8", "name": "empathy", "type": "uint8"},
                {"internalType": "bytes32", "name": "dnaHash", "type": "bytes32"},
                {"internalType": "uint256", "name": "birthBlock", "type": "uint256"},
                {"internalType": "uint256", "name": "totalInteractions", "type": "uint256"},
                {"internalType": "address", "name": "owner", "type": "address"}
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "_tokenId", "type": "uint256"},
                {"internalType": "address", "name": "_user", "type": "address"}
            ],
            "name": "canInteract",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
                {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
                {"indexed": false, "internalType": "bytes32", "name": "dnaHash", "type": "bytes32"},
                {"indexed": false, "internalType": "uint8", "name": "creativity", "type": "uint8"},
                {"indexed": false, "internalType": "uint8", "name": "wisdom", "type": "uint8"},
                {"indexed": false, "internalType": "uint8", "name": "humor", "type": "uint8"},
                {"indexed": false, "internalType": "uint8", "name": "empathy", "type": "uint8"}
            ],
            "name": "MuseCreated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
                {"indexed": true, "internalType": "bytes32", "name": "commitmentHash", "type": "bytes32"},
                {"indexed": true, "internalType": "address", "name": "user", "type": "address"}
            ],
            "name": "InteractionCommitted",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
                {"indexed": true, "internalType": "bytes32", "name": "commitmentHash", "type": "bytes32"},
                {"indexed": false, "internalType": "uint256", "name": "verificationTime", "type": "uint256"}
            ],
            "name": "InteractionVerified",
            "type": "event"
        }
    ]"#
);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MuseData {
    pub token_id: u64,
    pub creativity: u8,
    pub wisdom: u8,
    pub humor: u8,
    pub empathy: u8,
    pub dna_hash: String,
    pub birth_block: u64,
    pub total_interactions: u64,
    pub owner: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionInfo {
    pub hash: String,
    pub block_number: Option<u64>,
    pub gas_used: Option<u64>,
    pub status: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventData {
    pub event_type: String,
    pub token_id: Option<u64>,
    pub commitment_hash: Option<String>,
    pub user_address: Option<String>,
    pub block_number: u64,
    pub transaction_hash: String,
}

type SignerClient = SignerMiddleware<Provider<Http>, LocalWallet>;

pub struct BlockchainClient {
    client: Arc<SignerClient>,
    contract: MetaMuseContract<SignerClient>,
    contract_address: Address,
    // Cache for frequently accessed muse data
    muse_cache: RwLock<HashMap<u64, MuseData>>,
}

impl BlockchainClient {
    pub async fn new(config: &Config) -> Result<Self> {
        // Create provider
        let provider = Provider::<Http>::try_from(&config.ethereum_rpc_url)?;
        
        // Create wallet from private key
        let wallet = LocalWallet::from_str(&config.signing_key)?
            .with_chain_id(config.chain_id);
        
        // Create signing client
        let client = Arc::new(SignerMiddleware::new(provider, wallet));
        
        // Parse contract address
        let contract_address = Address::from_str(&config.metamuse_contract_address)?;
        
        // Create contract instance
        let contract = MetaMuseContract::new(contract_address, client.clone());
        
        Ok(Self {
            client,
            contract,
            contract_address,
            muse_cache: RwLock::new(HashMap::new()),
        })
    }
    
    /// Create a new Muse NFT on the blockchain
    pub async fn create_muse(&self, traits: &MuseTraits) -> Result<(u64, TransactionInfo)> {
        let call = self.contract.create_muse(
            traits.creativity,
            traits.wisdom,
            traits.humor,
            traits.empathy,
        );
        
        // Estimate gas and set reasonable gas limit
        let gas_estimate = call.estimate_gas().await?;
        let gas_limit = gas_estimate * 120 / 100; // 20% buffer
        
        // Send transaction
        let call_with_gas = call.gas(gas_limit);
        let pending_tx = call_with_gas.send().await?;
        let tx_hash = pending_tx.tx_hash();
        
        // Wait for confirmation
        let receipt = pending_tx.await?.ok_or_else(|| {
            anyhow::anyhow!("Transaction failed")
        })?;
        
        // Extract token ID from MuseCreated event
        let token_id = self.extract_token_id_from_receipt(&receipt)?;
        
        let tx_info = TransactionInfo {
            hash: format!("{:?}", tx_hash),
            block_number: receipt.block_number.map(|n| n.as_u64()),
            gas_used: receipt.gas_used.map(|g| g.as_u64()),
            status: receipt.status == Some(1.into()),
        };
        
        // Clear cache to force refresh
        self.muse_cache.write().await.remove(&token_id);
        
        Ok((token_id, tx_info))
    }
    
    /// Get Muse data from blockchain (with caching)
    pub async fn get_muse_data(&self, token_id: u64) -> Result<MuseData> {
        // Check cache first
        {
            let cache = self.muse_cache.read().await;
            if let Some(cached_data) = cache.get(&token_id) {
                return Ok(cached_data.clone());
            }
        }
        
        // Fetch from blockchain
        let muse_data = self.contract.get_muse_data(U256::from(token_id)).call().await?;
        
        let data = MuseData {
            token_id,
            creativity: muse_data.0,
            wisdom: muse_data.1,
            humor: muse_data.2,
            empathy: muse_data.3,
            dna_hash: format!("0x{}", hex::encode(muse_data.4)),
            birth_block: muse_data.5.as_u64(),
            total_interactions: muse_data.6.as_u64(),
            owner: format!("{:?}", muse_data.7),
        };
        
        // Cache the result
        self.muse_cache.write().await.insert(token_id, data.clone());
        
        Ok(data)
    }
    
    /// Check if a user can interact with a specific Muse
    pub async fn can_interact(&self, token_id: u64, user_address: &str) -> Result<bool> {
        let user_addr = Address::from_str(user_address)?;
        let can_interact = self.contract
            .can_interact(U256::from(token_id), user_addr)
            .call()
            .await?;
        
        Ok(can_interact)
    }
    
    /// Commit an interaction to the blockchain
    pub async fn commit_interaction(
        &self,
        token_id: u64,
        commitment_hash: &[u8; 32],
    ) -> Result<TransactionInfo> {
        let commitment_hash_bytes = commitment_hash.clone();
        
        let call = self.contract.commit_interaction(
            U256::from(token_id),
            commitment_hash_bytes,
        );
        
        // Estimate gas and send transaction
        let gas_estimate = call.estimate_gas().await?;
        let gas_limit = gas_estimate * 120 / 100;
        
        let call_with_gas = call.gas(gas_limit);
        let pending_tx = call_with_gas.send().await?;
        let tx_hash = pending_tx.tx_hash();
        
        let receipt = pending_tx.await?.ok_or_else(|| {
            anyhow::anyhow!("Transaction failed")
        })?;
        
        Ok(TransactionInfo {
            hash: format!("{:?}", tx_hash),
            block_number: receipt.block_number.map(|n| n.as_u64()),
            gas_used: receipt.gas_used.map(|g| g.as_u64()),
            status: receipt.status == Some(1.into()),
        })
    }
    
    /// Verify an interaction on the blockchain
    pub async fn verify_interaction(
        &self,
        token_id: u64,
        commitment_hash: &[u8; 32],
        signature: &[u8],
    ) -> Result<TransactionInfo> {
        let commitment_hash_bytes = commitment_hash.clone();
        let signature_bytes = Bytes::from(signature.to_vec());
        
        let call = self.contract.verify_interaction(
            U256::from(token_id),
            commitment_hash_bytes,
            signature_bytes,
        );
        
        let gas_estimate = call.estimate_gas().await?;
        let gas_limit = gas_estimate * 120 / 100;
        
        let call_with_gas = call.gas(gas_limit);
        let pending_tx = call_with_gas.send().await?;
        let tx_hash = pending_tx.tx_hash();
        
        let receipt = pending_tx.await?.ok_or_else(|| {
            anyhow::anyhow!("Transaction failed")
        })?;
        
        // Invalidate cache for this muse since interaction count changed
        self.muse_cache.write().await.remove(&token_id);
        
        Ok(TransactionInfo {
            hash: format!("{:?}", tx_hash),
            block_number: receipt.block_number.map(|n| n.as_u64()),
            gas_used: receipt.gas_used.map(|g| g.as_u64()),
            status: receipt.status == Some(1.into()),
        })
    }
    
    /// Listen for events from the MetaMuse contract
    pub async fn listen_for_events<F>(&self, mut event_handler: F) -> Result<()>
    where
        F: FnMut(EventData) -> Result<()> + Send + 'static,
    {
        // Create filter for all MetaMuse contract events
        let filter = Filter::new()
            .address(self.contract_address)
            .from_block(ethers::types::BlockNumber::Latest);
        
        let mut stream = self.client.watch(&filter).await?;
        
        println!("🔔 Starting event listener for MetaMuse contract at {}", self.contract_address);
        
        // Listen for events in a loop
        while let Some(log) = stream.next().await {
            if let Ok(event_data) = self.parse_log_to_event(&log).await {
                println!("📅 New event: {:?}", event_data);
                
                // Call the event handler
                if let Err(e) = event_handler(event_data) {
                    eprintln!("❌ Error handling event: {}", e);
                }
                
                // Process specific event types
                if let Err(e) = self.process_blockchain_event(&log).await {
                    eprintln!("❌ Error processing blockchain event: {}", e);
                }
            }
        }
        
        Ok(())
    }
    
    /// Get recent events for a specific Muse
    pub async fn get_muse_events(&self, token_id: u64, from_block: Option<u64>) -> Result<Vec<EventData>> {
        let from_block = from_block.unwrap_or(0);
        
        let filter = Filter::new()
            .address(self.contract_address)
            .topic1(U256::from(token_id)) // Filter by token ID
            .from_block(from_block);
        
        let logs = self.client.get_logs(&filter).await?;
        
        let mut events = Vec::new();
        for log in logs {
            if let Ok(event_data) = self.parse_log_to_event(&log).await {
                events.push(event_data);
            }
        }
        
        Ok(events)
    }
    
    /// Get current gas price for transaction estimation
    pub async fn get_gas_price(&self) -> Result<U256> {
        let gas_price = self.client.get_gas_price().await?;
        Ok(gas_price)
    }
    
    /// Get account balance
    pub async fn get_balance(&self) -> Result<String> {
        let address = self.client.default_sender().unwrap_or_default();
        let balance = self.client.get_balance(address, None).await?;
        Ok(format_ether(balance))
    }
    
    // Helper methods
    
    fn extract_token_id_from_receipt(&self, receipt: &ethers::types::TransactionReceipt) -> Result<u64> {
        for log in &receipt.logs {
            // Look for MuseCreated event
            if log.topics.len() >= 2 && log.address == self.contract_address {
                // First topic is event signature, second is token ID
                let token_id = U256::from(log.topics[1].0).as_u64();
                return Ok(token_id);
            }
        }
        Err(anyhow::anyhow!("Token ID not found in transaction receipt"))
    }
    
    async fn process_blockchain_event(&self, log: &Log) -> Result<()> {
        // Process different event types based on event signature
        if log.topics.is_empty() {
            return Ok(());
        }
        
        let event_signature = log.topics[0];
        
        // Event signatures (first 4 bytes of keccak256 hash of event signature)
        // These would match the actual event signatures from the contract
        match format!("{:?}", event_signature).as_str() {
            sig if sig.contains("MuseCreated") => {
                self.handle_muse_created_event(log).await?;
            }
            sig if sig.contains("InteractionCommitted") => {
                self.handle_interaction_committed_event(log).await?;
            }
            sig if sig.contains("InteractionVerified") => {
                self.handle_interaction_verified_event(log).await?;
            }
            _ => {
                println!("📋 Unknown event signature: {:?}", event_signature);
            }
        }
        
        Ok(())
    }
    
    async fn handle_muse_created_event(&self, log: &Log) -> Result<()> {
        if log.topics.len() >= 2 {
            let token_id = U256::from(log.topics[1].0).as_u64();
            let creator = if log.topics.len() > 2 {
                format!("{:?}", log.topics[2])
            } else {
                "unknown".to_string()
            };
            
            println!("🎨 New Muse created! Token ID: {}, Creator: {}", token_id, creator);
            
            // Clear cache for this muse to ensure fresh data
            self.muse_cache.write().await.remove(&token_id);
            
            // Here you could:
            // - Send notifications
            // - Update database
            // - Trigger other services
        }
        
        Ok(())
    }
    
    async fn handle_interaction_committed_event(&self, log: &Log) -> Result<()> {
        if log.topics.len() >= 3 {
            let token_id = U256::from(log.topics[1].0).as_u64();
            let commitment_hash = format!("{:?}", log.topics[2]);
            
            println!("💭 Interaction committed for Muse {}: {}", token_id, commitment_hash);
            
            // Here you could:
            // - Update pending interaction status
            // - Notify frontend via WebSocket
            // - Store interaction metadata
        }
        
        Ok(())
    }
    
    async fn handle_interaction_verified_event(&self, log: &Log) -> Result<()> {
        if log.topics.len() >= 3 {
            let token_id = U256::from(log.topics[1].0).as_u64();
            let commitment_hash = format!("{:?}", log.topics[2]);
            
            println!("✅ Interaction verified for Muse {}: {}", token_id, commitment_hash);
            
            // Clear cache to refresh interaction count
            self.muse_cache.write().await.remove(&token_id);
            
            // Here you could:
            // - Update interaction status
            // - Notify completion to frontend
            // - Update analytics
        }
        
        Ok(())
    }
    
    async fn parse_log_to_event(&self, log: &Log) -> Result<EventData> {
        // Parse log based on event signature
        if log.topics.is_empty() {
            return Err(anyhow::anyhow!("No topics in log"));
        }
        
        let event_signature = log.topics[0];
        
        // Basic event parsing - in production would use proper ABI decoding
        let event_data = EventData {
            event_type: format!("{:?}", event_signature),
            token_id: if log.topics.len() > 1 {
                Some(U256::from(log.topics[1].0).as_u64())
            } else {
                None
            },
            commitment_hash: if log.topics.len() > 2 {
                Some(format!("{:?}", log.topics[2]))
            } else {
                None
            },
            user_address: if log.topics.len() > 3 {
                Some(format!("{:?}", log.topics[3]))
            } else {
                None
            },
            block_number: log.block_number.unwrap_or_default().as_u64(),
            transaction_hash: format!("{:?}", log.transaction_hash.unwrap_or_default()),
        };
        
        Ok(event_data)
    }
    
    // ✅ NEW: AI Alignment Market blockchain integration
    pub async fn submit_interaction_rating(
        &self,
        muse_id: u64,
        interaction_hash: &str,
        quality_score: u8,
        personality_accuracy: u8,
        helpfulness: u8,
        feedback: &str,
    ) -> Result<String> {
        println!("🏪 Submitting rating to blockchain for muse #{}", muse_id);
        println!("   Scores: Q={}, P={}, H={}", quality_score, personality_accuracy, helpfulness);
        
        // For hackathon demo, return mock transaction hash
        let mock_tx_hash = format!("0x{:064x}", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos() % (u64::MAX as u128)
        );
        
        println!("✅ Mock rating transaction: {}", mock_tx_hash);
        Ok(mock_tx_hash)
    }

    pub async fn get_muse_stats(&self, muse_id: u64) -> Result<MuseBlockchainStats> {
        println!("📊 Fetching blockchain stats for muse #{}", muse_id);
        
        // Return mock stats for demo
        Ok(MuseBlockchainStats {
            total_ratings: 15,
            average_quality: 820, // Scaled by 100
            average_personality: 760,
            average_helpfulness: 850,
            total_rewards: 195,
            last_updated: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }

    pub async fn get_platform_stats(&self) -> Result<PlatformBlockchainStats> {
        println!("🌐 Fetching platform blockchain statistics");
        
        Ok(PlatformBlockchainStats {
            total_users: 47,
            total_ratings: 234,
            total_rewards_distributed: 3018,
            active_muses: 8,
        })
    }

    pub async fn check_user_rating(&self, user_address: &str, muse_id: u64, interaction_hash: &str) -> Result<bool> {
        println!("🔍 Checking if user {} has rated muse {} interaction", user_address, muse_id);
        
        // For demo, return false to allow all ratings
        Ok(false)
    }

    pub async fn get_user_rewards(&self, user_address: &str) -> Result<u64> {
        println!("💰 Fetching user rewards for {}", user_address);
        
        // Mock user rewards based on address hash for consistency
        let hash_sum: u64 = user_address.chars()
            .map(|c| c as u64)
            .sum();
        
        let mock_rewards = (hash_sum % 200) + 10; // 10-209 MUSE tokens
        Ok(mock_rewards)
    }
}

// Utility functions for blockchain integration
pub fn wei_to_ether(wei: U256) -> String {
    format_ether(wei)
}

pub fn ether_to_wei(ether: &str) -> Result<U256> {
    parse_ether(ether).map_err(|e| anyhow::anyhow!("Failed to parse ether: {}", e))
}
