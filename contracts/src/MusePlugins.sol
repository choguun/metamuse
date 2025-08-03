// contracts/MusePlugins.sol
pragma solidity ^0.8.20;

/**
 * @title MusePlugins - Simple plugin registry
 * @notice Tracks which plugins are active for each muse
 * @dev Plugin execution happens entirely off-chain
 */
contract MusePlugins {
    
    struct Plugin {
        string metadataURI;    // IPFS link to plugin details
        address creator;       // Who created this plugin
        uint256 usageCount;    // Track popularity
        bool active;           // Can be deactivated
    }
    
    Plugin[] public plugins;
    
    // museId => array of active plugin IDs
    mapping(uint256 => uint256[]) public musePlugins;
    
    event PluginRegistered(uint256 indexed pluginId, address creator, string metadataURI);
    event PluginActivated(uint256 indexed museId, uint256 indexed pluginId);
    
    /**
     * @notice Register a new plugin
     */
    function registerPlugin(string memory metadataURI) external returns (uint256) {
        uint256 pluginId = plugins.length;
        
        plugins.push(Plugin({
            metadataURI: metadataURI,
            creator: msg.sender,
            usageCount: 0,
            active: true
        }));
        
        emit PluginRegistered(pluginId, msg.sender, metadataURI);
        return pluginId;
    }
    
    /**
     * @notice Activate a plugin for a muse (must be owner)
     */
    function activatePlugin(uint256 museId, uint256 pluginId) external {
        // In production, verify muse ownership through main contract
        require(pluginId < plugins.length, "Invalid plugin");
        require(plugins[pluginId].active, "Plugin not active");
        
        musePlugins[museId].push(pluginId);
        plugins[pluginId].usageCount++;
        
        emit PluginActivated(museId, pluginId);
    }
    
    /**
     * @notice Get all active plugins for a muse
     */
    function getMusePlugins(uint256 museId) external view returns (uint256[] memory) {
        return musePlugins[museId];
    }
}