// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title MuseRating - Decentralized AI Alignment Market
/// @notice World's first marketplace for community-driven AI improvement with token incentives
/// @dev Users earn MUSE tokens for rating AI interactions and providing feedback
contract MuseRating is ERC20, Ownable, ReentrancyGuard {
    
    /// @notice Structure for storing individual interaction ratings
    struct InteractionRating {
        uint256 museId;              // The muse being rated
        address rater;               // Who provided the rating
        uint8 qualityScore;          // 1-10 response quality
        uint8 personalityAccuracy;   // 1-10 personality consistency
        uint8 helpfulness;           // 1-10 helpfulness to user
        string feedback;             // Text feedback for improvement
        uint256 timestamp;           // When rating was submitted
        bool rewarded;               // Whether tokens were distributed
        bytes32 interactionHash;     // Hash of the original interaction
    }
    
    /// @notice Aggregated statistics for each muse
    struct MuseStats {
        uint256 totalRatings;        // Total number of ratings received
        uint256 averageQuality;      // Average quality score (scaled by 100)
        uint256 averagePersonality;  // Average personality score (scaled by 100)
        uint256 averageHelpfulness;  // Average helpfulness score (scaled by 100)
        uint256 totalRewards;        // Total rewards distributed for this muse
        uint256 lastUpdated;         // Last time stats were updated
    }
    
    /// @notice Mapping from rating ID to rating details
    mapping(bytes32 => InteractionRating) public ratings;
    
    /// @notice Mapping from muse ID to aggregated stats
    mapping(uint256 => MuseStats) public museStats;
    
    /// @notice Mapping from user address to total rewards earned
    mapping(address => uint256) public userRewards;
    
    /// @notice Mapping from user to muse to prevent duplicate ratings per interaction
    mapping(address => mapping(uint256 => mapping(bytes32 => bool))) public hasRated;
    
    /// @notice Token rewards configuration
    uint256 public constant RATING_REWARD = 10 * 10**18;        // 10 MUSE tokens per rating
    uint256 public constant HIGH_QUALITY_BONUS = 5 * 10**18;    // 5 MUSE bonus for quality ratings (8+)
    uint256 public constant DETAILED_FEEDBACK_BONUS = 3 * 10**18; // 3 MUSE bonus for detailed feedback
    uint256 public constant MIN_FEEDBACK_LENGTH = 20;           // Minimum characters for feedback bonus
    
    /// @notice Events for tracking rating activity
    event InteractionRated(
        bytes32 indexed ratingId,
        uint256 indexed museId,
        address indexed rater,
        uint8 qualityScore,
        uint8 personalityAccuracy,
        uint8 helpfulness,
        uint256 rewardAmount
    );
    
    event RewardDistributed(
        address indexed user,
        uint256 amount,
        string reason
    );
    
    event MuseStatsUpdated(
        uint256 indexed museId,
        uint256 totalRatings,
        uint256 averageQuality,
        uint256 averagePersonality,
        uint256 averageHelpfulness
    );
    
    /// @notice Initialize the MuseRating contract with initial token supply
    constructor() ERC20("MuseToken", "MUSE") Ownable(msg.sender) {
        // Mint initial supply for rewards distribution
        _mint(msg.sender, 1000000 * 10**18); // 1M MUSE tokens
    }
    
    /// @notice Rate an AI interaction and earn MUSE tokens
    /// @param museId The ID of the muse being rated
    /// @param interactionHash Hash of the interaction being rated
    /// @param qualityScore Response quality score (1-10)
    /// @param personalityAccuracy Personality consistency score (1-10)
    /// @param helpfulness Helpfulness score (1-10)
    /// @param feedback Text feedback for AI improvement
    function rateInteraction(
        uint256 museId,
        string calldata interactionHash,
        uint8 qualityScore,
        uint8 personalityAccuracy,
        uint8 helpfulness,
        string calldata feedback
    ) external nonReentrant {
        // Validate input parameters
        require(qualityScore >= 1 && qualityScore <= 10, "Invalid quality score");
        require(personalityAccuracy >= 1 && personalityAccuracy <= 10, "Invalid personality score");
        require(helpfulness >= 1 && helpfulness <= 10, "Invalid helpfulness score");
        require(bytes(interactionHash).length > 0, "Empty interaction hash");
        
        // Generate unique rating ID
        bytes32 ratingId = keccak256(abi.encodePacked(
            museId,
            msg.sender,
            interactionHash,
            block.timestamp
        ));
        
        bytes32 interactionHashBytes = keccak256(abi.encodePacked(interactionHash));
        
        // Prevent duplicate ratings
        require(ratings[ratingId].rater == address(0), "Rating already exists");
        require(!hasRated[msg.sender][museId][interactionHashBytes], "Already rated this interaction");
        
        // Store the rating
        ratings[ratingId] = InteractionRating({
            museId: museId,
            rater: msg.sender,
            qualityScore: qualityScore,
            personalityAccuracy: personalityAccuracy,
            helpfulness: helpfulness,
            feedback: feedback,
            timestamp: block.timestamp,
            rewarded: true,
            interactionHash: interactionHashBytes
        });
        
        // Mark as rated
        hasRated[msg.sender][museId][interactionHashBytes] = true;
        
        // Update muse statistics
        _updateMuseStats(museId, qualityScore, personalityAccuracy, helpfulness);
        
        // Distribute rewards
        uint256 totalReward = _distributeReward(msg.sender, qualityScore, feedback);
        
        emit InteractionRated(
            ratingId,
            museId,
            msg.sender,
            qualityScore,
            personalityAccuracy,
            helpfulness,
            totalReward
        );
    }
    
    /// @notice Update aggregated statistics for a muse
    /// @param museId The muse ID to update
    /// @param quality New quality score to incorporate
    /// @param personality New personality score to incorporate  
    /// @param helpfulness New helpfulness score to incorporate
    function _updateMuseStats(
        uint256 museId,
        uint8 quality,
        uint8 personality,
        uint8 helpfulness
    ) internal {
        MuseStats storage stats = museStats[museId];
        
        uint256 totalRatings = stats.totalRatings;
        
        if (totalRatings == 0) {
            // First rating for this muse
            stats.averageQuality = quality * 100;
            stats.averagePersonality = personality * 100;
            stats.averageHelpfulness = helpfulness * 100;
        } else {
            // Update running averages (scaled by 100 for precision)
            stats.averageQuality = (stats.averageQuality * totalRatings + quality * 100) / (totalRatings + 1);
            stats.averagePersonality = (stats.averagePersonality * totalRatings + personality * 100) / (totalRatings + 1);
            stats.averageHelpfulness = (stats.averageHelpfulness * totalRatings + helpfulness * 100) / (totalRatings + 1);
        }
        
        stats.totalRatings += 1;
        stats.lastUpdated = block.timestamp;
        
        emit MuseStatsUpdated(
            museId,
            stats.totalRatings,
            stats.averageQuality,
            stats.averagePersonality,
            stats.averageHelpfulness
        );
    }
    
    /// @notice Distribute MUSE token rewards to a rater
    /// @param user The user to reward
    /// @param qualityScore The quality score they provided (for bonus calculation)
    /// @param feedback The feedback they provided (for bonus calculation)
    /// @return totalReward The total amount of tokens distributed
    function _distributeReward(
        address user,
        uint8 qualityScore,
        string calldata feedback
    ) internal returns (uint256 totalReward) {
        totalReward = RATING_REWARD;
        
        // High quality rating bonus
        if (qualityScore >= 8) {
            totalReward += HIGH_QUALITY_BONUS;
            emit RewardDistributed(user, HIGH_QUALITY_BONUS, "High quality rating bonus");
        }
        
        // Detailed feedback bonus
        if (bytes(feedback).length >= MIN_FEEDBACK_LENGTH) {
            totalReward += DETAILED_FEEDBACK_BONUS;
            emit RewardDistributed(user, DETAILED_FEEDBACK_BONUS, "Detailed feedback bonus");
        }
        
        // Update user rewards tracking
        userRewards[user] += totalReward;
        
        // Update muse total rewards
        museStats[0].totalRewards += totalReward; // Global stats
        
        // Mint and transfer tokens
        _mint(user, totalReward);
        
        emit RewardDistributed(user, totalReward, "Rating reward");
        
        return totalReward;
    }
    
    /// @notice Get detailed statistics for a specific muse
    /// @param museId The muse ID to query
    /// @return stats The aggregated statistics
    function getMuseStats(uint256 museId) external view returns (MuseStats memory stats) {
        return museStats[museId];
    }
    
    /// @notice Get a user's rating history for a specific muse  
    /// @param rater The user address
    /// @param museId The muse ID
    /// @return ratingIds Array of rating IDs for this user-muse combination
    function getUserRatings(address rater, uint256 museId) external view returns (bytes32[] memory ratingIds) {
        // Note: This is a simplified version. In production, you'd want to track this more efficiently
        // For hackathon purposes, this demonstrates the concept
        bytes32[] memory tempIds = new bytes32[](100); // Max 100 ratings per query
        uint256 count = 0;
        
        // This is inefficient but demonstrates the data structure
        // In production, you'd maintain separate mappings for efficient queries
        return tempIds;
    }
    
    /// @notice Get the top-rated muses by category
    /// @param category 0=quality, 1=personality, 2=helpfulness
    /// @param limit Maximum number of results
    /// @return museIds Array of muse IDs sorted by the specified category
    function getTopMuses(uint8 category, uint256 limit) external view returns (uint256[] memory museIds) {
        // Simplified implementation for hackathon demo
        // In production, you'd maintain sorted data structures or use subgraphs
        uint256[] memory topMuses = new uint256[](limit);
        return topMuses;
    }
    
    /// @notice Emergency function to pause rating rewards (owner only)
    /// @param paused Whether to pause reward distribution
    function setPaused(bool paused) external onlyOwner {
        // Implementation would add paused state management
        // For hackathon scope, this demonstrates governance capability
    }
    
    /// @notice Get total platform statistics
    /// @return totalUsers Number of unique raters
    /// @return totalRatings Total ratings across all muses
    /// @return totalRewardsDistributed Total MUSE tokens distributed
    function getPlatformStats() external view returns (
        uint256 totalUsers,
        uint256 totalRatings, 
        uint256 totalRewardsDistributed
    ) {
        // Simplified stats - in production you'd track these incrementally
        return (0, 0, museStats[0].totalRewards);
    }
}