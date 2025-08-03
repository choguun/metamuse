// contracts/MetaMuse.sol
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface ICommitmentVerifier {
    function verifyCommitment(
        uint256 museId,
        bytes32 museDnaHash,
        bytes32 commitmentHash,
        bytes calldata signature
    ) external returns (bool);
}

/**
 * @title MetaMuse - Verifiable AI Companions on Metis Hyperion
 * @notice This contract establishes ownership and core identity of AI muses with verifiable interactions
 * @dev Complex AI operations are handled off-chain with cryptographic verification on-chain
 */
contract MetaMuse is ERC721, Ownable {
    
    struct Muse {
        uint8 creativity;      // 0-100 personality trait
        uint8 wisdom;         // 0-100 personality trait  
        uint8 humor;          // 0-100 personality trait
        uint8 empathy;        // 0-100 personality trait
        bytes32 dnaHash;      // Unique identifier for this muse's AI model
        uint256 birthBlock;   // When this muse was created
        uint256 totalInteractions; // Track usage for affinity
        uint256 lastInteractionTime; // Last verified interaction timestamp
    }
    
    struct PendingInteraction {
        bytes32 commitmentHash;
        uint256 timestamp;
        address initiator;
    }
    
    // Core storage
    mapping(uint256 => Muse) public muses;
    mapping(uint256 => mapping(address => bool)) public interactionPermissions;
    mapping(bytes32 => bool) public verifiedCommitments;
    mapping(uint256 => mapping(bytes32 => PendingInteraction)) public pendingInteractions;
    
    // Associated contracts
    ICommitmentVerifier public immutable commitmentVerifier;
    
    // Events
    event MuseCreated(
        uint256 indexed tokenId, 
        address indexed creator, 
        bytes32 dnaHash,
        uint8 creativity,
        uint8 wisdom,
        uint8 humor,
        uint8 empathy
    );
    
    event InteractionCommitted(
        uint256 indexed tokenId,
        bytes32 indexed commitmentHash,
        address indexed user
    );
    
    event InteractionVerified(
        uint256 indexed tokenId,
        bytes32 indexed commitmentHash,
        uint256 verificationTime
    );
    
    uint256 private _nextTokenId = 1;
    
    constructor(address _verifier) ERC721("MetaMuse", "MUSE") Ownable(msg.sender) {
        commitmentVerifier = ICommitmentVerifier(_verifier);
    }
    
    /**
     * @notice Create a new muse with specific personality traits
     * @dev The dnaHash links to off-chain AI embeddings and serves as unique identifier
     */
    function createMuse(
        uint8 _creativity,
        uint8 _wisdom,
        uint8 _humor,
        uint8 _empathy
    ) external returns (uint256) {
        require(_creativity <= 100 && _wisdom <= 100 && _humor <= 100 && _empathy <= 100, 
                "Invalid traits");
        
        uint256 tokenId = _nextTokenId++;
        
        bytes32 dnaHash = keccak256(abi.encodePacked(
            _creativity,
            _wisdom,
            _humor,
            _empathy,
            msg.sender,
            block.timestamp,
            block.prevrandao,
            tokenId
        ));
        
        muses[tokenId] = Muse({
            creativity: _creativity,
            wisdom: _wisdom,
            humor: _humor,
            empathy: _empathy,
            dnaHash: dnaHash,
            birthBlock: block.number,
            totalInteractions: 0,
            lastInteractionTime: 0
        });
        
        _safeMint(msg.sender, tokenId);
        
        emit MuseCreated(
            tokenId, 
            msg.sender, 
            dnaHash,
            _creativity,
            _wisdom,
            _humor,
            _empathy
        );
        
        return tokenId;
    }
    
    /**
     * @notice Commit to an interaction before it happens (commit-reveal scheme)
     * @dev Creates a pending interaction that must be verified later
     */
    function commitInteraction(
        uint256 _tokenId,
        bytes32 _commitmentHash
    ) external {
        require(_exists(_tokenId), "Muse does not exist");
        require(canInteract(_tokenId, msg.sender), "No permission");
        require(!verifiedCommitments[_commitmentHash], "Already verified");
        
        pendingInteractions[_tokenId][_commitmentHash] = PendingInteraction({
            commitmentHash: _commitmentHash,
            timestamp: block.timestamp,
            initiator: msg.sender
        });
        
        emit InteractionCommitted(_tokenId, _commitmentHash, msg.sender);
    }
    
    /**
     * @notice Verify a committed interaction with cryptographic proof
     * @dev Uses the CommitmentVerifier contract to validate off-chain computation
     */
    function verifyInteraction(
        uint256 _tokenId,
        bytes32 _commitmentHash,
        bytes calldata _signature
    ) external {
        require(_exists(_tokenId), "Muse does not exist");
        require(pendingInteractions[_tokenId][_commitmentHash].timestamp > 0, 
                "No pending interaction");
        require(!verifiedCommitments[_commitmentHash], "Already verified");
        
        Muse storage muse = muses[_tokenId];
        
        require(
            commitmentVerifier.verifyCommitment(
                _tokenId,
                muse.dnaHash,
                _commitmentHash,
                _signature
            ),
            "Invalid signature"
        );
        
        verifiedCommitments[_commitmentHash] = true;
        muse.totalInteractions++;
        muse.lastInteractionTime = block.timestamp;
        
        delete pendingInteractions[_tokenId][_commitmentHash];
        
        emit InteractionVerified(_tokenId, _commitmentHash, block.timestamp);
    }
    
    /**
     * @notice Grant permission for someone else to interact with your muse
     */
    function grantInteractionPermission(uint256 _tokenId, address _user) external {
        require(ownerOf(_tokenId) == msg.sender, "Not owner");
        interactionPermissions[_tokenId][_user] = true;
    }
    
    /**
     * @notice Revoke interaction permission
     */
    function revokeInteractionPermission(uint256 _tokenId, address _user) external {
        require(ownerOf(_tokenId) == msg.sender, "Not owner");
        interactionPermissions[_tokenId][_user] = false;
    }
    
    /**
     * @notice Check if an address can interact with a muse
     */
    function canInteract(uint256 _tokenId, address _user) public view returns (bool) {
        return ownerOf(_tokenId) == _user || interactionPermissions[_tokenId][_user];
    }
    
    /**
     * @notice Get comprehensive muse data for off-chain processing
     */
    function getMuseData(uint256 _tokenId) external view returns (
        uint8 creativity,
        uint8 wisdom,
        uint8 humor,
        uint8 empathy,
        bytes32 dnaHash,
        uint256 birthBlock,
        uint256 totalInteractions,
        address owner
    ) {
        require(_exists(_tokenId), "Muse does not exist");
        Muse memory muse = muses[_tokenId];
        
        return (
            muse.creativity,
            muse.wisdom,
            muse.humor,
            muse.empathy,
            muse.dnaHash,
            muse.birthBlock,
            muse.totalInteractions,
            ownerOf(_tokenId)
        );
    }
    
    /**
     * @notice Get just the personality traits for a muse
     */
    function getMuseTraits(uint256 _tokenId) external view returns (
        uint8 creativity,
        uint8 wisdom,
        uint8 humor,
        uint8 empathy
    ) {
        require(_exists(_tokenId), "Muse does not exist");
        Muse memory muse = muses[_tokenId];
        
        return (
            muse.creativity,
            muse.wisdom,
            muse.humor,
            muse.empathy
        );
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}