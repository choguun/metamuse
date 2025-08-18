// contracts/InteractionDAT.sol
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title InteractionDAT - Data Anchoring Tokens for Verified AI Interactions
 * @notice World's first smart contract for cryptographically verified AI companion interactions
 * @dev Combines TEE attestation with IPFS storage to create immutable interaction certificates
 */
contract InteractionDAT is ERC721, Ownable {
    
    struct InteractionProof {
        uint256 museTokenId;       // Reference to the MetaMuse NFT
        address participant;       // User who had the interaction
        bytes32 conversationHash;  // Hash of conversation content
        bytes32 teeAttestation;    // TEE cryptographic proof
        string ipfsMetadataHash;   // IPFS hash containing full proof data
        uint256 timestamp;         // When interaction occurred
        uint256 blockNumber;       // Block when minted for ordering
        bool isSignificant;        // Marked as significant by user
        string interactionType;    // "first_chat", "milestone", "breakthrough", etc.
    }
    
    struct TEEProof {
        bytes32 attestationHash;
        bytes signature;
        uint256 timestamp;
        bool verified;
    }
    
    // Core storage
    mapping(uint256 => InteractionProof) public interactions;
    mapping(bytes32 => bool) public usedConversationHashes;
    mapping(address => mapping(uint256 => uint256[])) public userMuseInteractions;
    mapping(bytes32 => TEEProof) public teeProofs;
    
    // Associated contracts
    IERC721 public immutable metaMuse;
    
    // Configuration
    uint256 public mintPrice = 0.001 ether; // Cost to mint an interaction DAT
    bool public mintingEnabled = true;
    
    // Events
    event InteractionDATMinted(
        uint256 indexed tokenId,
        uint256 indexed museTokenId,
        address indexed participant,
        bytes32 conversationHash,
        bytes32 teeAttestation,
        string interactionType
    );
    
    event TEEProofVerified(
        bytes32 indexed attestationHash,
        uint256 indexed tokenId,
        bool verified
    );
    
    event SignificantInteractionMarked(
        uint256 indexed tokenId,
        address indexed participant
    );
    
    uint256 private _nextTokenId = 1;
    
    constructor(address _metaMuse) ERC721("InteractionDAT", "IDAT") Ownable(msg.sender) {
        metaMuse = IERC721(_metaMuse);
    }
    
    /**
     * @notice Mint a Data Anchoring Token for a verified AI interaction
     * @dev Creates immutable certificate combining conversation, TEE proof, and metadata
     */
    function mintInteractionDAT(
        uint256 _museTokenId,
        bytes32 _conversationHash,
        bytes32 _teeAttestation,
        string calldata _ipfsMetadataHash,
        string calldata _interactionType,
        bool _isSignificant,
        bytes calldata _teeSignature
    ) external payable returns (uint256) {
        require(mintingEnabled, "Minting disabled");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(metaMuse.ownerOf(_museTokenId) != address(0), "Muse does not exist");
        require(!usedConversationHashes[_conversationHash], "Conversation already tokenized");
        require(bytes(_ipfsMetadataHash).length > 0, "Missing IPFS metadata");
        require(bytes(_interactionType).length > 0, "Missing interaction type");
        
        uint256 tokenId = _nextTokenId++;
        
        // Store TEE proof for verification
        teeProofs[_teeAttestation] = TEEProof({
            attestationHash: _teeAttestation,
            signature: _teeSignature,
            timestamp: block.timestamp,
            verified: _verifyTEEAttestation(_teeAttestation, _teeSignature)
        });
        
        // Create interaction proof
        interactions[tokenId] = InteractionProof({
            museTokenId: _museTokenId,
            participant: msg.sender,
            conversationHash: _conversationHash,
            teeAttestation: _teeAttestation,
            ipfsMetadataHash: _ipfsMetadataHash,
            timestamp: block.timestamp,
            blockNumber: block.number,
            isSignificant: _isSignificant,
            interactionType: _interactionType
        });
        
        // Mark conversation as used
        usedConversationHashes[_conversationHash] = true;
        
        // Track user-muse interactions
        userMuseInteractions[msg.sender][_museTokenId].push(tokenId);
        
        // Mint the DAT to the user
        _safeMint(msg.sender, tokenId);
        
        emit InteractionDATMinted(
            tokenId,
            _museTokenId,
            msg.sender,
            _conversationHash,
            _teeAttestation,
            _interactionType
        );
        
        emit TEEProofVerified(_teeAttestation, tokenId, teeProofs[_teeAttestation].verified);
        
        if (_isSignificant) {
            emit SignificantInteractionMarked(tokenId, msg.sender);
        }
        
        return tokenId;
    }
    
    /**
     * @notice Get complete interaction proof data
     */
    function getInteractionProof(uint256 _tokenId) external view returns (
        uint256 museTokenId,
        address participant,
        bytes32 conversationHash,
        bytes32 teeAttestation,
        string memory ipfsMetadataHash,
        uint256 timestamp,
        uint256 blockNumber,
        bool isSignificant,
        string memory interactionType,
        bool teeVerified
    ) {
        require(_exists(_tokenId), "InteractionDAT does not exist");
        InteractionProof memory proof = interactions[_tokenId];
        
        return (
            proof.museTokenId,
            proof.participant,
            proof.conversationHash,
            proof.teeAttestation,
            proof.ipfsMetadataHash,
            proof.timestamp,
            proof.blockNumber,
            proof.isSignificant,
            proof.interactionType,
            teeProofs[proof.teeAttestation].verified
        );
    }
    
    /**
     * @notice Get all interaction DATs for a user with a specific muse
     */
    function getUserMuseInteractions(address _user, uint256 _museTokenId) external view returns (uint256[] memory) {
        return userMuseInteractions[_user][_museTokenId];
    }
    
    /**
     * @notice Verify TEE attestation authenticity
     * @dev In production, this would integrate with actual TEE verification
     */
    function _verifyTEEAttestation(bytes32 _attestationHash, bytes calldata _signature) internal pure returns (bool) {
        // Simplified verification - in production would call TEE verification service
        return _signature.length > 0 && _attestationHash != bytes32(0);
    }
    
    /**
     * @notice Check if a conversation has already been tokenized
     */
    function isConversationTokenized(bytes32 _conversationHash) external view returns (bool) {
        return usedConversationHashes[_conversationHash];
    }
    
    /**
     * @notice Get TEE proof details
     */
    function getTEEProof(bytes32 _attestationHash) external view returns (
        bytes32 attestationHash,
        bytes memory signature,
        uint256 timestamp,
        bool verified
    ) {
        TEEProof memory proof = teeProofs[_attestationHash];
        return (proof.attestationHash, proof.signature, proof.timestamp, proof.verified);
    }
    
    /**
     * @notice Count total interactions for a specific muse
     */
    function getMuseInteractionCount(uint256 _museTokenId) external view returns (uint256 count) {
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_exists(i) && interactions[i].museTokenId == _museTokenId) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @notice Get significant interactions for display
     */
    function getSignificantInteractions(address _user) external view returns (uint256[] memory) {
        uint256[] memory temp = new uint256[](_nextTokenId - 1);
        uint256 count = 0;
        
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_exists(i) && ownerOf(i) == _user && interactions[i].isSignificant) {
                temp[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }
    
    /**
     * @notice Admin functions
     */
    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
    }
    
    function setMintingEnabled(bool _enabled) external onlyOwner {
        mintingEnabled = _enabled;
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice Override tokenURI to return IPFS metadata
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "InteractionDAT does not exist");
        return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/", interactions[_tokenId].ipfsMetadataHash));
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @notice Total supply of minted DATs
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}