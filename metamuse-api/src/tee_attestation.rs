use alith::tee::marlin::{AttestationRequest, MarlinClient};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use crate::muse_orchestrator::MuseTraits;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MuseAttestationData {
    pub muse_id: String,
    pub user_address: String,
    pub ai_response: String,
    pub personality_traits: MuseTraits,
    pub timestamp: u64,
    pub session_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TEEVerifiedResponse {
    pub response: String,
    pub attestation_hex: String,
    pub attestation_data: MuseAttestationData,
    pub tee_verified: bool,
}

pub struct MuseTEEService {
    marlin_client: MarlinClient,
}

impl MuseTEEService {
    pub fn new() -> Self {
        Self {
            marlin_client: MarlinClient::default(),
        }
    }

    /// Generate TEE attestation for AI response - WORLD'S FIRST!
    pub async fn generate_verified_response(
        &self,
        muse_id: String,
        user_address: String,
        ai_response: String,
        personality_traits: MuseTraits,
        session_id: String,
    ) -> Result<TEEVerifiedResponse> {
        let attestation_data = MuseAttestationData {
            muse_id,
            user_address,
            ai_response: ai_response.clone(),
            personality_traits,
            timestamp: current_timestamp(),
            session_id,
        };

        let attestation_payload = serde_json::to_vec(&attestation_data)?;
        
        // Generate TEE attestation proving this AI response is genuine
        let attestation_hex = match self.marlin_client
            .attestation_hex(AttestationRequest {
                user_data: Some(attestation_payload),
                ..Default::default()
            })
            .await
        {
            Ok(hex) => {
                println!("✅ TEE Attestation generated successfully");
                hex
            }
            Err(e) => {
                println!("⚠️ TEE Attestation failed: {}, continuing without TEE", e);
                "fallback_no_tee".to_string()
            }
        };

        let tee_verified = attestation_hex != "fallback_no_tee";
        
        Ok(TEEVerifiedResponse {
            response: ai_response,
            attestation_hex,
            attestation_data,
            tee_verified,
        })
    }
}

fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs()
}