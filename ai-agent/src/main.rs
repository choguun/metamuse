use std::{env, sync::Arc};
use alith::{Agent, Chat, LLM};
use dotenv::dotenv;
use axum::{
    routing::{post, get},
    http::StatusCode,
    response::IntoResponse,
    Json,
    Router,
    extract::State
};
use serde::{Deserialize, Serialize};

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    let model = LLM::from_model_name("gpt-4")?;
    let agent = Agent::new("simple agent", model)
        .preamble("You are a comedian here to entertain the user using humour and jokes.");
 
    let response = agent.prompt("Entertain me!").await?;
 
    println!("{}", response);
 
    Ok(())
}
