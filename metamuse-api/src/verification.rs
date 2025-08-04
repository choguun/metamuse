use anyhow::Result;
use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use secp256k1::{Secp256k1, SecretKey, Message, PublicKey};
use std::str::FromStr;
use crate::config::Config;
use crate::persist_memory::InteractionData;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifiableInteraction {
    pub muse_id: u64,
    pub muse_dna_hash: [u8; 32],
    pub user_prompt: String,
    pub ai_response: String,
    pub personality_traits: crate::muse_orchestrator::MuseTraits,
    pub timestamp: u64,
    pub inference_params: InferenceParams,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceParams {
    pub model_version: String,
    pub temperature: f32,
    pub max_tokens: u32,
    pub context_window: u32,
}

impl Default for InferenceParams {
    fn default() -> Self {
        Self {
            model_version: "gpt-4-alith".to_string(),
            temperature: 0.7,
            max_tokens: 1000,
            context_window: 4000,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionCommitment {
    pub commitment_hash: [u8; 32],
    pub signature: Vec<u8>,
    pub recovery_id: u8,
}

pub struct VerificationSystem {
    signing_key: SecretKey,
    public_key: PublicKey,
    secp: Secp256k1<secp256k1::All>,
    chain_id: u64,
    contract_address: [u8; 20],
}

impl VerificationSystem {
    pub fn new(config: &Config) -> Result<Self> {
        let signing_key = SecretKey::from_str(&config.signing_key)?;
        let secp = Secp256k1::new();
        let public_key = PublicKey::from_secret_key(&secp, &signing_key);
        
        // Parse contract address
        let contract_address = hex::decode(&config.metamuse_contract_address[2..])
            .map_err(|_| anyhow::anyhow!("Invalid contract address"))?;
        let mut addr_bytes = [0u8; 20];
        addr_bytes.copy_from_slice(&contract_address[..20]);
        
        Ok(Self {
            signing_key,
            public_key,
            secp,
            chain_id: config.chain_id,
            contract_address: addr_bytes,
        })
    }
    
    pub async fn create_commitment(
        &self,
        interaction: &VerifiableInteraction,
    ) -> Result<InteractionCommitment> {
        // Serialize interaction deterministically
        let interaction_bytes = self.serialize_interaction(interaction)?;
        let commitment_hash = Keccak256::digest(&interaction_bytes);
        
        // Create message to sign (matching contract logic)
        let sign_message = self.create_sign_message(
            interaction.muse_id,
            interaction.muse_dna_hash,
            &commitment_hash,
        );
        
        // Create Ethereum signed message
        let eth_message = self.create_eth_signed_message(&sign_message);
        
        // Sign the message
        let message = Message::from_digest_slice(&eth_message)?;
        let (recovery_id, signature) = self.secp
            .sign_ecdsa_recoverable(&message, &self.signing_key)
            .serialize_compact();
        
        Ok(InteractionCommitment {
            commitment_hash: commitment_hash.into(),
            signature: signature.to_vec(),
            recovery_id: recovery_id.to_i32() as u8,
        })
    }
    
    pub fn verify_commitment(
        &self,
        muse_id: u64,
        muse_dna_hash: [u8; 32],
        commitment_hash: &[u8; 32],
        signature: &[u8],
        recovery_id: u8,
    ) -> Result<bool> {
        // Recreate the message that should have been signed
        let sign_message = self.create_sign_message(muse_id, muse_dna_hash, commitment_hash);
        let eth_message = self.create_eth_signed_message(&sign_message);
        
        // Recover public key from signature
        let message = Message::from_digest_slice(&eth_message)?;
        let recovery_id = secp256k1::ecdsa::RecoveryId::from_i32(recovery_id as i32)?;
        let signature = secp256k1::ecdsa::RecoverableSignature::from_compact(signature, recovery_id)?;
        
        let recovered_pubkey = self.secp.recover_ecdsa(&message, &signature)?;
        
        // Check if it matches our trusted public key
        Ok(recovered_pubkey == self.public_key)
    }
    
    pub fn create_interaction_from_data(
        &self,
        muse_id: u64,
        muse_dna_hash: [u8; 32],
        interaction_data: &InteractionData,
    ) -> VerifiableInteraction {
        VerifiableInteraction {
            muse_id,
            muse_dna_hash,
            user_prompt: interaction_data.user_prompt.clone(),
            ai_response: interaction_data.ai_response.clone(),
            personality_traits: interaction_data.personality_traits.clone(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            inference_params: InferenceParams::default(),
        }
    }
    
    fn serialize_interaction(&self, interaction: &VerifiableInteraction) -> Result<Vec<u8>> {
        // Deterministic serialization for consistent hashing
        let mut data = Vec::new();
        
        data.extend_from_slice(&interaction.muse_id.to_be_bytes());
        data.extend_from_slice(&interaction.muse_dna_hash);
        data.extend_from_slice(interaction.user_prompt.as_bytes());
        data.extend_from_slice(interaction.ai_response.as_bytes());
        
        // Serialize personality traits
        data.push(interaction.personality_traits.creativity);
        data.push(interaction.personality_traits.wisdom);
        data.push(interaction.personality_traits.humor);
        data.push(interaction.personality_traits.empathy);
        
        data.extend_from_slice(&interaction.timestamp.to_be_bytes());
        
        // Serialize inference params
        data.extend_from_slice(interaction.inference_params.model_version.as_bytes());
        data.extend_from_slice(&interaction.inference_params.temperature.to_be_bytes());
        data.extend_from_slice(&interaction.inference_params.max_tokens.to_be_bytes());
        data.extend_from_slice(&interaction.inference_params.context_window.to_be_bytes());
        
        Ok(data)
    }
    
    fn create_sign_message(
        &self,
        muse_id: u64,
        muse_dna_hash: [u8; 32],
        commitment_hash: &[u8],
    ) -> Vec<u8> {
        let mut message = Vec::new();
        
        message.extend_from_slice(&muse_id.to_be_bytes());
        message.extend_from_slice(&muse_dna_hash);
        message.extend_from_slice(commitment_hash);
        message.extend_from_slice(&self.chain_id.to_be_bytes());
        message.extend_from_slice(&self.contract_address);
        
        Keccak256::digest(&message).to_vec()
    }
    
    fn create_eth_signed_message(&self, message: &[u8]) -> Vec<u8> {
        // Create Ethereum signed message format
        let prefix = format!("\x19Ethereum Signed Message:\n{}", message.len());
        let mut eth_message = Vec::new();
        eth_message.extend_from_slice(prefix.as_bytes());
        eth_message.extend_from_slice(message);
        
        Keccak256::digest(&eth_message).to_vec()
    }
    
    pub fn get_public_key_address(&self) -> String {
        // Get Ethereum address from public key
        let public_key_bytes = self.public_key.serialize_uncompressed();
        let hash = Keccak256::digest(&public_key_bytes[1..]);
        format!("0x{}", hex::encode(&hash[12..]))
    }
    
    pub fn create_commitment_hash_only(&self, interaction: &VerifiableInteraction) -> Result<[u8; 32]> {
        let interaction_bytes = self.serialize_interaction(interaction)?;
        let hash = Keccak256::digest(&interaction_bytes);
        Ok(hash.into())
    }
}

// Helper functions for blockchain integration
pub fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

pub fn bytes_to_hex_string(bytes: &[u8]) -> String {
    format!("0x{}", hex::encode(bytes))
}

pub fn hex_string_to_bytes(hex_str: &str) -> Result<Vec<u8>> {
    let hex_str = if hex_str.starts_with("0x") {
        &hex_str[2..]
    } else {
        hex_str
    };
    
    hex::decode(hex_str).map_err(|e| anyhow::anyhow!("Invalid hex string: {}", e))
}
