// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LotRegistry is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    uint256 private _tokenIdCounter;

    struct LotInfo {
        string culture;
        uint256 quantite;
        string parcelleId;
        address owner;
        uint256 parentLotId;
        bool exists;
    }

    mapping(uint256 => LotInfo) public lots;
    mapping(uint256 => address[]) public transferHistory;

    event LotMinted(uint256 indexed tokenId, address indexed owner, string culture);
    event LotTransferred(uint256 indexed tokenId, address from, address to);
    event LotBurned(uint256 indexed tokenId);

    constructor() ERC721("ATB AgriTrace Lot", "ATBLOT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(
        address to,
        string memory uri,
        string memory culture,
        uint256 quantite,
        string memory parcelleId,
        uint256 parentLotId
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        lots[tokenId] = LotInfo(culture, quantite, parcelleId, to, parentLotId, true);
        transferHistory[tokenId].push(to);

        emit LotMinted(tokenId, to, culture);
        return tokenId;
    }

    function transferLot(address to, uint256 tokenId) public {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "Not authorized");
        address from = ownerOf(tokenId);
        _transfer(from, to, tokenId);
        lots[tokenId].owner = to;
        transferHistory[tokenId].push(to);
        emit LotTransferred(tokenId, from, to);
    }

    function verifyLot(uint256 tokenId) public view returns (bool, LotInfo memory) {
        require(lots[tokenId].exists, "Lot does not exist");
        return (true, lots[tokenId]);
    }

    function burn(uint256 tokenId) public onlyRole(VERIFIER_ROLE) {
        require(lots[tokenId].exists, "Lot does not exist");
        delete lots[tokenId];
        _burn(tokenId);
        emit LotBurned(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
