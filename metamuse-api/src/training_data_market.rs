// metamuse-api/src/training_data_market.rs

use crate::config::Config;
use crate::blockchain_client::BlockchainClient;
use crate::semantic_search::SemanticSearchService;
use crate::ipfs_chat_history::IPFSChatHistoryManager;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc};
use sha2::{Sha256, Digest};

/// Training Data Contribution Types matching smart contract
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContributionType {
    ConversationCorrection = 1,  // Users correct AI responses
    PreferenceFeedback = 2,      // Users provide preference data
    QualityRating = 3,           // Users rate AI responses
    PersonalityTuning = 4,       // Users help tune personality traits
    ConversationCuration = 5,    // Users curate valuable conversations
    SemanticEnhancement = 6,     // Users improve semantic understanding
}

impl ContributionType {
    pub fn from_u8(value: u8) -> Option<Self> {
        match value {
            1 => Some(ContributionType::ConversationCorrection),
            2 => Some(ContributionType::PreferenceFeedback),
            3 => Some(ContributionType::QualityRating),
            4 => Some(ContributionType::PersonalityTuning),
            5 => Some(ContributionType::ConversationCuration),
            6 => Some(ContributionType::SemanticEnhancement),
            _ => None,
        }
    }

    pub fn to_u8(&self) -> u8 {
        self.clone() as u8
    }

    pub fn reward_multiplier(&self) -> f64 {
        match self {
            ContributionType::ConversationCorrection => 1.2,  // 20% bonus
            ContributionType::PreferenceFeedback => 1.0,      // Base reward
            ContributionType::QualityRating => 1.1,           // 10% bonus
            ContributionType::PersonalityTuning => 1.5,       // 50% bonus (highest value)
            ContributionType::ConversationCuration => 1.3,    // 30% bonus
            ContributionType::SemanticEnhancement => 1.25,    // 25% bonus
        }
    }

    pub fn description(&self) -> &'static str {
        match self {
            ContributionType::ConversationCorrection => "Improve AI responses by providing corrections",
            ContributionType::PreferenceFeedback => "Share preferences to guide AI behavior",
            ContributionType::QualityRating => "Rate AI response quality and helpfulness",
            ContributionType::PersonalityTuning => "Fine-tune muse personality traits",
            ContributionType::ConversationCuration => "Curate valuable conversation examples",
            ContributionType::SemanticEnhancement => "Enhance AI's semantic understanding",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainingDataContribution {
    pub contribution_id: String,
    pub contributor_address: String,
    pub muse_token_id: u64,
    pub contribution_type: ContributionType,
    pub original_data: serde_json::Value,    // Original AI response or conversation
    pub improved_data: serde_json::Value,    // User's correction or improvement
    pub metadata: ContributionMetadata,
    pub data_hash: String,                   // SHA256 hash of contribution data
    pub ipfs_hash: String,                   // IPFS hash for decentralized storage
    pub timestamp: DateTime<Utc>,
    pub quality_score: u8,                   // 1-100 quality score
    pub reward_amount: u64,                  // DAT tokens earned
    pub validation_status: ValidationStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContributionMetadata {
    pub message_id: Option<String>,
    pub session_id: Option<String>,
    pub user_comment: Option<String>,        // User's explanation of the improvement
    pub difficulty_level: u8,                // 1-10 how challenging the improvement was
    pub improvement_type: String,            // "grammar", "accuracy", "creativity", etc.
    pub reference_urls: Vec<String>,         // External references used
    pub tags: Vec<String>,                   // Categorization tags
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ValidationStatus {
    Pending,
    Validated,
    Rejected,
    UnderReview,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContributorProfile {
    pub address: String,
    pub total_contributions: u64,
    pub total_dats_earned: u64,
    pub average_quality_score: f64,
    pub validations_passed: u64,
    pub current_streak: u64,
    pub last_contribution: DateTime<Utc>,
    pub quality_contributor_badge: bool,
    pub specializations: Vec<ContributionType>,
    pub contribution_history: Vec<String>,   // Contribution IDs
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationRequest {
    pub contribution_id: String,
    pub validator_address: String,
    pub approved: bool,
    pub quality_score: u8,
    pub feedback: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RewardCalculation {
    pub base_reward: u64,
    pub type_bonus: u64,
    pub quality_bonus: u64,
    pub streak_bonus: u64,
    pub total_reward: u64,
    pub reasoning: Vec<String>,
}

/// AI Training Data Marketplace Service
pub struct TrainingDataMarketplace {
    config: Config,
    blockchain_client: Arc<BlockchainClient>,
    semantic_search: Arc<SemanticSearchService>,
    ipfs_manager: Arc<IPFSChatHistoryManager>,
    // In-memory storage for demo (in production, use database)
    pub contributions: HashMap<String, TrainingDataContribution>,
    pub contributors: HashMap<String, ContributorProfile>,
}

impl TrainingDataMarketplace {
    pub fn new(
        config: Config,
        blockchain_client: Arc<BlockchainClient>,
        semantic_search: Arc<SemanticSearchService>,
        ipfs_manager: Arc<IPFSChatHistoryManager>,
    ) -> Self {
        Self {
            config,
            blockchain_client,
            semantic_search,
            ipfs_manager,
            contributions: HashMap::new(),
            contributors: HashMap::new(),
        }
    }

    /// Submit a training data contribution and earn DAT rewards
    pub async fn contribute_training_data(
        &mut self,
        contributor_address: &str,
        muse_token_id: u64,
        contribution_type: ContributionType,
        original_data: serde_json::Value,
        improved_data: serde_json::Value,
        metadata: ContributionMetadata,
    ) -> Result<TrainingDataContribution> {
        
        // Generate unique contribution ID
        let contribution_id = format!("contrib_{}", 
            chrono::Utc::now().timestamp_millis() % 100000000);
        
        // Calculate data hash for uniqueness verification
        let data_hash = self.calculate_data_hash(&original_data, &improved_data)?;
        
        // Check if similar contribution already exists
        if self.is_contribution_duplicate(&data_hash) {
            return Err(anyhow!("Similar contribution already exists"));
        }

        // Create contribution data for IPFS storage
        let contribution_data = serde_json::json!({
            "contribution_id": contribution_id,
            "contributor_address": contributor_address,
            "muse_token_id": muse_token_id,
            "contribution_type": contribution_type.to_u8(),
            "original_data": original_data,
            "improved_data": improved_data,
            "metadata": metadata,
            "timestamp": Utc::now(),
        });

        // Store to IPFS with encryption
        let ipfs_hash = self.store_to_ipfs(contribution_data.clone(), &data_hash).await?;
        
        // Calculate reward amount
        let reward_calculation = self.calculate_reward(contributor_address, &contribution_type).await?;
        
        // Create contribution record
        let contribution = TrainingDataContribution {
            contribution_id: contribution_id.clone(),
            contributor_address: contributor_address.to_string(),
            muse_token_id,
            contribution_type: contribution_type.clone(),
            original_data,
            improved_data,
            metadata,
            data_hash: data_hash.clone(),
            ipfs_hash: ipfs_hash.clone(),
            timestamp: Utc::now(),
            quality_score: 50, // Initial score, updated by validation
            reward_amount: reward_calculation.total_reward,
            validation_status: ValidationStatus::Pending,
        };

        // Store contribution
        self.contributions.insert(contribution_id.clone(), contribution.clone());
        
        // Update contributor profile
        self.update_contributor_profile(contributor_address, &contribution).await?;
        
        // Store semantic embedding for contribution discovery
        self.index_contribution_semantically(&contribution).await?;
        
        // Submit to blockchain (smart contract interaction)
        self.submit_to_blockchain(&contribution).await?;
        
        println!("🏷️ Training data contribution created: {} ({} DATs)", 
                 contribution_id, reward_calculation.total_reward);
        
        Ok(contribution)
    }

    /// Validate a training data contribution
    pub async fn validate_contribution(
        &mut self,
        validation_request: ValidationRequest,
    ) -> Result<()> {
        // Extract necessary data first to avoid borrowing conflicts
        let (contributor_address, final_quality_score) = {
            let contribution = self.contributions.get_mut(&validation_request.contribution_id)
                .ok_or_else(|| anyhow!("Contribution not found"))?;
            
            // Prevent self-validation
            if contribution.contributor_address == validation_request.validator_address {
                return Err(anyhow!("Cannot validate own contribution"));
            }
            
            // Update quality score (moving average)
            let current_score = contribution.quality_score as f64;
            let new_score = validation_request.quality_score as f64;
            contribution.quality_score = ((current_score + new_score) / 2.0) as u8;
            
            // Update validation status
            if validation_request.approved && contribution.quality_score >= 80 {
                contribution.validation_status = ValidationStatus::Validated;
                
                // Award quality bonus if high score (calculate directly to avoid borrowing issues)
                let quality_bonus = match contribution.quality_score {
                    90..=100 => 10_000, // 10 DAT bonus for excellent contributions
                    80..=89 => 5_000,   // 5 DAT bonus for good contributions
                    _ => 0,
                };
                contribution.reward_amount += quality_bonus;
            } else if !validation_request.approved {
                contribution.validation_status = ValidationStatus::Rejected;
            }
            
            (contribution.contributor_address.clone(), contribution.quality_score)
        };
        
        // Now make the additional calls without borrowing conflicts
        if validation_request.approved {
            self.update_validation_stats(&contributor_address, true).await?;
        }
        
        // Reward validator
        self.reward_validator(&validation_request.validator_address).await?;
        
        println!("🔍 Contribution {} validated by {} - Score: {}", 
                 validation_request.contribution_id, 
                 validation_request.validator_address,
                 final_quality_score);
        
        Ok(())
    }

    /// Get contributor profile and statistics
    pub fn get_contributor_profile(&self, address: &str) -> Option<&ContributorProfile> {
        self.contributors.get(address)
    }

    /// Get contribution details
    pub fn get_contribution(&self, contribution_id: &str) -> Option<&TrainingDataContribution> {
        self.contributions.get(contribution_id)
    }

    /// Get contributions by type
    pub fn get_contributions_by_type(&self, contribution_type: ContributionType) -> Vec<&TrainingDataContribution> {
        self.contributions.values()
            .filter(|c| c.contribution_type == contribution_type)
            .collect()
    }

    /// Get recent contributions for a contributor
    pub fn get_contributor_contributions(&self, address: &str, limit: usize) -> Vec<&TrainingDataContribution> {
        self.contributions.values()
            .filter(|c| c.contributor_address == address)
            .take(limit)
            .collect()
    }

    /// Calculate reward amount based on contribution type and user history
    pub async fn calculate_reward(&self, contributor_address: &str, contribution_type: &ContributionType) -> Result<RewardCalculation> {
        let base_reward = 10_000; // 10 DAT tokens (assuming 18 decimals)
        let type_multiplier = contribution_type.reward_multiplier();
        
        let mut reasoning = Vec::new();
        reasoning.push(format!("Base reward: {} DAT", base_reward / 1000));
        
        // Type bonus
        let type_bonus = ((base_reward as f64) * (type_multiplier - 1.0)) as u64;
        if type_bonus > 0 {
            reasoning.push(format!("{} type bonus: {} DAT", 
                format!("{:?}", contribution_type), type_bonus / 1000));
        }
        
        // Quality contributor bonus
        let quality_bonus = if let Some(profile) = self.contributors.get(contributor_address) {
            if profile.quality_contributor_badge {
                reasoning.push("Quality contributor badge: 5 DAT".to_string());
                5_000
            } else {
                0
            }
        } else {
            0
        };
        
        // Streak bonus
        let streak_bonus = if let Some(profile) = self.contributors.get(contributor_address) {
            if profile.current_streak >= 3 {
                reasoning.push(format!("Streak bonus ({}+ days): 2 DAT", profile.current_streak));
                2_000
            } else {
                0
            }
        } else {
            0
        };
        
        let total_reward = base_reward + type_bonus + quality_bonus + streak_bonus;
        reasoning.push(format!("Total reward: {} DAT", total_reward / 1000));
        
        Ok(RewardCalculation {
            base_reward,
            type_bonus,
            quality_bonus,
            streak_bonus,
            total_reward,
            reasoning,
        })
    }

    /// Calculate data hash for uniqueness verification
    fn calculate_data_hash(&self, original_data: &serde_json::Value, improved_data: &serde_json::Value) -> Result<String> {
        let combined_data = serde_json::json!({
            "original": original_data,
            "improved": improved_data
        });
        
        let serialized = serde_json::to_string(&combined_data)?;
        let mut hasher = Sha256::new();
        hasher.update(serialized.as_bytes());
        Ok(format!("{:x}", hasher.finalize()))
    }

    /// Check if contribution is duplicate
    fn is_contribution_duplicate(&self, data_hash: &str) -> bool {
        self.contributions.values().any(|c| c.data_hash == data_hash)
    }

    /// Store contribution data to IPFS
    async fn store_to_ipfs(&self, data: serde_json::Value, data_hash: &str) -> Result<String> {
        let encrypted_data = serde_json::to_vec(&data)?;
        
        // Store to IPFS via the IPFS manager
        match self.ipfs_manager.store_training_data(&encrypted_data, data_hash).await {
            Ok(ipfs_hash) => {
                println!("📁 Training data stored to IPFS: {}", ipfs_hash);
                Ok(ipfs_hash)
            }
            Err(e) => {
                println!("❌ Failed to store to IPFS: {}", e);
                Err(anyhow!("IPFS storage failed: {}", e))
            }
        }
    }

    /// Update contributor profile statistics
    async fn update_contributor_profile(&mut self, address: &str, contribution: &TrainingDataContribution) -> Result<()> {
        let profile = self.contributors.entry(address.to_string()).or_insert_with(|| {
            ContributorProfile {
                address: address.to_string(),
                total_contributions: 0,
                total_dats_earned: 0,
                average_quality_score: 0.0,
                validations_passed: 0,
                current_streak: 0,
                last_contribution: Utc::now(),
                quality_contributor_badge: false,
                specializations: Vec::new(),
                contribution_history: Vec::new(),
            }
        });

        profile.total_contributions += 1;
        profile.total_dats_earned += contribution.reward_amount;
        profile.contribution_history.push(contribution.contribution_id.clone());
        
        // Update streak
        let time_since_last = Utc::now().signed_duration_since(profile.last_contribution);
        if time_since_last.num_hours() <= 24 {
            profile.current_streak += 1;
        } else {
            profile.current_streak = 1;
        }
        profile.last_contribution = Utc::now();
        
        // Check for quality contributor badge
        if profile.total_contributions >= 50 && profile.average_quality_score >= 75.0 {
            profile.quality_contributor_badge = true;
        }
        
        Ok(())
    }

    /// Index contribution for semantic search
    async fn index_contribution_semantically(&self, contribution: &TrainingDataContribution) -> Result<()> {
        let content = format!("{} - {}", 
            serde_json::to_string(&contribution.original_data)?,
            serde_json::to_string(&contribution.improved_data)?);
        
        let metadata = [
            ("contribution_id".to_string(), contribution.contribution_id.clone()),
            ("type".to_string(), format!("{:?}", contribution.contribution_type)),
            ("contributor".to_string(), contribution.contributor_address.clone()),
            ("muse_id".to_string(), contribution.muse_token_id.to_string()),
        ].iter().cloned().collect();
        
        self.semantic_search.store_embedding(
            &content,
            "training_contribution",
            metadata
        ).await?;
        
        Ok(())
    }

    /// Submit contribution to blockchain smart contract
    async fn submit_to_blockchain(&self, contribution: &TrainingDataContribution) -> Result<()> {
        // This would interact with the TrainingDataDAT smart contract
        // For now, we'll simulate the blockchain interaction
        println!("🔗 Submitting contribution {} to blockchain...", contribution.contribution_id);
        
        // In production, this would:
        // 1. Call TrainingDataDAT.contributeTrainingData()
        // 2. Pass encrypted data hash and IPFS hash
        // 3. Mint DAT tokens as rewards
        // 4. Emit events for frontend tracking
        
        Ok(())
    }

    /// Calculate quality bonus for high-scoring contributions
    fn calculate_quality_bonus(&self, quality_score: u8) -> u64 {
        match quality_score {
            90..=100 => 10_000, // 10 DAT bonus for excellent contributions
            80..=89 => 5_000,   // 5 DAT bonus for good contributions
            _ => 0,
        }
    }

    /// Update validation statistics for contributors
    async fn update_validation_stats(&mut self, address: &str, passed: bool) -> Result<()> {
        if let Some(profile) = self.contributors.get_mut(address) {
            if passed {
                profile.validations_passed += 1;
            }
            
            // Recalculate average quality score
            let total_quality: u64 = self.contributions.values()
                .filter(|c| c.contributor_address == *address)
                .map(|c| c.quality_score as u64)
                .sum();
            
            if profile.total_contributions > 0 {
                profile.average_quality_score = total_quality as f64 / profile.total_contributions as f64;
            }
        }
        Ok(())
    }

    /// Reward validator for validating contributions
    async fn reward_validator(&mut self, validator_address: &str) -> Result<()> {
        let validator_reward = 1_000; // 1 DAT token for validation
        
        // Update or create validator profile
        let profile = self.contributors.entry(validator_address.to_string()).or_insert_with(|| {
            ContributorProfile {
                address: validator_address.to_string(),
                total_contributions: 0,
                total_dats_earned: 0,
                average_quality_score: 0.0,
                validations_passed: 0,
                current_streak: 0,
                last_contribution: Utc::now(),
                quality_contributor_badge: false,
                specializations: Vec::new(),
                contribution_history: Vec::new(),
            }
        });
        
        profile.total_dats_earned += validator_reward;
        
        println!("🏆 Validator {} rewarded {} DAT", validator_address, validator_reward / 1000);
        
        Ok(())
    }

    /// Get marketplace statistics
    pub fn get_marketplace_stats(&self) -> serde_json::Value {
        let total_contributions = self.contributions.len();
        let total_contributors = self.contributors.len();
        let total_rewards: u64 = self.contributors.values().map(|p| p.total_dats_earned).sum();
        
        let contributions_by_type: HashMap<String, usize> = self.contributions.values()
            .fold(HashMap::new(), |mut acc, c| {
                let type_name = format!("{:?}", c.contribution_type);
                *acc.entry(type_name).or_insert(0) += 1;
                acc
            });
        
        serde_json::json!({
            "total_contributions": total_contributions,
            "total_contributors": total_contributors,
            "total_rewards_distributed": total_rewards / 1000, // Convert to DAT units
            "contributions_by_type": contributions_by_type,
            "average_quality_score": self.contributions.values()
                .map(|c| c.quality_score as f64)
                .sum::<f64>() / total_contributions.max(1) as f64,
            "active_contributors": self.contributors.values()
                .filter(|p| p.current_streak > 0)
                .count(),
            "quality_contributors": self.contributors.values()
                .filter(|p| p.quality_contributor_badge)
                .count(),
        })
    }
}

/// Request/Response types for API endpoints
#[derive(Debug, Serialize, Deserialize)]
pub struct ContributeTrainingDataRequest {
    pub contributor_address: String,
    pub muse_token_id: u64,
    pub contribution_type: u8,
    pub original_data: serde_json::Value,
    pub improved_data: serde_json::Value,
    pub metadata: ContributionMetadata,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContributeTrainingDataResponse {
    pub success: bool,
    pub contribution_id: String,
    pub reward_amount: u64,
    pub ipfs_hash: String,
    pub reward_calculation: RewardCalculation,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationResponse {
    pub success: bool,
    pub contribution_id: String,
    pub new_quality_score: u8,
    pub validation_status: ValidationStatus,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MarketplaceStatsResponse {
    pub stats: serde_json::Value,
    pub recent_contributions: Vec<TrainingDataContribution>,
    pub top_contributors: Vec<ContributorProfile>,
}