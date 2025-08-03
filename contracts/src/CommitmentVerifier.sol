// contracts/CommitmentVerifier.sol
pragma solidity ^0.8.20;

interface ICommitmentVerifier {
    function verifyCommitment(
        uint256 museId,
        bytes32 museDnaHash,
        bytes32 commitmentHash,
        bytes calldata signature
    ) external returns (bool);
}

/**
 * @title CommitmentVerifier - Cryptographic verification for off-chain AI computation
 * @notice Ensures AI responses are authentic and haven't been tampered with
 * @dev Implements commit-reveal scheme with ECDSA signature verification
 */
contract CommitmentVerifier is ICommitmentVerifier {
    
    address public immutable trustedSigner;
    mapping(bytes32 => bool) public usedNonces;
    
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event CommitmentVerified(uint256 indexed museId, bytes32 commitmentHash);
    
    constructor(address _trustedSigner) {
        require(_trustedSigner != address(0), "Invalid signer");
        trustedSigner = _trustedSigner;
    }
    
    /**
     * @notice Verify that an AI interaction commitment is authentic
     * @dev Validates off-chain computation with cryptographic proof
     * @param _museId The muse token ID
     * @param _museDnaHash The muse's unique DNA hash
     * @param _commitmentHash Hash of the interaction data
     * @param _signature ECDSA signature from trusted backend
     */
    function verifyCommitment(
        uint256 _museId,
        bytes32 _museDnaHash,
        bytes32 _commitmentHash,
        bytes calldata _signature
    ) external override returns (bool) {
        require(_signature.length == 65, "Invalid signature length");
        
        // Create the message that should have been signed
        bytes32 message = keccak256(abi.encodePacked(
            _museId,
            _museDnaHash,
            _commitmentHash,
            block.chainid,
            address(this)
        ));
        
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            message
        ));
        
        address signer = recoverSigner(ethSignedMessageHash, _signature);
        
        if (signer == trustedSigner) {
            emit CommitmentVerified(_museId, _commitmentHash);
            return true;
        }
        
        return false;
    }
    
    /**
     * @notice Recover the signer address from a message hash and signature
     * @param _messageHash The hash that was signed
     * @param _signature The ECDSA signature
     */
    function recoverSigner(
        bytes32 _messageHash,
        bytes memory _signature
    ) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_messageHash, v, r, s);
    }
    
    /**
     * @notice Split a signature into its components
     * @param _sig The signature to split
     */
    function splitSignature(bytes memory _sig) internal pure returns (
        bytes32 r,
        bytes32 s,
        uint8 v
    ) {
        require(_sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(_sig, 32))
            s := mload(add(_sig, 64))
            v := byte(0, mload(add(_sig, 96)))
        }
    }
}