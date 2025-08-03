// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICommitmentVerifier {
    function verifyCommitment(
        uint256 museId,
        bytes32 museDnaHash,
        bytes32 commitmentHash,
        bytes calldata signature
    ) external returns (bool);
}