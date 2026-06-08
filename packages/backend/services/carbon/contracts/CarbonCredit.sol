// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CarbonCredit is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // 1 token = 1 tCO2 avoided
    uint256 public constant TCO2_PER_TOKEN = 1;

    struct CreditBatch {
        uint256 amount;
        string projectId;
        string registry;
        uint256 vintage;
        bool retired;
    }

    CreditBatch[] public batches;
    mapping(uint256 => address) public batchOwner;

    event CreditsMinted(uint256 indexed batchId, uint256 amount, string registry);
    event CreditsRetired(uint256 indexed batchId, address indexed retiree);

    constructor() ERC20("ATB Carbon Credit", "ATBCO2") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mintCredits(address to, uint256 amount, string memory projectId, string memory registry)
        public onlyRole(MINTER_ROLE) returns (uint256)
    {
        _mint(to, amount * TCO2_PER_TOKEN);

        uint256 batchId = batches.length;
        batches.push(CreditBatch(amount, projectId, registry, block.timestamp, false));
        batchOwner[batchId] = to;

        emit CreditsMinted(batchId, amount, registry);
        return batchId;
    }

    function retireCredits(uint256 batchId) public {
        require(batchOwner[batchId] == msg.sender, "Not the batch owner");
        require(!batches[batchId].retired, "Already retired");

        batches[batchId].retired = true;
        _burn(msg.sender, batches[batchId].amount * TCO2_PER_TOKEN);

        emit CreditsRetired(batchId, msg.sender);
    }

    function getBatch(uint256 batchId) public view returns (CreditBatch memory) {
        require(batchId < batches.length, "Batch does not exist");
        return batches[batchId];
    }
}
