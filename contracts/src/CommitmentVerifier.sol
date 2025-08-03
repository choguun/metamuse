// contracts/CommitmentVerifier.sol
pragma solidity ^0.8.20;

/**
 * @title CommitmentVerifier - Proves off-chain computation is authentic
 * @notice This is like a notary public for AI responses
 */
contract CommitmentVerifier {
    
    // The backend's public key - this is what creates trust
    address public immutable trustedSigner;
    
    // Prevent replay attacks
    mapping(bytes32 => bool) public usedCommitments;
    
    event CommitmentVerified(uint256 indexed museId, bytes32 commitmentHash);
    
    constructor(address _trustedSigner) {
        trustedSigner = _trustedSigner;
    }
    
    /**
     * @notice Verify that a response genuinely came from our backend
     * @dev This is the bridge between off-chain computation and on-chain trust
     */
    function verifyCommitment(
        uint256 museId,
        bytes32 museDnaHash,
        bytes32 commitmentHash,
        bytes calldata signature
    ) external returns (bool) {
        // Ensure this proof hasn't been used before
        require(!usedCommitments[commitmentHash], "Commitment already used");
        
        // Recreate what the backend should have signed
        bytes32 message = keccak256(abi.encodePacked(
            museId,
            museDnaHash,
            commitmentHash,
            block.chainid  // Prevent cross-chain replay
        ));
        
        // Verify the signature
        address signer = recoverSigner(message, signature);
        require(signer == trustedSigner, "Invalid signer");
        
        // Mark as used
        usedCommitments[commitmentHash] = true;
        
        emit CommitmentVerified(museId, commitmentHash);
        return true;
    }
    
    // Standard signature recovery
    function recoverSigner(bytes32 message, bytes memory sig) 
        internal pure returns (address) 
    {
        bytes32 ethSignedMessage = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(sig);
        return ecrecover(ethSignedMessage, v, r, s);
    }
    
    function splitSignature(bytes memory sig) 
        internal pure returns (bytes32 r, bytes32 s, uint8 v) 
    {
        require(sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}