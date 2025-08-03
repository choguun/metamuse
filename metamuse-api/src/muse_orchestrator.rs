use alith::{Agent, LLM, Chat};
use tokio::sync::RwLock;
use std::collections::HashMap;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use crate::config::Config;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MuseTraits {
    pub creativity: u8,
    pub wisdom: u8,
    pub humor: u8,
    pub empathy: u8,
}

pub struct MuseAgentSet {
    pub personality_agent: Agent<LLM>,
    pub memory_agent: Agent<LLM>,
    pub creative_agent: Agent<LLM>,
}

pub struct MuseOrchestrator {
    config: Config,
    agents: RwLock<HashMap<String, MuseAgentSet>>,
}

impl MuseOrchestrator {
    pub async fn new(config: Config) -> Result<Self> {
        Ok(Self {
            config,
            agents: RwLock::new(HashMap::new()),
        })
    }
    
    pub async fn get_or_create_agents(
        &self,
        muse_id: &str,
        traits: &MuseTraits,
    ) -> Result<MuseAgentSet> {
        let _agents = self.agents.write().await;
        
        if let Some(_agent_set) = _agents.get(muse_id) {
            // Since Agent doesn't implement Clone, we'll recreate the agents
            // In production, we'd use a different caching strategy
        }
        
        let agent_set = self.create_agent_set(traits).await?;
        // Note: We can't store agent_set since Agent doesn't implement Clone
        // In production, we'd use a different pattern like Arc<Agent> or recreation strategy
        
        Ok(agent_set)
    }
    
    fn get_local_model_name(&self, _model_url: &str) -> String {
        // For now, use a working model name that should be available in Alith
        // This will use the default model configuration
        "gpt-4".to_string()
    }
    
    fn select_model_for_trait(&self, trait_name: &str, trait_value: u8) -> &str {
        match trait_name {
            "creativity" => {
                match trait_value {
                    80..=100 => &self.config.creative_model_url,
                    60..=79 => &self.config.creative_model_url,
                    _ => &self.config.base_model_url,
                }
            },
            "wisdom" => {
                match trait_value {
                    70..=100 => &self.config.wisdom_model_url,
                    _ => &self.config.base_model_url,
                }
            },
            "humor" => {
                match trait_value {
                    60..=100 => &self.config.humor_model_url,
                    _ => &self.config.base_model_url,
                }
            },
            "empathy" => {
                match trait_value {
                    70..=100 => &self.config.empathy_model_url,
                    _ => &self.config.base_model_url,
                }
            },
            _ => &self.config.base_model_url,
        }
    }

    async fn create_agent_set(&self, traits: &MuseTraits) -> Result<MuseAgentSet> {
        // Select personality model based on dominant trait
        let dominant_trait = self.get_dominant_trait(traits);
        let personality_model_url = self.select_model_for_trait(&dominant_trait.0, dominant_trait.1);
        let personality_model_name = self.get_local_model_name(personality_model_url);
        let personality_model = LLM::from_model_name(&personality_model_name)?;
        
        let personality_agent = Agent::new("Personality", personality_model)
            .preamble(&format!(
                "You embody a muse with these traits:\n\
                Creativity: {}/100 - {}\n\
                Wisdom: {}/100 - {}\n\
                Humor: {}/100 - {}\n\
                Empathy: {}/100 - {}\n\
                Maintain these characteristics in all responses. Be authentic to your personality.",
                traits.creativity, Self::describe_trait_level(traits.creativity),
                traits.wisdom, Self::describe_trait_level(traits.wisdom),
                traits.humor, Self::describe_trait_level(traits.humor),
                traits.empathy, Self::describe_trait_level(traits.empathy)
            ));
        
        // Create memory agent
        let memory_model_name = self.get_local_model_name(&self.config.base_model_url);
        let memory_model = LLM::from_model_name(&memory_model_name)?;
        let memory_agent = Agent::new("Memory", memory_model)
            .preamble(&format!(
                "You manage memories and ensure contextual consistency in conversations. \
                Remember that you are a muse with creativity: {}, wisdom: {}, humor: {}, empathy: {}.",
                traits.creativity, traits.wisdom, traits.humor, traits.empathy
            ));
        
        // Create creative agent
        let creative_model_url = if traits.creativity > 60 {
            &self.config.creative_model_url
        } else {
            &self.config.base_model_url
        };
        let creative_model_name = self.get_local_model_name(creative_model_url);
        let creative_model = LLM::from_model_name(&creative_model_name)?;
        let creative_agent = Agent::new("Creative", creative_model)
            .preamble(&format!(
                "Generate creative and inspiring responses that spark imagination. \
                Your creativity level is {}/100, so {}. \
                Focus on novel ideas, artistic expression, and innovative thinking.",
                traits.creativity,
                match traits.creativity {
                    0..=33 => "be more practical and grounded in your suggestions",
                    34..=66 => "balance creativity with practicality",
                    _ => "be highly imaginative and unconventional in your ideas"
                }
            ));
        
        Ok(MuseAgentSet {
            personality_agent,
            memory_agent,
            creative_agent,
        })
    }
    
    fn get_dominant_trait(&self, traits: &MuseTraits) -> (String, u8) {
        let trait_values = vec![
            ("creativity".to_string(), traits.creativity),
            ("wisdom".to_string(), traits.wisdom),
            ("humor".to_string(), traits.humor),
            ("empathy".to_string(), traits.empathy),
        ];
        
        trait_values.into_iter()
            .max_by_key(|(_, value)| *value)
            .unwrap_or(("creativity".to_string(), traits.creativity))
    }
    
    
    pub async fn generate_response(
        &self,
        muse_id: &str,
        traits: &MuseTraits,
        user_message: &str,
        context: Option<Vec<String>>,
    ) -> Result<String> {
        let agents = self.get_or_create_agents(muse_id, traits).await?;
        
        // Build context string
        let context_str = match context {
            Some(memories) => format!("Previous context: {}", memories.join(" | ")),
            None => "No previous context available".to_string(),
        };
        
        // Create personality prompt with muse characteristics
        let personality_prompt = format!(
            "You embody a muse with these traits:\n\
            Creativity: {}/100 - {}\n\
            Wisdom: {}/100 - {}\n\
            Humor: {}/100 - {}\n\
            Empathy: {}/100 - {}\n\
            Maintain these characteristics in all responses. Be authentic to your personality.\n\n\
            User: {}\nContext: {}\n\n\
            Respond authentically as the muse:",
            traits.creativity, Self::describe_trait_level(traits.creativity),
            traits.wisdom, Self::describe_trait_level(traits.wisdom),
            traits.humor, Self::describe_trait_level(traits.humor),
            traits.empathy, Self::describe_trait_level(traits.empathy),
            user_message, context_str
        );
        
        // Generate base personality response
        let personality_response = agents.personality_agent
            .prompt(&personality_prompt)
            .await?;
        
        // Enhance with creativity if high creativity trait
        if traits.creativity > 50 {
            let creative_prompt = format!(
                "Take this response and enhance it with creative elements while maintaining its core message: {}",
                personality_response
            );
            
            let creative_enhancement = agents.creative_agent
                .prompt(&creative_prompt)
                .await?;
            
            // Blend responses based on creativity level
            return Ok(self.blend_responses(&personality_response, &creative_enhancement, traits));
        }
        
        Ok(personality_response.to_string())
    }
    
    fn blend_responses(&self, personality: &str, creative: &str, traits: &MuseTraits) -> String {
        match traits.creativity {
            80..=100 => creative.to_string(),
            60..=79 => format!("{} {}", personality, creative),
            40..=59 => {
                // Take parts from both
                let words: Vec<&str> = personality.split_whitespace().collect();
                let creative_words: Vec<&str> = creative.split_whitespace().collect();
                
                if words.len() > 10 && creative_words.len() > 5 {
                    format!("{} {}", 
                        words[..words.len()-3].join(" "), 
                        creative_words[..5].join(" ")
                    )
                } else {
                    personality.to_string()
                }
            },
            _ => personality.to_string(),
        }
    }
    
    fn describe_trait_level(level: u8) -> &'static str {
        match level {
            0..=20 => "Very Low",
            21..=40 => "Low",
            41..=60 => "Moderate",
            61..=80 => "High",
            _ => "Very High",
        }
    }
}