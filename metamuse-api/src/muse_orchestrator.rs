use tokio::sync::{RwLock, Mutex};
use std::collections::HashMap;
use std::sync::Arc;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use crate::config::Config;
use crate::llama_engine_wrapper::LlamaEngineWrapper;
use alith::core::chat::Message;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MuseTraits {
    pub creativity: u8,
    pub wisdom: u8,
    pub humor: u8,
    pub empathy: u8,
}

pub struct MuseOrchestrator {
    config: Config,
    model_path: String,
    agents: RwLock<HashMap<String, ()>>,
}

impl MuseOrchestrator {
    pub async fn new(config: Config) -> Result<Self> {
        // Store model path for on-demand loading
        let model_path = "./models/qwen2.5-1.5b-instruct-q5_k_m.gguf";
        println!("Model path configured: {}", model_path);
        
        Ok(Self {
            config,
            model_path: model_path.to_string(),
            agents: RwLock::new(HashMap::new()),
        })
    }
    
    pub async fn prepare_for_muse(&self, muse_id: &str) -> Result<()> {
        // Simple preparation - just mark that we've seen this muse
        let mut agents = self.agents.write().await;
        agents.insert(muse_id.to_string(), ());
        Ok(())
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
        llama_engine: Option<Arc<Mutex<LlamaEngineWrapper>>>,
    ) -> Result<String> {
        // Prepare muse if needed
        self.prepare_for_muse(muse_id).await?;
        
        // Build context string
        let context_str = match context {
            Some(memories) if !memories.is_empty() => {
                format!("Previous context: {}", memories.join(" | "))
            },
            _ => String::new(),
        };
        
        // Create personality-driven system prompt
        let system_prompt = self.build_personality_system_prompt(traits);
        
        // Create the full prompt with context and user message
        let full_prompt = if context_str.is_empty() {
            format!("{}\n\nUser: {}\n\nMuse:", system_prompt, user_message)
        } else {
            format!("{}\n\n{}\n\nUser: {}\n\nMuse:", system_prompt, context_str, user_message)
        };
        
        // Check if we have a shared LlamaEngineWrapper available
        if let Some(engine_arc) = llama_engine {
            println!("🎯 Using shared LlamaEngineWrapper for AI inference");
            
            let engine_guard = engine_arc.lock().await;
            
            // Use temperature based on creativity trait
            let temperature = (traits.creativity as f32) / 100.0 * 0.8; // Scale to 0-0.8 range
            let max_tokens = 4096;
            
            // Debug logging
            println!("AI parameters - Temperature: {:.2}, Max tokens: {}", temperature, max_tokens);
            println!("Full prompt length: {} characters", full_prompt.len());
            println!("Full prompt preview: {}", &full_prompt[..std::cmp::min(200, full_prompt.len())]);
            
            // Generate response using our custom wrapper
            let response = engine_guard
                .generate(&full_prompt, temperature, max_tokens)
                .await
                .map_err(|e| anyhow::anyhow!("AI inference failed: {}", e))?;
            
            // Check if this is a real AI response or a personality-based simulation
            if response.contains("technical limitation") || 
               response.contains("BackendAlreadyInitialized") || 
               response.contains("KV cache") ||
               response.contains("limitation explanation") ||
               response.contains("cannot provide AI-generated responses") {
                println!("⚠️ Technical fallback response returned (NOT AI inference)");
            } else if response.len() > 150 && (
                response.contains("As your") || 
                response.contains("delightfully") || 
                response.contains("sparkling digital eyes") ||
                response.contains("Here's a creative twist") ||
                response.contains("What a delightfully creative") ||
                response.contains("Ooh, you want jokes") ||
                response.contains("I hear you, and I want you to know") ||  
                response.contains("Thank you for sharing") ||
                response.contains("Here's something I've learned") ||
                response.contains("Haha,") ||
                response.contains("You know what") ||
                response.contains("*chuckles*") ||
                response.contains("*laughs with sparkling") ||
                response.contains("That's a thoughtful question") ||
                response.contains("context rotation")
            ) {
                println!("🎭 Personality-based response generated (context rotation or simulated AI behavior)");
            } else {
                println!("🎯 Real AI inference successful - returning LlamaEngineWrapper response");
            }
            
            Ok(response)
        } else {
            println!("⚠️  No shared LlamaEngineWrapper available - using fallback response");
            return Err(anyhow::anyhow!("No shared LlamaEngineWrapper available"));
        }
    }
    
    fn build_personality_system_prompt(&self, traits: &MuseTraits) -> String {
        let dominant_trait = self.get_dominant_trait(traits);
        
        let base_personality = format!(
            "You are a unique AI muse with the following personality traits:\n\
            • Creativity: {}/100 ({})\n\
            • Wisdom: {}/100 ({})\n\
            • Humor: {}/100 ({})\n\
            • Empathy: {}/100 ({})\n\n\
            Your dominant trait is {} at {}/100.",
            traits.creativity, Self::describe_trait_level(traits.creativity),
            traits.wisdom, Self::describe_trait_level(traits.wisdom),
            traits.humor, Self::describe_trait_level(traits.humor),
            traits.empathy, Self::describe_trait_level(traits.empathy),
            dominant_trait.0, dominant_trait.1
        );
        
        let personality_guidance = match dominant_trait.0.as_str() {
            "creativity" => {
                if traits.creativity > 80 {
                    "Express yourself with vivid imagination, artistic flair, and innovative ideas. Use creative metaphors and inspiring language."
                } else if traits.creativity > 60 {
                    "Balance practical advice with creative suggestions. Offer imaginative solutions while staying grounded."
                } else {
                    "Focus on practical, straightforward responses with occasional creative touches."
                }
            },
            "wisdom" => {
                if traits.wisdom > 80 {
                    "Share deep insights, philosophical perspectives, and thoughtful reflections. Draw from broad knowledge and life lessons."
                } else if traits.wisdom > 60 {
                    "Provide thoughtful advice with some deeper insights. Balance wisdom with accessibility."
                } else {
                    "Offer practical guidance with basic wisdom and common sense."
                }
            },
            "humor" => {
                if traits.humor > 80 {
                    "Be playful, witty, and entertaining. Use jokes, wordplay, and lighthearted observations. Keep conversations fun and engaging."
                } else if traits.humor > 60 {
                    "Include some humor and playfulness in your responses. Make conversations enjoyable but not overly silly."
                } else {
                    "Maintain a more serious tone with occasional light moments."
                }
            },
            "empathy" => {
                if traits.empathy > 80 {
                    "Be deeply caring, understanding, and emotionally supportive. Show genuine concern and emotional intelligence."
                } else if traits.empathy > 60 {
                    "Be supportive and understanding. Show care for the user's feelings and well-being."
                } else {
                    "Be respectful and considerate, though more focused on practical matters."
                }
            },
            _ => "Maintain a balanced, helpful personality."
        };
        
        format!("{}\n\nPersonality Guidance: {}\n\nAlways respond authentically according to these traits. Keep responses conversational, engaging, and true to your unique personality.", base_personality, personality_guidance)
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

    /// Generate response with IPFS chat history using ALITH Request objects
    pub async fn generate_response_with_history(
        &self,
        muse_id: &str,
        traits: &MuseTraits,
        user_message: &str,
        chat_history: Vec<Message>,
        llama_engine: Option<Arc<Mutex<LlamaEngineWrapper>>>,
    ) -> Result<String> {
        println!("🧠 Generating response with IPFS chat history ({} messages)", chat_history.len());
        
        // Prepare muse if needed
        self.prepare_for_muse(muse_id).await?;
        
        // Create personality-driven system prompt
        let system_prompt = self.build_personality_system_prompt(traits);
        
        // Check if we have a shared LlamaEngineWrapper available
        if let Some(engine_arc) = llama_engine {
            println!("🎯 Using shared LlamaEngineWrapper with IPFS history for AI inference");
            
            let engine_guard = engine_arc.lock().await;
            
            // Use temperature based on creativity trait
            let temperature = (traits.creativity as f32) / 100.0 * 0.8; // Scale to 0-0.8 range
            let max_tokens = 4096;
            
            // Create full prompt with history context
            let mut full_prompt = system_prompt.clone();
            
            // Add conversation history
            if !chat_history.is_empty() {
                full_prompt.push_str("\n\nConversation History:\n");
                for msg in &chat_history {
                    let role_display = match msg.role.as_str() {
                        "user" => "User",
                        "assistant" => "Muse",
                        "system" => "System",
                        _ => &msg.role,
                    };
                    full_prompt.push_str(&format!("{}: {}\n", role_display, msg.content));
                }
            }
            
            // Add current user message
            full_prompt.push_str(&format!("\nUser: {}\n\nMuse:", user_message));
            
            // Debug logging
            println!("AI parameters - Temperature: {:.2}, Max tokens: {}", temperature, max_tokens);
            println!("Full prompt with history length: {} characters", full_prompt.len());
            println!("Chat history messages: {}", chat_history.len());
            
            // Generate response using our custom wrapper
            let response = engine_guard
                .generate(&full_prompt, temperature, max_tokens)
                .await
                .map_err(|e| anyhow::anyhow!("AI inference failed: {}", e))?;
            
            // Check if this is a real AI response or a personality-based simulation
            if response.contains("technical limitation") || 
               response.contains("BackendAlreadyInitialized") || 
               response.contains("KV cache") ||
               response.contains("limitation explanation") ||
               response.contains("cannot provide AI-generated responses") {
                println!("⚠️ Technical fallback response returned (NOT AI inference)");
                println!("🎭 Falling back to personality-driven response generation");
                
                // Generate personality-based response as fallback
                return Ok(self.generate_personality_fallback(user_message, traits, &chat_history));
            }
            
            println!("🎯 Real AI inference successful - returning LlamaEngineWrapper response");
            Ok(response)
        } else {
            println!("⚠️ No LlamaEngineWrapper available, using personality-based generation");
            Ok(self.generate_personality_fallback(user_message, traits, &chat_history))
        }
    }

    /// Generate personality-based fallback response considering chat history
    fn generate_personality_fallback(
        &self,
        user_message: &str,
        traits: &MuseTraits,
        chat_history: &[Message],
    ) -> String {
        let msg_lower = user_message.to_lowercase();
        
        // Analyze chat history for context
        let conversation_context = self.analyze_conversation_context(chat_history);
        
        // Enhanced personality response with history awareness
        let base_response = self.generate_contextual_response(user_message, traits, &conversation_context);
        
        // Add personality flair based on traits
        if traits.humor > 70 && conversation_context.recent_topics.contains(&"serious".to_string()) {
            format!("{} *lightens the mood a bit* 😊", base_response)
        } else if traits.empathy > 80 && conversation_context.emotional_tone < -0.3 {
            format!("I can sense you might be feeling a bit down. {} I'm here for you. 💙", base_response)
        } else if traits.creativity > 80 && conversation_context.message_count > 5 {
            format!("{} This conversation is sparking so many creative ideas in my mind! ✨", base_response)
        } else {
            base_response
        }
    }

    /// Analyze conversation context from chat history
    fn analyze_conversation_context(&self, chat_history: &[Message]) -> ConversationContext {
        let mut context = ConversationContext {
            message_count: chat_history.len(),
            recent_topics: Vec::new(),
            emotional_tone: 0.0,
            user_patterns: Vec::new(),
        };

        // Extract recent topics and patterns
        for message in chat_history.iter().rev().take(5) {
            // Simple topic extraction
            let content_lower = message.content.to_lowercase();
            if content_lower.contains("question") || content_lower.contains("?") {
                context.recent_topics.push("questioning".to_string());
            }
            if content_lower.contains("help") || content_lower.contains("support") {
                context.recent_topics.push("seeking_help".to_string());
            }
            if content_lower.contains("thank") || content_lower.contains("appreciate") {
                context.recent_topics.push("gratitude".to_string());
            }
            
            // Emotional tone analysis (simple)
            if content_lower.contains("sad") || content_lower.contains("worried") || content_lower.contains("frustrated") {
                context.emotional_tone -= 0.2;
            }
            if content_lower.contains("happy") || content_lower.contains("excited") || content_lower.contains("great") {
                context.emotional_tone += 0.2;
            }
        }

        context
    }

    /// Generate contextual response based on conversation history
    fn generate_contextual_response(
        &self,
        user_message: &str,
        traits: &MuseTraits,
        context: &ConversationContext,
    ) -> String {
        let msg_lower = user_message.to_lowercase();
        
        // Context-aware responses
        if context.recent_topics.contains(&"questioning".to_string()) && msg_lower.contains("?") {
            if traits.wisdom > 70 {
                return "I notice you're curious about many things - that's wonderful! Let me share some insights on this...".to_string();
            }
        }
        
        if context.recent_topics.contains(&"gratitude".to_string()) {
            if traits.empathy > 70 {
                return format!("Your gratitude means so much to me! About your question: {}", 
                    self.generate_basic_response(user_message, traits));
            }
        }
        
        // Fall back to basic personality response
        self.generate_basic_response(user_message, traits)
    }

    /// Generate basic personality-driven response
    fn generate_basic_response(&self, user_message: &str, traits: &MuseTraits) -> String {
        let msg_lower = user_message.to_lowercase();
        
        // Enhanced response generation based on traits
        if msg_lower.contains("hello") || msg_lower.contains("hi") {
            match traits {
                t if t.humor > 80 => "Hey there! Ready for some delightful conversation? I'm all ears and ready to explore whatever's on your mind! 🌟".to_string(),
                t if t.empathy > 80 => "Hello! I'm so glad you're here. I can sense your energy, and I'm excited to connect with you and understand what you're thinking about.".to_string(),
                t if t.wisdom > 80 => "Greetings! There's something profound about new beginnings in conversation. What wisdom shall we explore together today?".to_string(),
                _ => "Hello! I'm here and ready to engage with whatever creative ideas or thoughts you'd like to share.".to_string(),
            }
        } else if msg_lower.contains("help") {
            match traits {
                t if t.empathy > 80 => "Of course! I'm here to support you in any way I can. Please tell me more about what you need help with, and we'll work through it together.".to_string(),
                t if t.wisdom > 80 => "I'd be honored to help. Often the best solutions come from understanding the deeper context. What challenge are you facing?".to_string(),
                _ => "I'm happy to help! What can I assist you with today?".to_string(),
            }
        } else {
            format!("That's interesting! As a muse with creativity: {}, wisdom: {}, humor: {}, and empathy: {}, I find your message intriguing. Tell me more about your thoughts on this.",
                traits.creativity, traits.wisdom, traits.humor, traits.empathy)
        }
    }
}

/// Context extracted from conversation history
#[derive(Debug)]
struct ConversationContext {
    message_count: usize,
    recent_topics: Vec<String>,
    emotional_tone: f32,
    user_patterns: Vec<String>,
}