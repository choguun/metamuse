// contracts/MusePlugins.sol
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MusePlugins - WASM Plugin Marketplace for AI Muses
 * @notice Manages plugin creation, distribution, and fee sharing
 * @dev Plugins are WASM modules that extend muse capabilities
 */
contract MusePlugins is Ownable {
    
    struct Plugin {
        string metadataURI;     // IPFS link to plugin details
        string wasmHash;        // IPFS hash of WASM module
        address creator;        // Plugin developer
        uint256 price;          // Cost to install (in wei)
        uint256 usageCount;     // Installation count
        uint256 totalRevenue;   // Total earnings
        bool active;            // Can be installed
        uint8 category;         // Plugin category (0=personality, 1=creative, 2=utility)
    }
    
    Plugin[] public plugins;
    
    // museId => pluginId => installed
    mapping(uint256 => mapping(uint256 => bool)) public musePlugins;
    
    // museId => array of installed plugin IDs
    mapping(uint256 => uint256[]) public musePluginList;
    
    // Plugin earnings tracking
    mapping(uint256 => uint256) public pluginEarnings;
    mapping(address => uint256) public creatorEarnings;
    
    // Platform fee (basis points, e.g., 250 = 2.5%)
    uint256 public platformFee = 250;
    uint256 public constant MAX_FEE = 1000; // 10%
    
    // Plugin categories
    uint8 public constant CATEGORY_PERSONALITY = 0;
    uint8 public constant CATEGORY_CREATIVE = 1;
    uint8 public constant CATEGORY_UTILITY = 2;
    
    // Associated MetaMuse contract for ownership verification
    address public metaMuse;
    
    event PluginRegistered(
        uint256 indexed pluginId, 
        address indexed creator, 
        string metadataURI,
        uint256 price,
        uint8 category
    );
    
    event PluginInstalled(
        uint256 indexed museId, 
        uint256 indexed pluginId,
        address indexed installer,
        uint256 price
    );
    
    event PluginRemoved(uint256 indexed museId, uint256 indexed pluginId);
    
    event EarningsWithdrawn(address indexed creator, uint256 amount);
    
    modifier onlyMuseOwner(uint256 _museId) {
        // In production, this would call MetaMuse contract to verify ownership
        // For now, simplified to demonstrate the pattern
        _;
    }
    
    constructor(address _metaMuse) Ownable(msg.sender) {
        metaMuse = _metaMuse;
    }
    
    /**
     * @notice Register a new plugin in the marketplace
     * @param _metadataURI IPFS hash containing plugin details
     * @param _wasmHash IPFS hash of the WASM module
     * @param _price Price in wei (0 for free plugins)
     * @param _category Plugin category
     */
    function registerPlugin(
        string memory _metadataURI,
        string memory _wasmHash,
        uint256 _price,
        uint8 _category
    ) external returns (uint256) {
        require(_category <= CATEGORY_UTILITY, "Invalid category");
        require(bytes(_metadataURI).length > 0, "Empty metadata URI");
        require(bytes(_wasmHash).length > 0, "Empty WASM hash");
        
        uint256 pluginId = plugins.length;
        
        plugins.push(Plugin({
            metadataURI: _metadataURI,
            wasmHash: _wasmHash,
            creator: msg.sender,
            price: _price,
            usageCount: 0,
            totalRevenue: 0,
            active: true,
            category: _category
        }));
        
        emit PluginRegistered(pluginId, msg.sender, _metadataURI, _price, _category);
        return pluginId;
    }
    
    /**
     * @notice Install a plugin on a muse (with payment if required)
     */
    function installPlugin(uint256 _museId, uint256 _pluginId) 
        external 
        payable 
        onlyMuseOwner(_museId) 
    {
        require(_pluginId < plugins.length, "Invalid plugin");
        require(plugins[_pluginId].active, "Plugin not active");
        require(!musePlugins[_museId][_pluginId], "Plugin already installed");
        
        Plugin storage plugin = plugins[_pluginId];
        require(msg.value >= plugin.price, "Insufficient payment");
        
        // Install plugin
        musePlugins[_museId][_pluginId] = true;
        musePluginList[_museId].push(_pluginId);
        
        // Update usage stats
        plugin.usageCount++;
        plugin.totalRevenue += plugin.price;
        
        // Handle payment
        if (plugin.price > 0) {
            uint256 platformCut = (plugin.price * platformFee) / 10000;
            uint256 creatorCut = plugin.price - platformCut;
            
            pluginEarnings[_pluginId] += creatorCut;
            creatorEarnings[plugin.creator] += creatorCut;
            
            // Refund excess payment
            if (msg.value > plugin.price) {
                payable(msg.sender).transfer(msg.value - plugin.price);
            }
        }
        
        emit PluginInstalled(_museId, _pluginId, msg.sender, plugin.price);
    }
    
    /**
     * @notice Remove a plugin from a muse
     */
    function removePlugin(uint256 _museId, uint256 _pluginId) 
        external 
        onlyMuseOwner(_museId) 
    {
        require(musePlugins[_museId][_pluginId], "Plugin not installed");
        
        musePlugins[_museId][_pluginId] = false;
        
        // Remove from plugin list
        uint256[] storage pluginList = musePluginList[_museId];
        for (uint256 i = 0; i < pluginList.length; i++) {
            if (pluginList[i] == _pluginId) {
                pluginList[i] = pluginList[pluginList.length - 1];
                pluginList.pop();
                break;
            }
        }
        
        emit PluginRemoved(_museId, _pluginId);
    }
    
    /**
     * @notice Withdraw earnings as a plugin creator
     */
    function withdrawEarnings() external {
        uint256 earnings = creatorEarnings[msg.sender];
        require(earnings > 0, "No earnings to withdraw");
        
        creatorEarnings[msg.sender] = 0;
        payable(msg.sender).transfer(earnings);
        
        emit EarningsWithdrawn(msg.sender, earnings);
    }
    
    /**
     * @notice Get all installed plugins for a muse
     */
    function getMusePlugins(uint256 _museId) external view returns (uint256[] memory) {
        return musePluginList[_museId];
    }
    
    /**
     * @notice Check if a plugin is installed on a muse
     */
    function isPluginInstalled(uint256 _museId, uint256 _pluginId) external view returns (bool) {
        return musePlugins[_museId][_pluginId];
    }
    
    /**
     * @notice Get plugin details
     */
    function getPlugin(uint256 _pluginId) external view returns (
        string memory metadataURI,
        string memory wasmHash,
        address creator,
        uint256 price,
        uint256 usageCount,
        bool active,
        uint8 category
    ) {
        require(_pluginId < plugins.length, "Invalid plugin");
        Plugin memory plugin = plugins[_pluginId];
        
        return (
            plugin.metadataURI,
            plugin.wasmHash,
            plugin.creator,
            plugin.price,
            plugin.usageCount,
            plugin.active,
            plugin.category
        );
    }
    
    /**
     * @notice Get plugins by category
     */
    function getPluginsByCategory(uint8 _category) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count plugins in category
        for (uint256 i = 0; i < plugins.length; i++) {
            if (plugins[i].category == _category && plugins[i].active) {
                count++;
            }
        }
        
        // Build result array
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < plugins.length; i++) {
            if (plugins[i].category == _category && plugins[i].active) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @notice Update platform fee (owner only)
     */
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "Fee too high");
        platformFee = _newFee;
    }
    
    /**
     * @notice Deactivate a plugin (creator or owner only)
     */
    function deactivatePlugin(uint256 _pluginId) external {
        require(_pluginId < plugins.length, "Invalid plugin");
        require(
            plugins[_pluginId].creator == msg.sender || owner() == msg.sender,
            "Not authorized"
        );
        
        plugins[_pluginId].active = false;
    }
    
    /**
     * @notice Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
    }
}