#!/usr/bin/env node

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Pinata configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY || 'your_api_key';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || 'your_secret';
const PINATA_JWT = process.env.PINATA_JWT || 'your_jwt_token';

async function uploadToPinata(filePath, fileName) {
    try {
        const formData = new FormData();
        const fileStream = fs.createReadStream(filePath);
        
        formData.append('file', fileStream, fileName);
        formData.append('pinataMetadata', JSON.stringify({
            name: fileName,
            keyvalues: {
                type: 'avatar',
                category: 'curated_gallery'
            }
        }));

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY,
            },
            body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log(`✅ ${fileName} uploaded successfully!`);
            console.log(`🔗 IPFS Hash: ${result.IpfsHash}`);
            console.log(`🌐 Gateway URL: https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
            console.log('---');
            return result.IpfsHash;
        } else {
            console.error(`❌ Upload failed for ${fileName}:`, result);
        }
    } catch (error) {
        console.error(`❌ Error uploading ${fileName}:`, error.message);
    }
}

async function uploadAvatars() {
    const avatars = [
        { file: 'wise_mentor.jpg', name: 'Wise Mentor Avatar' },
        { file: 'playful_buddy.jpg', name: 'Playful Buddy Avatar' },
        { file: 'creative_spirit.jpg', name: 'Creative Spirit Avatar' },
        { file: 'classic_companion.jpg', name: 'Classic Companion Avatar' }
    ];

    console.log('🚀 Starting avatar uploads to Pinata IPFS...\n');

    const results = {};
    for (const avatar of avatars) {
        if (fs.existsSync(avatar.file)) {
            const hash = await uploadToPinata(avatar.file, avatar.name);
            if (hash) {
                results[avatar.file] = hash;
            }
        } else {
            console.log(`⚠️ File not found: ${avatar.file}`);
        }
    }

    console.log('\n📋 Upload Summary:');
    console.log(JSON.stringify(results, null, 2));
    
    // Save results to file
    fs.writeFileSync('avatar_ipfs_hashes.json', JSON.stringify(results, null, 2));
    console.log('💾 Results saved to avatar_ipfs_hashes.json');
}

// Run if called directly
if (require.main === module) {
    uploadAvatars().catch(console.error);
}

module.exports = { uploadToPinata, uploadAvatars };