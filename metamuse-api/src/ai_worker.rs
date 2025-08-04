use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::io::{self, BufRead, BufReader, Write};
use alith::inference::LlamaEngine;
use alith::core::chat::{Request, Completion, ResponseContent};

/// Clean up repetitive text patterns that can occur in AI generation
fn clean_repetitive_text(text: &str) -> String {
    let mut lines: Vec<&str> = text.lines().collect();
    
    // Remove consecutive duplicate lines
    let mut i = 0;
    while i < lines.len().saturating_sub(1) {
        if lines[i] == lines[i + 1] {
            lines.remove(i + 1);
        } else {
            i += 1;
        }
    }
    
    let cleaned = lines.join("\n");
    
    // Check for repetitive phrases (3+ word patterns repeated)
    let words: Vec<&str> = cleaned.split_whitespace().collect();
    if words.len() > 10 {
        // Look for patterns of 3-8 words that repeat
        for pattern_len in 3..=8 {
            for start in 0..words.len().saturating_sub(pattern_len * 2) {
                let pattern = &words[start..start + pattern_len];
                let next_pattern = &words[start + pattern_len..start + pattern_len * 2];
                
                if pattern == next_pattern {
                    // Found repetition, truncate at the start of the repetition
                    let truncated_words = &words[0..start + pattern_len];
                    return truncated_words.join(" ") + "...";
                }
            }
        }
    }
    
    cleaned
}

/// Request structure for AI inference worker process
#[derive(Debug, Deserialize)]
pub struct AIWorkerRequest {
    pub prompt: String,
    pub temperature: f32,
    pub max_tokens: usize,
    pub model_path: String,
    pub request_id: String,
}

/// Response structure from AI inference worker process
#[derive(Debug, Serialize)]
pub struct AIWorkerResponse {
    pub success: bool,
    pub response: Option<String>,
    pub error: Option<String>,
    pub request_id: String,
    pub inference_time_ms: u64,
}

/// AI Worker Process - runs in isolation, handles one request, then exits
/// This eliminates KV cache conflicts by ensuring fresh alith backend for each request
pub struct AIWorker;

impl AIWorker {
    /// Main entry point for AI worker process
    /// Reads JSON request from stdin, processes AI inference, writes JSON response to stdout
    pub async fn run() -> Result<()> {
        eprintln!("🤖 AI Worker Process started - PID: {}", std::process::id());
        
        // Read request from stdin
        let stdin = io::stdin();
        let mut stdin_reader = BufReader::new(stdin.lock());
        let mut input_line = String::new();
        
        stdin_reader.read_line(&mut input_line)?;
        let request: AIWorkerRequest = serde_json::from_str(&input_line.trim())?;
        
        eprintln!("🎯 AI Worker processing request: {}", request.request_id);
        
        let start_time = std::time::Instant::now();
        
        // Process the AI inference request
        let response = Self::process_inference_request(&request).await;
        
        let inference_time_ms = start_time.elapsed().as_millis() as u64;
        
        // Create response
        let worker_response = match response {
            Ok(ai_response) => {
                eprintln!("✅ AI Worker inference successful for request: {}", request.request_id);
                AIWorkerResponse {
                    success: true,
                    response: Some(ai_response),
                    error: None,
                    request_id: request.request_id.clone(),
                    inference_time_ms,
                }
            }
            Err(e) => {
                eprintln!("❌ AI Worker inference failed for request: {} - Error: {}", request.request_id, e);
                AIWorkerResponse {
                    success: false,
                    response: None,
                    error: Some(e.to_string()),
                    request_id: request.request_id.clone(),
                    inference_time_ms,
                }
            }
        };
        
        // Write response to stdout
        let response_json = serde_json::to_string(&worker_response)?;
        println!("{}", response_json);
        io::stdout().flush()?;
        
        eprintln!("🏁 AI Worker process completed request: {} in {}ms", request.request_id, inference_time_ms);
        
        Ok(())
    }
    
    /// Process AI inference request with fresh alith backend
    async fn process_inference_request(request: &AIWorkerRequest) -> Result<String> {
        eprintln!("🚀 Creating fresh LlamaEngine for isolated inference...");
        
        // Create fresh LlamaEngine - this should work since it's a new process
        let mut engine = LlamaEngine::new(&request.model_path).await
            .map_err(|e| anyhow::anyhow!("Failed to create LlamaEngine in worker process: {}", e))?;
        
        eprintln!("✅ Fresh LlamaEngine created successfully in worker process");
        
        // Create inference request
        let mut inference_request = Request::new(request.prompt.clone(), String::new());
        inference_request.temperature = Some(request.temperature);
        inference_request.max_tokens = Some(request.max_tokens);
        
        eprintln!("📤 Sending inference request to fresh LlamaEngine...");
        
        // Execute inference with fresh backend (no KV cache conflicts possible)
        match engine.completion(inference_request).await {
            Ok(response) => {
                let generated_text = response.content();
                eprintln!("🎉 AI inference successful! Generated {} characters", generated_text.len());
                
                // Clean repetitive patterns to prevent infinite loops
                let cleaned_text = clean_repetitive_text(&generated_text);
                eprintln!("🧹 Cleaned text from {} to {} characters", generated_text.len(), cleaned_text.len());
                
                Ok(cleaned_text)
            }
            Err(e) => {
                eprintln!("❌ AI inference failed in worker process: {}", e);
                Err(anyhow::anyhow!("AI inference failed: {}", e))
            }
        }
    }
}

/// Entry point for AI worker binary
#[tokio::main]
async fn main() -> Result<()> {
    // Set up basic logging to stderr (stdout is reserved for JSON communication)
    eprintln!("🤖 AI Worker binary starting...");
    
    // Run the AI worker
    if let Err(e) = AIWorker::run().await {
        eprintln!("❌ AI Worker failed: {}", e);
        
        // Send error response to stdout
        let error_response = AIWorkerResponse {
            success: false,
            response: None,
            error: Some(e.to_string()),
            request_id: "unknown".to_string(),
            inference_time_ms: 0,
        };
        
        let error_json = serde_json::to_string(&error_response)?;
        println!("{}", error_json);
        
        std::process::exit(1);
    }
    
    Ok(())
}