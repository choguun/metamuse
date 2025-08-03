// contracts/MuseMemory.sol
pragma solidity ^0.8.20;

/**
 * @title MuseMemory - Simplified memory verification
 * @notice Stores memory commitments for verification without complex sharding
 * @dev Actual memory storage happens off-chain (IPFS/backend)
 */
contract MuseMemory {
    
    struct MemoryCommitment {
        bytes32 memoryHash;    // Hash of the memory content
        uint256 timestamp;     // When this memory was created
        uint256 interactionNumber; // Sequential interaction count
    }
    
    // museId => array of memory commitments
    mapping(uint256 => MemoryCommitment[]) public memories;
    
    // museId => user => last interaction index (for continuation)
    mapping(uint256 => mapping(address => uint256)) public lastInteractionIndex;
    
    event MemoryCommitted(uint256 indexed museId, address indexed user, bytes32 memoryHash);
    
    /**
     * @notice Commit a memory hash after an interaction
     * @dev Called by backend after processing and storing full memory
     */
    function commitMemory(
        uint256 museId,
        bytes32 memoryHash,
        address user
    ) external returns (uint256 index) {
        // In production, verify backend signature here
        
        index = memories[museId].length;
        
        memories[museId].push(MemoryCommitment({
            memoryHash: memoryHash,
            timestamp: block.timestamp,
            interactionNumber: index
        }));
        
        lastInteractionIndex[museId][user] = index;
        
        emit MemoryCommitted(museId, user, memoryHash);
    }
    
    /**
     * @notice Verify a memory exists in the chain
     */
    function verifyMemory(
        uint256 museId,
        uint256 index,
        bytes32 memoryHash
    ) external view returns (bool) {
        if (index >= memories[museId].length) return false;
        return memories[museId][index].memoryHash == memoryHash;
    }
    
    /**
     * @notice Get memory count for affinity calculations
     */
    function getMemoryCount(uint256 museId) external view returns (uint256) {
        return memories[museId].length;
    }
}