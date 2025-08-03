// contracts/MetaMuse.sol
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MetaMuse - Simplified for current implementation
 * @notice This contract establishes ownership and core identity of AI muses
 * @dev Complex AI operations are handled off-chain with on-chain verification
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
    }
    
    mapping(uint256 => Muse) public muses;
    mapping(uint256 => mapping(address => bool)) public interactionPermissions;
    
    // Simple events for transparency
    event MuseCreated(uint256 indexed tokenId, address indexed creator, bytes32 dnaHash);
    event InteractionRecorded(uint256 indexed tokenId, address indexed user);
    
    uint256 private _nextTokenId = 1;
    
    constructor() ERC721("MetaMuse", "MUSE") Ownable(msg.sender) {}
    
    /**
     * @notice Create a new muse with specific personality traits
     * @dev The dnaHash links to off-chain AI embeddings
     */
    function createMuse(
        uint8 creativity,
        uint8 wisdom,
        uint8 humor,
        uint8 empathy
    ) external returns (uint256) {
        require(creativity <= 100 && wisdom <= 100 && humor <= 100 && empathy <= 100, 
                "Traits must be 0-100");
        
        uint256 tokenId = _nextTokenId++;
        
        // Generate unique DNA hash from traits and creator
        bytes32 dnaHash = keccak256(abi.encodePacked(
            creativity,
            wisdom,
            humor,
            empathy,
            msg.sender,
            block.timestamp,
            tokenId
        ));
        
        muses[tokenId] = Muse({
            creativity: creativity,
            wisdom: wisdom,
            humor: humor,
            empathy: empathy,
            dnaHash: dnaHash,
            birthBlock: block.number,
            totalInteractions: 0
        });
        
        _mint(msg.sender, tokenId);
        emit MuseCreated(tokenId, msg.sender, dnaHash);
        
        return tokenId;
    }
    
    /**
     * @notice Record an interaction (called by backend after verification)
     * @dev Simplified version - in production would verify backend signature
     */
    function recordInteraction(uint256 tokenId) external {
        require(_exists(tokenId), "Muse does not exist");
        require(
            ownerOf(tokenId) == msg.sender || interactionPermissions[tokenId][msg.sender],
            "Not authorized"
        );
        
        muses[tokenId].totalInteractions++;
        emit InteractionRecorded(tokenId, msg.sender);
    }
    
    /**
     * @notice Grant permission for someone else to interact with your muse
     */
    function grantInteractionPermission(uint256 tokenId, address user) external {
        require(ownerOf(tokenId) == msg.sender, "Not muse owner");
        interactionPermissions[tokenId][user] = true;
    }
    
    /**
     * @notice Get full muse data for backend processing
     */
    function getMuseData(uint256 tokenId) external view returns (
        uint8 creativity,
        uint8 wisdom,
        uint8 humor,
        uint8 empathy,
        bytes32 dnaHash,
        uint256 totalInteractions,
        address owner
    ) {
        require(_exists(tokenId), "Muse does not exist");
        Muse memory muse = muses[tokenId];
        
        return (
            muse.creativity,
            muse.wisdom,
            muse.humor,
            muse.empathy,
            muse.dnaHash,
            muse.totalInteractions,
            ownerOf(tokenId)
        );
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId < _nextTokenId;
    }
}