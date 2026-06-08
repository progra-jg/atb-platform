// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ProductorIdentity is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct Identity {
        string did;          // Decentralized Identifier
        bytes32 kycHash;     // Hash of KYC documents
        bool verified;
        uint256 verifiedAt;
        address verifier;
    }

    mapping(address => Identity) public identities;
    mapping(string => address) private didToAddress;

    event IdentityCreated(address indexed user, string did);
    event IdentityVerified(address indexed user, address verifier);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    function createIdentity(string memory did, bytes32 kycHash) public {
        require(identities[msg.sender].verified == false, "Identity already exists");
        require(didToAddress[did] == address(0), "DID already registered");

        identities[msg.sender] = Identity({
            did: did,
            kycHash: kycHash,
            verified: false,
            verifiedAt: 0,
            verifier: address(0)
        });

        didToAddress[did] = msg.sender;
        emit IdentityCreated(msg.sender, did);
    }

    function verifyIdentity(address user) public onlyRole(VERIFIER_ROLE) {
        require(bytes(identities[user].did).length > 0, "Identity does not exist");
        identities[user].verified = true;
        identities[user].verifiedAt = block.timestamp;
        identities[user].verifier = msg.sender;
        emit IdentityVerified(user, msg.sender);
    }

    function getIdentity(address user) public view returns (Identity memory) {
        require(bytes(identities[user].did).length > 0, "Identity not found");
        return identities[user];
    }

    function resolveDID(string memory did) public view returns (address) {
        address user = didToAddress[did];
        require(user != address(0), "DID not found");
        return user;
    }
}
