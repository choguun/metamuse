// contracts/MuseMemory.sol
pragma solidity ^0.8.20;

/**
 * @title MuseMemoryStorage - IPFS-backed memory storage for AI muses
 * @notice Stores memory metadata and IPFS references with Merkle tree indexing
 * @dev Designed for parallel memory updates and efficient retrieval
 */
contract MuseMemoryStorage {
    
    struct MemoryMetadata {
        string ipfsHash;
        bytes32 contentHash;
        uint256 timestamp;
        uint256 importance;
        address creator;
    }
    
    struct MemoryIndex {
        string currentIndexIPFS;
        uint256 totalMemories;
        uint256 lastUpdate;
        bytes32 merkleRoot;
    }
    
    // museId => MemoryIndex
    mapping(uint256 => MemoryIndex) public museIndexes;
    
    // museId => memory hash => metadata
    mapping(uint256 => mapping(bytes32 => MemoryMetadata)) public memories;
    
    // Access control
    address public metaMuse;
    
    event MemoryStored(
        uint256 indexed museId,
        bytes32 indexed memoryHash,
        string ipfsHash
    );
    
    event IndexUpdated(
        uint256 indexed museId,
        string newIndexIPFS,
        bytes32 newMerkleRoot
    );
    
    modifier onlyMetaMuse() {
        require(msg.sender == metaMuse, "Only MetaMuse");
        _;
    }
    
    constructor(address _metaMuse) {
        metaMuse = _metaMuse;
    }
    
    /**
     * @notice Store memory metadata with IPFS reference
     * @dev Called by MetaMuse contract after interaction verification
     */
    function storeMemory(
        uint256 _museId,
        string calldata _ipfsHash,
        bytes32 _contentHash,
        uint256 _importance
    ) external onlyMetaMuse returns (bytes32) {
        bytes32 memoryHash = keccak256(abi.encodePacked(
            _museId,
            _ipfsHash,
            _contentHash,
            block.timestamp
        ));
        
        memories[_museId][memoryHash] = MemoryMetadata({
            ipfsHash: _ipfsHash,
            contentHash: _contentHash,
            timestamp: block.timestamp,
            importance: _importance,
            creator: tx.origin
        });
        
        museIndexes[_museId].totalMemories++;
        museIndexes[_museId].lastUpdate = block.timestamp;
        
        emit MemoryStored(_museId, memoryHash, _ipfsHash);
        
        return memoryHash;
    }
    
    /**
     * @notice Update the IPFS index for a muse's memories
     * @dev Called when reorganizing memories for efficient retrieval
     */
    function updateIndex(
        uint256 _museId,
        string calldata _newIndexIPFS,
        bytes32 _newMerkleRoot
    ) external onlyMetaMuse {
        museIndexes[_museId].currentIndexIPFS = _newIndexIPFS;
        museIndexes[_museId].merkleRoot = _newMerkleRoot;
        museIndexes[_museId].lastUpdate = block.timestamp;
        
        emit IndexUpdated(_museId, _newIndexIPFS, _newMerkleRoot);
    }
    
    /**
     * @notice Get memory metadata by hash
     */
    function getMemory(
        uint256 _museId,
        bytes32 _memoryHash
    ) external view returns (MemoryMetadata memory) {
        return memories[_museId][_memoryHash];
    }
    
    /**
     * @notice Get the current memory index for a muse
     */
    function getIndex(uint256 _museId) external view returns (
        string memory indexIPFS,
        uint256 totalMemories,
        bytes32 merkleRoot
    ) {
        MemoryIndex memory index = museIndexes[_museId];
        return (index.currentIndexIPFS, index.totalMemories, index.merkleRoot);
    }
    
    /**
     * @notice Verify a memory exists and matches the expected content hash
     */
    function verifyMemoryIntegrity(
        uint256 _museId,
        bytes32 _memoryHash,
        bytes32 _expectedContentHash
    ) external view returns (bool) {
        MemoryMetadata memory memoryData = memories[_museId][_memoryHash];
        return memoryData.contentHash == _expectedContentHash && memoryData.timestamp > 0;
    }
}