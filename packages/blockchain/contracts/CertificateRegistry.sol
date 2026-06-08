// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract CertificateRegistry is AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Certificate {
        string certType;       // "EUDR" or "GlobalGAP"
        address holder;
        uint256 lotId;
        uint256 issuedAt;
        uint256 expiresAt;
        bool revoked;
        string metadataURI;
    }

    uint256 private _certIdCounter;
    mapping(uint256 => Certificate) public certificates;
    mapping(address => uint256[]) public holderCertificates;

    event CertificateIssued(uint256 indexed certId, address indexed holder, string certType);
    event CertificateRevoked(uint256 indexed certId);
    event CertificateVerified(uint256 indexed certId, bool valid);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }

    function issue(
        address holder,
        uint256 lotId,
        string memory certType,
        uint256 validityDays,
        string memory metadataURI
    ) public onlyRole(ISSUER_ROLE) returns (uint256) {
        _certIdCounter++;
        uint256 certId = _certIdCounter;

        certificates[certId] = Certificate({
            certType: certType,
            holder: holder,
            lotId: lotId,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + (validityDays * 1 days),
            revoked: false,
            metadataURI: metadataURI
        });

        holderCertificates[holder].push(certId);
        emit CertificateIssued(certId, holder, certType);
        return certId;
    }

    function revoke(uint256 certId) public onlyRole(ISSUER_ROLE) {
        require(certificates[certId].issuedAt != 0, "Certificate does not exist");
        certificates[certId].revoked = true;
        emit CertificateRevoked(certId);
    }

    function verify(uint256 certId) public view returns (bool valid, Certificate memory cert) {
        cert = certificates[certId];
        require(cert.issuedAt != 0, "Certificate does not exist");

        if (cert.revoked) return (false, cert);
        if (block.timestamp > cert.expiresAt) return (false, cert);
        return (true, cert);
    }
}
