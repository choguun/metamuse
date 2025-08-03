use alith::{Agent, LLM, EmbeddingsBuilder, InMemoryStorage, Chat};
use tokio::sync::RwLock;
use std::collections::HashMap;
use anyhow::Result;
use serde::{Deserialize, Serialize};

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
    agents: RwLock<HashMap<String, MuseAgentSet>>,
}

impl MuseOrchestrator {
    pub async fn new() -> Result<Self> {
        Ok(Self {
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
    
    async fn create_agent_set(&self, traits: &MuseTraits) -> Result<MuseAgentSet> {
        let model = LLM::from_model_name("gpt-4")?;
        let personality_agent = Agent::new("Personality", model)
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
        
        let memory_agent = self.create_memory_agent(traits).await?;
        let creative_agent = self.create_creative_agent(traits).await?;
        
        Ok(MuseAgentSet {
            personality_agent,
            memory_agent,
            creative_agent,
        })
    }
    
    async fn create_memory_agent(&self, traits: &MuseTraits) -> Result<Agent<LLM>> {
        let base_model = LLM::from_model_name("gpt-4")?;
        let embeddings_model = base_model.embeddings_model("text-embedding-3-small");
        
        let base_memories = vec![
            format!("I am a muse with creativity level {}", traits.creativity),
            format!("I approach problems with wisdom level {}", traits.wisdom),
            format!("I express humor at level {}", traits.humor),
            format!("I connect with others through empathy level {}", traits.empathy),
            "I am here to inspire and guide through meaningful conversation".to_string(),
            "I remember past interactions to build deeper connections".to_string(),
        ];
        
        let data = EmbeddingsBuilder::new(embeddings_model.clone())
            .documents(base_memories)
            .map_err(|e| anyhow::anyhow!("Embeddings error: {:?}", e))?
            .build()
            .await
            .map_err(|e| anyhow::anyhow!("Embeddings build error: {:?}", e))?;
        
        let storage = InMemoryStorage::from_multiple_documents(embeddings_model, data);
        
        let memory_model = LLM::from_model_name("gpt-4")?;
        Ok(Agent::new("Memory", memory_model)
            .preamble("You manage memories and ensure contextual consistency in conversations")
            .store_index(1, storage))
    }
    
    async fn create_creative_agent(&self, traits: &MuseTraits) -> Result<Agent<LLM>> {
        let creative_model = LLM::from_model_name("gpt-4")?;
        Ok(Agent::new("Creative", creative_model)
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
            )))
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
        
        // Generate base personality response
        let personality_prompt = format!(
            "User: {}\nContext: {}\nRespond authentically as the muse with your established personality.",
            user_message, context_str
        );
        
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
        
        Ok(personality_response)
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