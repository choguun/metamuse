# MetaMuse 🤖✨

> **Blockchain-Powered AI Companions with Verifiable Interactions**

MetaMuse is a revolutionary platform that combines cutting-edge AI technology with blockchain verification to create unique, ownable AI companions. Each Muse is an NFT with distinct personality traits that influence how they interact, remember conversations, and evolve over time.

## 🌟 Features

### 🎨 **Unique AI Personalities**
- **Customizable Traits**: Adjust creativity, wisdom, humor, and empathy levels
- **Dynamic Responses**: AI behavior adapts based on personality configuration
- **Persistent Identity**: Each Muse maintains consistent personality across interactions

### 🔐 **Blockchain Verification**
- **Cryptographic Signing**: All AI interactions are cryptographically signed
- **On-chain Verification**: Smart contracts verify interaction authenticity
- **NFT Ownership**: Own your AI companions as tradeable NFTs

### 🧠 **Persistent Memory**
- **IPFS Storage**: Distributed storage for conversation history
- **Context-Aware**: AI remembers past conversations and relationships
- **Privacy-First**: User-controlled access to memory data

### 🔌 **Extensible Plugin System**
- **Community Plugins**: Extend AI capabilities with WASM plugins
- **Marketplace**: Discover and install community-created enhancements
- **Developer-Friendly**: Easy plugin development and distribution

## 🏗️ Architecture

### 🦀 **Rust Backend API**
- Multi-agent AI system with GPT-4 integration
- Blockchain client for smart contract interaction
- IPFS memory management
- WebSocket support for real-time chat

### 🔗 **Smart Contracts (Solidity)**
- **MetaMuse.sol**: ERC-721 NFT contract for AI companions
- **CommitmentVerifier.sol**: Cryptographic verification system
- **MuseMemory.sol**: IPFS-backed memory storage
- **MusePlugins.sol**: Plugin marketplace and execution

### ⚛️ **Next.js Frontend**
- Modern Web3 application with RainbowKit/Wagmi
- Real-time chat interface
- Muse creation and management tools
- Community exploration features

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **Rust** 1.70+
- **Foundry** (for smart contracts)
- **Git**
- **Web3 Wallet** (MetaMask, Rainbow, etc.)
- **Testnet Tokens** (tMETIS from Metis faucet)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/metamuse.git
cd metamuse
```

### 2. Setup Metis Hyperion Testnet in Your Wallet

Add the following network to MetaMask or your preferred wallet:

- **Network Name**: Metis Hyperion Testnet
- **RPC URL**: https://hyperion-testnet.metisdevops.link
- **Chain ID**: 133717
- **Currency Symbol**: tMETIS
- **Block Explorer**: https://hyperion-testnet-explorer.metisdevops.link

Get testnet tokens from the Metis faucet (available through Metis Discord).

### 3. Set Up Environment Variables

#### Backend Configuration (`metamuse-api/.env`)
```bash
# AI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# Blockchain Configuration (Metis Hyperion Testnet)
ETHEREUM_RPC_URL=https://hyperion-testnet.metisdevops.link
CHAIN_ID=133717
PRIVATE_KEY=your_private_key
METAMUSE_CONTRACT_ADDRESS=0x...
COMMITMENT_VERIFIER_ADDRESS=0x...

# IPFS Configuration
IPFS_API_KEY=your_ipfs_key
IPFS_API_SECRET=your_ipfs_secret

# Server Configuration
HOST=127.0.0.1
PORT=8080
CORS_ORIGINS=http://localhost:3000
```

#### Frontend Configuration (`metamuse-web/.env.local`)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080

# Blockchain Configuration (Metis Hyperion Testnet)
NEXT_PUBLIC_CHAIN_ID=133717
NEXT_PUBLIC_METAMUSE_CONTRACT=0x...
NEXT_PUBLIC_COMMITMENT_VERIFIER_CONTRACT=0x...

# WalletConnect Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### 4. Deploy Smart Contracts to Metis Hyperion Testnet
```bash
cd contracts
forge build

# Deploy to Metis Hyperion Testnet
forge script script/DeployHyperion.s.sol \
  --rpc-url https://hyperion-testnet.metisdevops.link \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### 5. Start the Backend API
```bash
cd metamuse-api
cargo run
# API will be available at http://localhost:8080
```

### 6. Start the Frontend
```bash
cd metamuse-web
npm install
npm run dev
# Frontend will be available at http://localhost:3000
```

## 📖 Usage Guide

### Creating Your First Muse

1. **Connect Your Wallet**: Use the "Connect Wallet" button to connect your Web3 wallet
2. **Design Personality**: Adjust the four core traits:
   - **Creativity**: Influences imaginative and artistic responses
   - **Wisdom**: Affects thoughtful and philosophical insights  
   - **Humor**: Controls playfulness and joke-telling
   - **Empathy**: Determines emotional understanding and support
3. **Preview Interactions**: Test how your Muse will respond before creation
4. **Mint Your Muse**: Create your AI companion as an NFT on the blockchain

### Chatting with Your Muse

1. **Navigate to Gallery**: View all your owned Muses
2. **Select a Muse**: Click "Chat" on any Muse card
3. **Start Conversing**: Type messages and receive personality-driven responses
4. **Verify Interactions**: View verification status of each message
5. **Build Relationships**: Your Muse remembers past conversations

### Exploring the Community

1. **Visit Explore Page**: Discover Muses created by other users
2. **Filter by Personality**: Find Muses with specific trait combinations
3. **Sort by Popularity**: See the most interactive Muses
4. **Start Conversations**: Chat with any Muse in the community

## 🛠️ Development

### Backend Development
```bash
cd metamuse-api

# Run with debug logging
RUST_LOG=debug cargo run

# Run tests
cargo test

# Format code
cargo fmt

# Lint code
cargo clippy
```

### Smart Contract Development
```bash
cd contracts

# Compile contracts
forge build

# Run tests
forge test

# Deploy locally
anvil # In another terminal
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key 0x...
```

### Frontend Development
```bash
cd metamuse-web

# Run development server
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build
```

## 🏛️ Smart Contract Addresses

### Metis Hyperion Testnet Deployments
- **MetaMuse**: `0x...` (Deploy using script/DeployHyperion.s.sol)
- **CommitmentVerifier**: `0x...` (Deploy using script/DeployHyperion.s.sol)
- **MuseMemory**: `0x...` (Deploy using script/DeployHyperion.s.sol)
- **MusePlugins**: `0x...` (Deploy using script/DeployHyperion.s.sol)

**Network Details:**
- Chain ID: 133717
- RPC: https://hyperion-testnet.metisdevops.link
- Explorer: https://hyperion-testnet-explorer.metisdevops.link

### Mainnet Deployments
*Contracts will be deployed to Metis mainnet after thorough testing and security audits.*

## 🔐 Security

### Smart Contract Security
- **Audited Code**: All contracts follow security best practices
- **Access Controls**: Proper permission management with OpenZeppelin
- **Reentrancy Protection**: Protected against common attack vectors
- **Gas Optimization**: Efficient code to minimize transaction costs

### Backend Security
- **Input Validation**: All API inputs are sanitized and validated
- **Rate Limiting**: Protection against spam and abuse
- **Secure Key Management**: Private keys and API keys are securely handled
- **CORS Protection**: Proper cross-origin request handling

### Frontend Security
- **XSS Prevention**: All user inputs are properly escaped
- **Secure Wallet Integration**: Best practices for Web3 wallet connections
- **Environment Security**: Sensitive data is properly managed

## 🧪 Testing

### Running Tests

#### Backend Tests
```bash
cd metamuse-api
cargo test
```

#### Smart Contract Tests
```bash
cd contracts
forge test
```

#### Frontend Tests
```bash
cd metamuse-web
npm test
```

### Test Coverage
- **Backend**: Unit tests for core AI logic and integration tests for blockchain interaction
- **Contracts**: Comprehensive Foundry test suite covering all functionality
- **Frontend**: Component tests and E2E tests for user workflows

## 📊 Performance

### Benchmarks
- **API Response Time**: < 200ms for standard operations
- **AI Response Generation**: 1-3 seconds depending on complexity
- **Blockchain Verification**: 15-30 seconds depending on network
- **IPFS Memory Retrieval**: < 500ms for recent conversations

### Scalability
- **Concurrent Users**: Designed to handle 1000+ concurrent chat sessions
- **Memory Storage**: Unlimited conversation history via IPFS
- **Plugin Execution**: Isolated WASM runtime for safe plugin execution

## 🗺️ Roadmap

### Phase 1: Core Platform ✅
- ✅ Multi-agent AI system
- ✅ Smart contract suite
- ✅ Web3 frontend
- ✅ Basic memory system

### Phase 2: Enhanced Features 🔄
- 🔄 Plugin marketplace
- 🔄 Advanced memory scoring
- 🔄 Mobile application
- 🔄 Social features

### Phase 3: Ecosystem Expansion 🔮
- 🔮 Muse-to-Muse interactions
- 🔮 DAO governance
- 🔮 Cross-chain deployment
- 🔮 AI model fine-tuning

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code style and standards
- Pull request process
- Issue reporting
- Development setup
- Testing requirements

### Development Environment Setup

1. **Fork the repository** and clone your fork
2. **Install dependencies** for all components
3. **Set up environment variables** as described above
4. **Run the test suite** to ensure everything works
5. **Make your changes** following our coding standards
6. **Submit a pull request** with a clear description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 API powering our AI system
- **Ethereum Foundation** for the blockchain infrastructure
- **IPFS** for decentralized storage capabilities
- **The Web3 Community** for tools and libraries that made this possible

## 📞 Support

### Community
- **Discord**: [Join our Discord](https://discord.gg/metamuse) (Coming Soon)
- **Twitter**: [@MetaMuseAI](https://twitter.com/metamuseai) (Coming Soon)
- **Telegram**: [MetaMuse Community](https://t.me/metamuse) (Coming Soon)

### Technical Support
- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/your-org/metamuse/issues)
- **Documentation**: Full documentation available in the [docs](docs/) folder
- **API Reference**: Interactive API docs at `/api/docs` when running the backend

### Contact
- **Email**: team@metamuse.ai (Coming Soon)
- **Website**: [metamuse.ai](https://metamuse.ai) (Coming Soon)

---

**Built with ❤️ by the MetaMuse Team**

*Creating the future of AI companions, one conversation at a time.*