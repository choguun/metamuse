#!/bin/bash

# MetaMuse Smart Contract Deployment Script
# Deploy to Metis Hyperion Testnet

set -e

echo "🚀 MetaMuse Smart Contract Deployment to Metis Hyperion Testnet"
echo "================================================================="
echo "Deploying 5 contracts including the new AI Alignment Market..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK_NAME="Metis Hyperion Testnet"
CHAIN_ID="133717"
RPC_URL="https://hyperion-testnet.metisdevops.link"
EXPLORER_URL="https://hyperion-testnet-explorer.metisdevops.link"

# Check if we're in the contracts directory
if [ ! -f "foundry.toml" ]; then
    echo -e "${RED}❌ Please run this script from the contracts directory${NC}"
    echo "cd contracts && ../deploy-contracts.sh"
    exit 1
fi

# Check dependencies
echo -e "${BLUE}Checking dependencies...${NC}"

if ! command -v forge &> /dev/null; then
    echo -e "${RED}❌ Foundry (forge) is not installed. Please install it first.${NC}"
    echo "Install: curl -L https://foundry.paradigm.xyz | bash"
    exit 1
fi

echo -e "${GREEN}✅ Foundry is installed${NC}"

# Check environment variables
echo -e "${BLUE}Checking environment variables...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Create .env file with:"
    echo "PRIVATE_KEY=your_private_key_without_0x_prefix"
    exit 1
fi

# Source environment variables
source .env

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ PRIVATE_KEY not set in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"

# Get deployer address
DEPLOYER_ADDRESS=$(cast wallet address --private-key $PRIVATE_KEY)
echo -e "${BLUE}Deployer address: ${YELLOW}$DEPLOYER_ADDRESS${NC}"

# Check balance
echo -e "${BLUE}Checking deployer balance...${NC}"
BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $RPC_URL)
BALANCE_ETH=$(cast from-wei $BALANCE)

echo -e "${BLUE}Balance: ${YELLOW}$BALANCE_ETH tMETIS${NC}"

# Convert balance to a number for comparison (remove decimal part)
BALANCE_INT=$(echo $BALANCE_ETH | cut -d'.' -f1)

# Check if balance is sufficient (need at least 2 tMETIS for 5 contracts deployment)
if [ -z "$BALANCE_INT" ] || [ "$BALANCE_INT" -lt 2 ]; then
    echo -e "${YELLOW}⚠️  Balance is low. Deployment requires ~3.0M gas (~2 tMETIS)${NC}"
    echo -e "${YELLOW}Get testnet tokens from Metis faucet or Discord if deployment fails${NC}"
else
    echo -e "${GREEN}✅ Sufficient balance for deployment${NC}"
fi

# Build contracts
echo -e "${BLUE}Building contracts...${NC}"
forge build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contracts compiled successfully${NC}"

# Create deployments directory
mkdir -p deployments

# Deploy contracts
echo -e "${BLUE}Deploying contracts to Metis Hyperion Testnet...${NC}"
echo -e "${YELLOW}Network: $NETWORK_NAME${NC}"
echo -e "${YELLOW}Chain ID: $CHAIN_ID${NC}"
echo -e "${YELLOW}RPC URL: $RPC_URL${NC}"
echo -e "${YELLOW}Deploying: MetaMuse, CommitmentVerifier, MuseMemory, MusePlugins, MuseRating${NC}"
echo -e "${YELLOW}Expected gas usage: ~3.0M gas${NC}"
echo ""

# Run deployment script
echo -e "${BLUE}Running Foundry deployment script...${NC}"
forge script script/DeployHyperion.s.sol \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --slow \
    -vvvv

DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Contracts deployed successfully!${NC}"
    
    # Check if deployment file exists
    if [ -f "deployments/hyperion-testnet.env" ]; then
        echo -e "${BLUE}📋 Deployed Contract Addresses:${NC}"
        cat deployments/hyperion-testnet.env | grep "CONTRACT=" | while read line; do
            echo -e "${GREEN}  $line${NC}"
        done
        echo ""
        
        # Validate that all 5 contracts were deployed
        CONTRACT_COUNT=$(grep -c "CONTRACT=" deployments/hyperion-testnet.env)
        if [ "$CONTRACT_COUNT" -eq 5 ]; then
            echo -e "${GREEN}✅ All 5 contracts deployed successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Expected 5 contracts, found $CONTRACT_COUNT${NC}"
        fi
        echo ""
        
        # Copy deployment addresses to backend and frontend
        echo -e "${BLUE}Updating backend and frontend configurations...${NC}"
        
        # Update backend .env if it exists
        if [ -f "../metamuse-api/.env" ]; then
            source deployments/hyperion-testnet.env
            
            # Update backend environment variables
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/METAMUSE_CONTRACT_ADDRESS=.*/METAMUSE_CONTRACT_ADDRESS=$METAMUSE_CONTRACT/" ../metamuse-api/.env
                sed -i '' "s/COMMITMENT_VERIFIER_ADDRESS=.*/COMMITMENT_VERIFIER_ADDRESS=$COMMITMENT_VERIFIER_CONTRACT/" ../metamuse-api/.env
                sed -i '' "s/MUSE_MEMORY_CONTRACT_ADDRESS=.*/MUSE_MEMORY_CONTRACT_ADDRESS=$MUSE_MEMORY_CONTRACT/" ../metamuse-api/.env
                sed -i '' "s/MUSE_PLUGINS_CONTRACT_ADDRESS=.*/MUSE_PLUGINS_CONTRACT_ADDRESS=$MUSE_PLUGINS_CONTRACT/" ../metamuse-api/.env
                sed -i '' "s/MUSE_RATING_CONTRACT_ADDRESS=.*/MUSE_RATING_CONTRACT_ADDRESS=$MUSE_RATING_CONTRACT/" ../metamuse-api/.env
            else
                # Linux
                sed -i "s/METAMUSE_CONTRACT_ADDRESS=.*/METAMUSE_CONTRACT_ADDRESS=$METAMUSE_CONTRACT/" ../metamuse-api/.env
                sed -i "s/COMMITMENT_VERIFIER_ADDRESS=.*/COMMITMENT_VERIFIER_ADDRESS=$COMMITMENT_VERIFIER_CONTRACT/" ../metamuse-api/.env
                sed -i "s/MUSE_MEMORY_CONTRACT_ADDRESS=.*/MUSE_MEMORY_CONTRACT_ADDRESS=$MUSE_MEMORY_CONTRACT/" ../metamuse-api/.env
                sed -i "s/MUSE_PLUGINS_CONTRACT_ADDRESS=.*/MUSE_PLUGINS_CONTRACT_ADDRESS=$MUSE_PLUGINS_CONTRACT/" ../metamuse-api/.env
                sed -i "s/MUSE_RATING_CONTRACT_ADDRESS=.*/MUSE_RATING_CONTRACT_ADDRESS=$MUSE_RATING_CONTRACT/" ../metamuse-api/.env
            fi
            
            echo -e "${GREEN}✅ Backend configuration updated (5 contracts)${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend .env not found, create it from .env.example${NC}"
        fi
        
        # Update frontend .env.local if it exists
        if [ -f "../metamuse-web/.env.local" ]; then
            source deployments/hyperion-testnet.env
            
            # Update frontend environment variables
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/NEXT_PUBLIC_METAMUSE_CONTRACT=.*/NEXT_PUBLIC_METAMUSE_CONTRACT=$METAMUSE_CONTRACT/" ../metamuse-web/.env.local
                sed -i '' "s/NEXT_PUBLIC_COMMITMENT_VERIFIER_CONTRACT=.*/NEXT_PUBLIC_COMMITMENT_VERIFIER_CONTRACT=$COMMITMENT_VERIFIER_CONTRACT/" ../metamuse-web/.env.local
                sed -i '' "s/NEXT_PUBLIC_MUSE_MEMORY_CONTRACT=.*/NEXT_PUBLIC_MUSE_MEMORY_CONTRACT=$MUSE_MEMORY_CONTRACT/" ../metamuse-web/.env.local
                sed -i '' "s/NEXT_PUBLIC_MUSE_PLUGINS_CONTRACT=.*/NEXT_PUBLIC_MUSE_PLUGINS_CONTRACT=$MUSE_PLUGINS_CONTRACT/" ../metamuse-web/.env.local
                sed -i '' "s/NEXT_PUBLIC_MUSE_RATING_CONTRACT=.*/NEXT_PUBLIC_MUSE_RATING_CONTRACT=$MUSE_RATING_CONTRACT/" ../metamuse-web/.env.local
            else
                # Linux
                sed -i "s/NEXT_PUBLIC_METAMUSE_CONTRACT=.*/NEXT_PUBLIC_METAMUSE_CONTRACT=$METAMUSE_CONTRACT/" ../metamuse-web/.env.local
                sed -i "s/NEXT_PUBLIC_COMMITMENT_VERIFIER_CONTRACT=.*/NEXT_PUBLIC_COMMITMENT_VERIFIER_CONTRACT=$COMMITMENT_VERIFIER_CONTRACT/" ../metamuse-web/.env.local
                sed -i "s/NEXT_PUBLIC_MUSE_MEMORY_CONTRACT=.*/NEXT_PUBLIC_MUSE_MEMORY_CONTRACT=$MUSE_MEMORY_CONTRACT/" ../metamuse-web/.env.local
                sed -i "s/NEXT_PUBLIC_MUSE_PLUGINS_CONTRACT=.*/NEXT_PUBLIC_MUSE_PLUGINS_CONTRACT=$MUSE_PLUGINS_CONTRACT/" ../metamuse-web/.env.local
                sed -i "s/NEXT_PUBLIC_MUSE_RATING_CONTRACT=.*/NEXT_PUBLIC_MUSE_RATING_CONTRACT=$MUSE_RATING_CONTRACT/" ../metamuse-web/.env.local
            fi
            
            echo -e "${GREEN}✅ Frontend configuration updated (5 contracts)${NC}"
        else
            echo -e "${YELLOW}⚠️  Frontend .env.local not found, create it from .env.local.example${NC}"
        fi
        
    else
        echo -e "${RED}❌ Deployment file not created${NC}"
        exit 1
    fi
    
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 MetaMuse Deployment Complete!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}📋 Deployed Contracts (5):${NC}"
echo -e "${GREEN}  ✅ MetaMuse NFT - AI Companion Creation${NC}"
echo -e "${GREEN}  ✅ CommitmentVerifier - Cryptographic Verification${NC}"
echo -e "${GREEN}  ✅ MuseMemory - IPFS Memory Storage${NC}"
echo -e "${GREEN}  ✅ MusePlugins - Plugin Marketplace${NC}"
echo -e "${GREEN}  ✅ MuseRating - AI Alignment Market (NEW!)${NC}"
echo ""
echo -e "${BLUE}🌐 Network Details:${NC}"
echo -e "${YELLOW}  Network: $NETWORK_NAME${NC}"
echo -e "${YELLOW}  Chain ID: $CHAIN_ID${NC}"
echo -e "${YELLOW}  RPC: $RPC_URL${NC}"
echo -e "${YELLOW}  Explorer: $EXPLORER_URL${NC}"
echo ""
echo -e "${BLUE}🚀 New Features Available:${NC}"
echo -e "${GREEN}  🏆 AI Alignment Market - Rate AI interactions & earn MUSE tokens${NC}"
echo -e "${GREEN}  💰 Token Rewards - 10+ MUSE tokens per quality rating${NC}"
echo -e "${GREEN}  📊 Community Metrics - Track muse performance across the platform${NC}"
echo -e "${GREEN}  🔍 Quality Scoring - Rate quality, personality accuracy, helpfulness${NC}"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo -e "${YELLOW}  1. Start the backend API:${NC}"
echo -e "${YELLOW}     cd ../metamuse-api && cargo run --bin metamuse-api${NC}"
echo ""
echo -e "${YELLOW}  2. Start the frontend:${NC}"
echo -e "${YELLOW}     cd ../metamuse-web && npm run dev${NC}"
echo ""
echo -e "${YELLOW}  3. Visit http://localhost:3000 and connect your wallet${NC}"
echo -e "${YELLOW}     Make sure to switch to Metis Hyperion Testnet in your wallet${NC}"
echo ""
echo -e "${YELLOW}  4. Get testnet tMETIS tokens if you need more:${NC}"
echo -e "${YELLOW}     Join Metis Discord and request testnet tokens${NC}"
echo ""
echo -e "${YELLOW}  5. Try the new AI Alignment Market:${NC}"
echo -e "${YELLOW}     Chat with muses and rate their responses to earn MUSE tokens!${NC}"
echo ""
echo -e "${GREEN}Happy building with MetaMuse! 🛠️✨${NC}"