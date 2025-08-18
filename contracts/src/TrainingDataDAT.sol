// contracts/TrainingDataDAT.sol
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title TrainingDataDAT - AI Training Data Marketplace with DAT Rewards
 * @notice World's first decentralized marketplace for AI training data contributions
 * @dev ERC1155 multi-token standard for different types of training data contributions
 */
contract TrainingDataDAT is ERC1155, Ownable, ReentrancyGuard {
    
    // Training data contribution types (token IDs)
    uint256 public constant CONVERSATION_CORRECTION_DAT = 1;    // Users correct AI responses
    uint256 public constant PREFERENCE_FEEDBACK_DAT = 2;        // Users provide preference data
    uint256 public constant QUALITY_RATING_DAT = 3;            // Users rate AI responses
    uint256 public constant PERSONALITY_TUNING_DAT = 4;         // Users help tune personality traits
    uint256 public constant CONVERSATION_CURATION_DAT = 5;      // Users curate valuable conversations
    uint256 public constant SEMANTIC_ENHANCEMENT_DAT = 6;       // Users improve semantic understanding
    
    struct ContributionRecord {
        address contributor;
        uint256 museTokenId;           // Associated muse
        uint256 contributionType;      // Type of DAT earned
        uint256 qualityScore;          // Community-validated quality (1-100)
        bytes32 dataHash;              // Hash of contributed data
        string ipfsHash;               // IPFS storage of contribution data
        uint256 timestamp;
        uint256 rewardAmount;          // DATs earned for this contribution
        bool validated;                // Community validation status
        uint256 validationCount;       // Number of validators
    }
    
    struct RewardPool {
        uint256 totalPool;             // Total DATs available for rewards
        uint256 dailyDistribution;     // DATs distributed per day
        uint256 lastDistribution;      // Timestamp of last distribution
        uint256 qualityMultiplier;     // Bonus for high-quality contributions
        bool active;                   // Pool active status
    }
    
    struct ContributorStats {
        uint256 totalContributions;
        uint256 totalDATsEarned;
        uint256 averageQualityScore;
        uint256 validationsPassed;
        uint256 streak;                // Consecutive days of contributions
        uint256 lastContribution;
        bool qualityContributor;       // Badge for consistent quality
    }
    
    // Core storage
    mapping(uint256 => ContributionRecord) public contributions;
    mapping(address => ContributorStats) public contributorStats;
    mapping(uint256 => RewardPool) public rewardPools;
    mapping(bytes32 => bool) public usedDataHashes;
    mapping(address => mapping(uint256 => uint256)) public contributorTypeBalances;
    mapping(bytes32 => mapping(address => bool)) public validationVotes;
    mapping(address => uint256[]) public contributorHistory;
    
    // Associated contracts
    IERC721 public immutable metaMuse;
    address public alignmentMarket;
    
    // Reward configuration
    uint256 public baseRewardAmount = 10 * 10**18;      // 10 DAT tokens base reward
    uint256 public qualityBonus = 5 * 10**18;           // 5 DAT bonus for high quality
    uint256 public streakBonus = 2 * 10**18;            // 2 DAT bonus for streaks
    uint256 public validationReward = 1 * 10**18;       // 1 DAT for validating others
    uint256 public validationThreshold = 3;             // Minimum validators needed
    
    // Events
    event TrainingDataContributed(
        uint256 indexed contributionId,
        address indexed contributor,
        uint256 indexed museTokenId,
        uint256 contributionType,
        uint256 rewardAmount,
        bytes32 dataHash
    );
    
    event ContributionValidated(
        uint256 indexed contributionId,
        address indexed validator,
        bool approved,
        uint256 newQualityScore
    );
    
    event DATRewardDistributed(
        address indexed contributor,
        uint256 contributionType,
        uint256 amount,
        uint256 qualityScore
    );
    
    event QualityContributorBadgeAwarded(
        address indexed contributor,
        uint256 totalContributions
    );
    
    event RewardPoolUpdated(
        uint256 indexed contributionType,
        uint256 newTotalPool,
        uint256 newDailyDistribution
    );
    
    uint256 private _nextContributionId = 1;
    
    constructor(
        address _metaMuse,
        address _alignmentMarket
    ) ERC1155("https://gateway.pinata.cloud/ipfs/{id}.json") Ownable(msg.sender) {
        metaMuse = IERC721(_metaMuse);
        alignmentMarket = _alignmentMarket;
        
        // Initialize reward pools
        _initializeRewardPools();
    }
    
    /**
     * @notice Contribute training data and earn DAT rewards
     * @dev Encrypts and stores training data to IPFS, mints DAT rewards
     */
    function contributeTrainingData(
        uint256 _museTokenId,
        uint256 _contributionType,
        bytes32 _dataHash,
        string calldata _ipfsHash,
        bytes calldata _encryptedData
    ) external nonReentrant returns (uint256) {
        require(_contributionType >= 1 && _contributionType <= 6, "Invalid contribution type");
        require(metaMuse.ownerOf(_museTokenId) != address(0), "Muse does not exist");
        require(!usedDataHashes[_dataHash], "Data already contributed");
        require(bytes(_ipfsHash).length > 0, "Missing IPFS hash");
        require(_encryptedData.length > 0, "Missing encrypted data");
        
        uint256 contributionId = _nextContributionId++;
        
        // Calculate reward amount based on contributor stats and quality
        uint256 rewardAmount = _calculateReward(msg.sender, _contributionType);
        
        // Create contribution record
        contributions[contributionId] = ContributionRecord({
            contributor: msg.sender,
            museTokenId: _museTokenId,
            contributionType: _contributionType,
            qualityScore: 50, // Initial score, updated by validation
            dataHash: _dataHash,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            rewardAmount: rewardAmount,
            validated: false,
            validationCount: 0
        });
        
        // Mark data as used
        usedDataHashes[_dataHash] = true;
        
        // Update contributor stats
        _updateContributorStats(msg.sender, _contributionType, rewardAmount);
        
        // Add to contributor history
        contributorHistory[msg.sender].push(contributionId);
        
        // Mint DAT rewards immediately (subject to later validation)
        _mint(msg.sender, _contributionType, rewardAmount, "");
        
        // Update balance tracking
        contributorTypeBalances[msg.sender][_contributionType] += rewardAmount;
        
        emit TrainingDataContributed(
            contributionId,
            msg.sender,
            _museTokenId,
            _contributionType,
            rewardAmount,
            _dataHash
        );
        
        emit DATRewardDistributed(
            msg.sender,
            _contributionType,
            rewardAmount,
            50 // Initial quality score
        );
        
        return contributionId;
    }
    
    /**
     * @notice Validate a training data contribution from community
     * @dev Community members can vote on contribution quality
     */
    function validateContribution(
        uint256 _contributionId,
        bool _approved,
        uint256 _qualityScore
    ) external {
        require(_contributionId < _nextContributionId, "Invalid contribution ID");
        require(_qualityScore >= 1 && _qualityScore <= 100, "Invalid quality score");
        
        ContributionRecord storage contribution = contributions[_contributionId];
        require(contribution.contributor != msg.sender, "Cannot validate own contribution");
        require(!validationVotes[contribution.dataHash][msg.sender], "Already validated");
        
        // Record validation vote
        validationVotes[contribution.dataHash][msg.sender] = true;
        contribution.validationCount++;
        
        // Update quality score (average of all validator scores)
        contribution.qualityScore = (contribution.qualityScore + _qualityScore) / 2;
        
        // Mark as validated if threshold reached
        if (contribution.validationCount >= validationThreshold) {
            contribution.validated = true;
            
            // Award bonus for high-quality contributions
            if (contribution.qualityScore >= 80) {
                uint256 bonus = qualityBonus;
                _mint(contribution.contributor, contribution.contributionType, bonus, "");
                contributorTypeBalances[contribution.contributor][contribution.contributionType] += bonus;
                
                emit DATRewardDistributed(
                    contribution.contributor,
                    contribution.contributionType,
                    bonus,
                    contribution.qualityScore
                );
            }
        }
        
        // Reward validator with small amount
        _mint(msg.sender, QUALITY_RATING_DAT, validationReward, "");
        contributorTypeBalances[msg.sender][QUALITY_RATING_DAT] += validationReward;
        
        emit ContributionValidated(
            _contributionId,
            msg.sender,
            _approved,
            contribution.qualityScore
        );
    }
    
    /**
     * @notice Calculate reward amount based on contribution type and contributor history
     */
    function _calculateReward(address _contributor, uint256 _contributionType) internal view returns (uint256) {
        ContributorStats memory stats = contributorStats[_contributor];
        uint256 reward = baseRewardAmount;
        
        // Quality contributor bonus
        if (stats.qualityContributor) {
            reward += qualityBonus;
        }
        
        // Streak bonus
        if (_isOnStreak(_contributor)) {
            reward += streakBonus;
        }
        
        // Type-specific multipliers
        if (_contributionType == CONVERSATION_CORRECTION_DAT) {
            reward = (reward * 120) / 100; // 20% bonus for corrections
        } else if (_contributionType == PERSONALITY_TUNING_DAT) {
            reward = (reward * 150) / 100; // 50% bonus for personality tuning
        }
        
        return reward;
    }
    
    /**
     * @notice Update contributor statistics
     */
    function _updateContributorStats(address _contributor, uint256 _contributionType, uint256 _rewardAmount) internal {
        ContributorStats storage stats = contributorStats[_contributor];
        
        stats.totalContributions++;
        stats.totalDATsEarned += _rewardAmount;
        
        // Update streak
        if (block.timestamp - stats.lastContribution <= 86400) { // 24 hours
            stats.streak++;
        } else {
            stats.streak = 1;
        }
        stats.lastContribution = block.timestamp;
        
        // Award quality contributor badge
        if (stats.totalContributions >= 100 && stats.averageQualityScore >= 75 && !stats.qualityContributor) {
            stats.qualityContributor = true;
            emit QualityContributorBadgeAwarded(_contributor, stats.totalContributions);
        }
    }
    
    /**
     * @notice Check if contributor is on a contribution streak
     */
    function _isOnStreak(address _contributor) internal view returns (bool) {
        ContributorStats memory stats = contributorStats[_contributor];
        return stats.streak >= 3 && (block.timestamp - stats.lastContribution) <= 86400;
    }
    
    /**
     * @notice Initialize reward pools for different contribution types
     */
    function _initializeRewardPools() internal {
        rewardPools[CONVERSATION_CORRECTION_DAT] = RewardPool({
            totalPool: 1000000 * 10**18, // 1M DATs
            dailyDistribution: 10000 * 10**18, // 10K DATs per day
            lastDistribution: block.timestamp,
            qualityMultiplier: 150, // 50% bonus for quality
            active: true
        });
        
        rewardPools[PREFERENCE_FEEDBACK_DAT] = RewardPool({
            totalPool: 500000 * 10**18,
            dailyDistribution: 5000 * 10**18,
            lastDistribution: block.timestamp,
            qualityMultiplier: 120,
            active: true
        });
        
        rewardPools[QUALITY_RATING_DAT] = RewardPool({
            totalPool: 750000 * 10**18,
            dailyDistribution: 7500 * 10**18,
            lastDistribution: block.timestamp,
            qualityMultiplier: 110,
            active: true
        });
        
        rewardPools[PERSONALITY_TUNING_DAT] = RewardPool({
            totalPool: 2000000 * 10**18,
            dailyDistribution: 20000 * 10**18,
            lastDistribution: block.timestamp,
            qualityMultiplier: 200, // Highest value contribution
            active: true
        });
        
        rewardPools[CONVERSATION_CURATION_DAT] = RewardPool({
            totalPool: 800000 * 10**18,
            dailyDistribution: 8000 * 10**18,
            lastDistribution: block.timestamp,
            qualityMultiplier: 130,
            active: true
        });
        
        rewardPools[SEMANTIC_ENHANCEMENT_DAT] = RewardPool({
            totalPool: 600000 * 10**18,
            dailyDistribution: 6000 * 10**18,
            lastDistribution: block.timestamp,
            qualityMultiplier: 125,
            active: true
        });
    }
    
    /**
     * @notice Get contribution details
     */
    function getContribution(uint256 _contributionId) external view returns (
        address contributor,
        uint256 museTokenId,
        uint256 contributionType,
        uint256 qualityScore,
        string memory ipfsHash,
        uint256 timestamp,
        uint256 rewardAmount,
        bool validated
    ) {
        require(_contributionId < _nextContributionId, "Invalid contribution ID");
        ContributionRecord memory contribution = contributions[_contributionId];
        
        return (
            contribution.contributor,
            contribution.museTokenId,
            contribution.contributionType,
            contribution.qualityScore,
            contribution.ipfsHash,
            contribution.timestamp,
            contribution.rewardAmount,
            contribution.validated
        );
    }
    
    /**
     * @notice Get contributor statistics
     */
    function getContributorStats(address _contributor) external view returns (ContributorStats memory) {
        return contributorStats[_contributor];
    }
    
    /**
     * @notice Get contributor's contribution history
     */
    function getContributorHistory(address _contributor) external view returns (uint256[] memory) {
        return contributorHistory[_contributor];
    }
    
    /**
     * @notice Get reward pool information
     */
    function getRewardPool(uint256 _contributionType) external view returns (RewardPool memory) {
        return rewardPools[_contributionType];
    }
    
    /**
     * @notice Check if data hash has been used
     */
    function isDataUsed(bytes32 _dataHash) external view returns (bool) {
        return usedDataHashes[_dataHash];
    }
    
    /**
     * @notice Get total DAT balance for contributor by type
     */
    function getDATBalance(address _contributor, uint256 _contributionType) external view returns (uint256) {
        return contributorTypeBalances[_contributor][_contributionType];
    }
    
    /**
     * @notice Get total contributions count
     */
    function getTotalContributions() external view returns (uint256) {
        return _nextContributionId - 1;
    }
    
    /**
     * @notice Admin functions
     */
    function updateRewardPool(
        uint256 _contributionType,
        uint256 _totalPool,
        uint256 _dailyDistribution,
        uint256 _qualityMultiplier
    ) external onlyOwner {
        RewardPool storage pool = rewardPools[_contributionType];
        pool.totalPool = _totalPool;
        pool.dailyDistribution = _dailyDistribution;
        pool.qualityMultiplier = _qualityMultiplier;
        
        emit RewardPoolUpdated(_contributionType, _totalPool, _dailyDistribution);
    }
    
    function setRewardAmounts(
        uint256 _baseReward,
        uint256 _qualityBonus,
        uint256 _streakBonus,
        uint256 _validationReward
    ) external onlyOwner {
        baseRewardAmount = _baseReward;
        qualityBonus = _qualityBonus;
        streakBonus = _streakBonus;
        validationReward = _validationReward;
    }
    
    function setAlignmentMarket(address _alignmentMarket) external onlyOwner {
        alignmentMarket = _alignmentMarket;
    }
    
    /**
     * @notice Emergency withdrawal for contract owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice Override URI to return contribution type metadata
     */
    function uri(uint256 _contributionType) public pure override returns (string memory) {
        string[7] memory typeNames = ["", "correction", "preference", "rating", "personality", "curation", "semantic"];
        require(_contributionType >= 1 && _contributionType <= 6, "Invalid contribution type");
        
        return string(abi.encodePacked(
            "https://gateway.pinata.cloud/ipfs/QmTrainingDAT",
            typeNames[_contributionType],
            ".json"
        ));
    }
}