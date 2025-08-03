use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plugin {
    pub id: String,
    pub name: String,
    pub description: String,
    pub wasm_hash: String,
    pub category: PluginCategory,
    pub creator: String,
    pub version: String,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PluginCategory {
    Personality,
    Creative,
    Utility,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginExecution {
    pub plugin_id: String,
    pub input: serde_json::Value,
    pub output: Option<serde_json::Value>,
    pub execution_time_ms: u64,
    pub success: bool,
    pub error_message: Option<String>,
}

pub struct PluginSystem {
    // Registry of available plugins
    plugins: RwLock<HashMap<String, Plugin>>,
    
    // Installed plugins per muse
    muse_plugins: RwLock<HashMap<String, Vec<String>>>,
}

impl PluginSystem {
    pub async fn new() -> Result<Self> {
        Ok(Self {
            plugins: RwLock::new(HashMap::new()),
            muse_plugins: RwLock::new(HashMap::new()),
        })
    }
    
    pub async fn register_plugin(&self, plugin: Plugin) -> Result<()> {
        let mut plugins = self.plugins.write().await;
        plugins.insert(plugin.id.clone(), plugin);
        Ok(())
    }
    
    pub async fn install_plugin_for_muse(&self, muse_id: &str, plugin_id: &str) -> Result<()> {
        // Verify plugin exists
        let plugins = self.plugins.read().await;
        if !plugins.contains_key(plugin_id) {
            return Err(anyhow::anyhow!("Plugin not found: {}", plugin_id));
        }
        drop(plugins);
        
        // Install for muse
        let mut muse_plugins = self.muse_plugins.write().await;
        muse_plugins.entry(muse_id.to_string())
            .or_insert_with(Vec::new)
            .push(plugin_id.to_string());
        
        Ok(())
    }
    
    pub async fn get_muse_plugins(&self, muse_id: &str) -> Result<Vec<Plugin>> {
        let muse_plugins = self.muse_plugins.read().await;
        let plugins = self.plugins.read().await;
        
        if let Some(plugin_ids) = muse_plugins.get(muse_id) {
            let mut result = Vec::new();
            for plugin_id in plugin_ids {
                if let Some(plugin) = plugins.get(plugin_id) {
                    result.push(plugin.clone());
                }
            }
            Ok(result)
        } else {
            Ok(vec![])
        }
    }
    
    pub async fn execute_plugin(
        &self,
        plugin_id: &str,
        input: serde_json::Value,
    ) -> Result<PluginExecution> {
        let start_time = std::time::Instant::now();
        
        // In a real implementation, this would:
        // 1. Load the WASM module from IPFS
        // 2. Initialize a WASM runtime (like wasmtime)
        // 3. Execute the plugin with the input
        // 4. Return the output
        
        // For now, simulate plugin execution
        let execution = PluginExecution {
            plugin_id: plugin_id.to_string(),
            input: input.clone(),
            output: Some(serde_json::json!({
                "result": format!("Plugin {} executed with input: {}", plugin_id, input),
                "enhanced": true
            })),
            execution_time_ms: start_time.elapsed().as_millis() as u64,
            success: true,
            error_message: None,
        };
        
        Ok(execution)
    }
    
    pub async fn get_plugins_by_category(&self, category: PluginCategory) -> Result<Vec<Plugin>> {
        let plugins = self.plugins.read().await;
        let result = plugins.values()
            .filter(|plugin| plugin.category == category && plugin.active)
            .cloned()
            .collect();
        
        Ok(result)
    }
    
    pub async fn apply_personality_plugins(
        &self,
        muse_id: &str,
        response: &str,
        context: &serde_json::Value,
    ) -> Result<String> {
        let muse_plugins = self.get_muse_plugins(muse_id).await?;
        let mut enhanced_response = response.to_string();
        
        for plugin in muse_plugins {
            if matches!(plugin.category, PluginCategory::Personality) {
                let input = serde_json::json!({
                    "response": enhanced_response,
                    "context": context,
                    "plugin_config": {}
                });
                
                let execution = self.execute_plugin(&plugin.id, input).await?;
                
                if execution.success {
                    if let Some(output) = execution.output {
                        if let Some(enhanced) = output.get("enhanced_response") {
                            if let Some(enhanced_str) = enhanced.as_str() {
                                enhanced_response = enhanced_str.to_string();
                            }
                        }
                    }
                }
            }
        }
        
        Ok(enhanced_response)
    }
    
    pub async fn apply_creative_plugins(
        &self,
        muse_id: &str,
        prompt: &str,
        creativity_level: u8,
    ) -> Result<serde_json::Value> {
        let muse_plugins = self.get_muse_plugins(muse_id).await?;
        let mut creative_enhancements = serde_json::json!({
            "suggestions": [],
            "inspirations": [],
            "alternatives": []
        });
        
        for plugin in muse_plugins {
            if matches!(plugin.category, PluginCategory::Creative) {
                let input = serde_json::json!({
                    "prompt": prompt,
                    "creativity_level": creativity_level,
                    "context": {}
                });
                
                let execution = self.execute_plugin(&plugin.id, input).await?;
                
                if execution.success {
                    if let Some(output) = execution.output {
                        // Merge creative enhancements
                        if let Some(suggestions) = output.get("suggestions") {
                            if let Some(array) = creative_enhancements["suggestions"].as_array_mut() {
                                if let Some(new_suggestions) = suggestions.as_array() {
                                    array.extend(new_suggestions.iter().cloned());
                                }
                            }
                        }
                    }
                }
            }
        }
        
        Ok(creative_enhancements)
    }
    
    pub async fn get_plugin_stats(&self) -> Result<serde_json::Value> {
        let plugins = self.plugins.read().await;
        let muse_plugins = self.muse_plugins.read().await;
        
        let total_plugins = plugins.len();
        let active_plugins = plugins.values().filter(|p| p.active).count();
        let total_installations = muse_plugins.values().map(|v| v.len()).sum::<usize>();
        
        Ok(serde_json::json!({
            "total_plugins": total_plugins,
            "active_plugins": active_plugins,
            "total_installations": total_installations,
            "categories": {
                "personality": plugins.values().filter(|p| matches!(p.category, PluginCategory::Personality)).count(),
                "creative": plugins.values().filter(|p| matches!(p.category, PluginCategory::Creative)).count(),
                "utility": plugins.values().filter(|p| matches!(p.category, PluginCategory::Utility)).count(),
            }
        }))
    }
}