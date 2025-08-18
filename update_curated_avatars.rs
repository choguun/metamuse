// Helper to update curated avatars with real IPFS hashes
// Add this to avatar_system.rs after uploading images

use std::collections::HashMap;

impl AvatarManager {
    pub fn update_curated_avatars_with_real_ipfs(&mut self, ipfs_hashes: HashMap<String, String>) {
        // Update wise mentor
        if let Some(hash) = ipfs_hashes.get("wise_mentor") {
            if let Some(avatar) = self.avatars.get_mut("wise_mentor") {
                avatar.ipfs_hash = hash.clone();
                avatar.cdn_url = Some(format!("{}/{}", self.ipfs_gateway, hash));
                println!("✅ Updated wise_mentor with IPFS hash: {}", hash);
            }
        }

        // Update playful buddy
        if let Some(hash) = ipfs_hashes.get("playful_buddy") {
            if let Some(avatar) = self.avatars.get_mut("playful_buddy") {
                avatar.ipfs_hash = hash.clone();
                avatar.cdn_url = Some(format!("{}/{}", self.ipfs_gateway, hash));
                println!("✅ Updated playful_buddy with IPFS hash: {}", hash);
            }
        }

        // Update creative spirit
        if let Some(hash) = ipfs_hashes.get("creative_spirit") {
            if let Some(avatar) = self.avatars.get_mut("creative_spirit") {
                avatar.ipfs_hash = hash.clone();
                avatar.cdn_url = Some(format!("{}/{}", self.ipfs_gateway, hash));
                println!("✅ Updated creative_spirit with IPFS hash: {}", hash);
            }
        }

        // Update classic companion
        if let Some(hash) = ipfs_hashes.get("classic_companion") {
            if let Some(avatar) = self.avatars.get_mut("classic_companion") {
                avatar.ipfs_hash = hash.clone();
                avatar.cdn_url = Some(format!("{}/{}", self.ipfs_gateway, hash));
                println!("✅ Updated classic_companion with IPFS hash: {}", hash);
            }
        }

        println!("🎨 Curated avatars updated with real IPFS images!");
    }
}

// Example usage in main.rs:
// let ipfs_hashes = HashMap::from([
//     ("wise_mentor".to_string(), "QmYourActualHashHere1".to_string()),
//     ("playful_buddy".to_string(), "QmYourActualHashHere2".to_string()),  
//     ("creative_spirit".to_string(), "QmYourActualHashHere3".to_string()),
//     ("classic_companion".to_string(), "QmYourActualHashHere4".to_string()),
// ]);
// avatar_manager.update_curated_avatars_with_real_ipfs(ipfs_hashes);