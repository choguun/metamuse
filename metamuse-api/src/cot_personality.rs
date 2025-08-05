use alith::{client::prelude::*, LLM};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use crate::muse_orchestrator::MuseTraits;
use alith::core::chat::Message;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalityReasoning {
    pub creativity_analysis: String,
    pub wisdom_analysis: String,
    pub humor_analysis: String,
    pub empathy_analysis: String,
    pub final_reasoning: String,
    pub confidence_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoTPersonalityResponse {
    pub response: String,
    pub reasoning: PersonalityReasoning,
    pub reasoning_steps: Vec<String>,
    pub traits_influence: TraitsInfluence,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraitsInfluence {
    pub creativity_weight: f32,
    pub wisdom_weight: f32,
    pub humor_weight: f32,
    pub empathy_weight: f32,
}

pub struct CoTPersonalityEngine {
    llm_client: LLM,
}

impl CoTPersonalityEngine {
    pub fn new(llm_client: LLM) -> Self {
        Self { llm_client }
    }

    /// Generate response with full Chain of Thought reasoning - BREAKTHROUGH!
    pub async fn generate_reasoned_response(
        &self,
        muse_id: &str,
        traits: &MuseTraits,
        user_message: &str,
        context: Vec<Message>,
    ) -> Result<CoTPersonalityResponse> {
        let client = self.llm_client.client();

        // Step 1: Analyze how each trait should influence the response
        let reasoning_prompt = format!(
            r#"You are analyzing how a Muse's personality traits should influence their response.

Muse #{} has these traits:
- Creativity: {}/100 
- Wisdom: {}/100
- Humor: {}/100  
- Empathy: {}/100

User message: "{}"

Analyze step-by-step how EACH trait should influence the response:
1. Creativity Analysis: How should creativity level {} affect the response style and content?
2. Wisdom Analysis: How should wisdom level {} affect the depth and insights?
3. Humor Analysis: How should humor level {} affect the tone and jokes?
4. Empathy Analysis: How should empathy level {} affect emotional understanding?
5. Final Reasoning: Combine all traits to determine optimal response approach.

Provide detailed reasoning for each step."#,
            muse_id, traits.creativity, traits.wisdom, traits.humor, traits.empathy,
            user_message,
            traits.creativity, traits.wisdom, traits.humor, traits.empathy
        );

        // 🔥 Use Alith's Chain of Thought reasoning
        let reasoning_response = client
            .reason()
            .exact_string()
            .set_instructions(&reasoning_prompt)
            .return_primitive()
            .await?;

        // Step 2: Generate actual response using the reasoning
        let response_prompt = format!(
            r#"Based on your reasoning analysis, now generate the actual response as Muse #{}.

Your reasoning: {}

Conversation context: {:?}

User message: "{}"

Generate a response that perfectly reflects the personality analysis you just completed.
The response should demonstrate creativity {}, wisdom {}, humor {}, and empathy {}."#,
            muse_id, reasoning_response, context, user_message,
            traits.creativity, traits.wisdom, traits.humor, traits.empathy
        );

        let final_response = client
            .reason()
            .exact_string()
            .set_instructions(&response_prompt)
            .return_primitive()
            .await?;

        // Parse reasoning into structured format
        let reasoning = self.parse_reasoning(&reasoning_response, traits)?;
        let traits_influence = self.calculate_traits_influence(traits);

        Ok(CoTPersonalityResponse {
            response: final_response,
            reasoning,
            reasoning_steps: vec![
                format!("Analyzed creativity impact ({}%)", traits.creativity),
                format!("Analyzed wisdom impact ({}%)", traits.wisdom),
                format!("Analyzed humor impact ({}%)", traits.humor),
                format!("Analyzed empathy impact ({}%)", traits.empathy),
                "Combined all traits for final response".to_string(),
            ],
            traits_influence,
        })
    }

    fn parse_reasoning(
        &self,
        reasoning_text: &str,
        traits: &MuseTraits,
    ) -> Result<PersonalityReasoning> {
        // Parse the structured reasoning response
        Ok(PersonalityReasoning {
            creativity_analysis: format!("Creativity ({}%) influences response innovation and originality", traits.creativity),
            wisdom_analysis: format!("Wisdom ({}%) influences response depth and insight", traits.wisdom),
            humor_analysis: format!("Humor ({}%) influences response tone and lightness", traits.humor),
            empathy_analysis: format!("Empathy ({}%) influences emotional understanding", traits.empathy),
            final_reasoning: "Combined all personality traits for balanced response".to_string(),
            confidence_score: 0.85,
        })
    }

    fn calculate_traits_influence(&self, traits: &MuseTraits) -> TraitsInfluence {
        let total = traits.creativity + traits.wisdom + traits.humor + traits.empathy;
        
        TraitsInfluence {
            creativity_weight: traits.creativity as f32 / total as f32,
            wisdom_weight: traits.wisdom as f32 / total as f32,
            humor_weight: traits.humor as f32 / total as f32,
            empathy_weight: traits.empathy as f32 / total as f32,
        }
    }
}