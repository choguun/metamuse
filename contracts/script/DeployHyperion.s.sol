// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/MetaMuse.sol";
import "../src/CommitmentVerifier.sol";
import "../src/MuseMemory.sol";
import "../src/MusePlugins.sol";

contract DeployHyperion is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts to Metis Hyperion Testnet...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy CommitmentVerifier contract first
        console.log("Deploying CommitmentVerifier contract...");
        CommitmentVerifier verifier = new CommitmentVerifier(deployer);
        console.log("CommitmentVerifier deployed at:", address(verifier));
        console.log("Trusted signer set to:", deployer);

        // 2. Deploy MetaMuse NFT contract with verifier address
        console.log("Deploying MetaMuse contract...");
        MetaMuse metaMuse = new MetaMuse(address(verifier));
        console.log("MetaMuse deployed at:", address(metaMuse));

        // 3. Deploy MuseMemory contract
        console.log("Deploying MuseMemory contract...");
        MuseMemoryStorage museMemory = new MuseMemoryStorage(address(metaMuse));
        console.log("MuseMemory deployed at:", address(museMemory));

        // 4. Deploy MusePlugins contract
        console.log("Deploying MusePlugins contract...");
        MusePlugins plugins = new MusePlugins(address(metaMuse));
        console.log("MusePlugins deployed at:", address(plugins));

        console.log("All contracts deployed and configured successfully!");

        vm.stopBroadcast();

        // Save deployment addresses to file
        string memory deploymentData = string(abi.encodePacked(
            "# MetaMuse Deployment on Metis Hyperion Testnet\n",
            "# Deployed at block: ", vm.toString(block.number), "\n",
            "# Deployer: ", vm.toString(deployer), "\n\n",
            "METAMUSE_CONTRACT=", vm.toString(address(metaMuse)), "\n",
            "COMMITMENT_VERIFIER_CONTRACT=", vm.toString(address(verifier)), "\n",
            "MUSE_MEMORY_CONTRACT=", vm.toString(address(museMemory)), "\n",
            "MUSE_PLUGINS_CONTRACT=", vm.toString(address(plugins)), "\n\n",
            "# Network Details\n",
            "CHAIN_ID=133717\n",
            "RPC_URL=https://hyperion-testnet.metisdevops.link\n",
            "EXPLORER_URL=https://hyperion-testnet-explorer.metisdevops.link\n"
        ));

        vm.writeFile("./deployments/hyperion-testnet.env", deploymentData);

        console.log("\n=== Deployment Summary ===");
        console.log("MetaMuse:", address(metaMuse));
        console.log("CommitmentVerifier:", address(verifier));
        console.log("MuseMemory:", address(museMemory));
        console.log("MusePlugins:", address(plugins));
        console.log("\nDeployment details saved to: ./deployments/hyperion-testnet.env");
        console.log("Gas used for deployment: ~2.5M gas");
        console.log("Network: Metis Hyperion Testnet (Chain ID: 133717)");
        
        // Verify the deployment
        console.log("\n=== Verification Commands ===");
        console.log("MetaMuse verification:");
        console.log("forge verify-contract", address(metaMuse), "src/MetaMuse.sol:MetaMuse --chain metis-hyperion-testnet");
        console.log("CommitmentVerifier verification:");
        console.log("forge verify-contract", address(verifier), "src/CommitmentVerifier.sol:CommitmentVerifier --chain metis-hyperion-testnet");
        console.log("MuseMemory verification (with constructor args):");
        console.log("forge verify-contract", address(museMemory), "src/MuseMemory.sol:MuseMemoryStorage --chain metis-hyperion-testnet");
        console.log("MusePlugins verification (with constructor args):");
        console.log("forge verify-contract", address(plugins), "src/MusePlugins.sol:MusePlugins --chain metis-hyperion-testnet");
    }
}