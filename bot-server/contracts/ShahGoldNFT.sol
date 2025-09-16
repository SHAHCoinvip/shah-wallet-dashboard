// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ShahGoldNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor(address initialOwner) ERC721("SHAH GOLD NFT", "SHAHG") Ownable(initialOwner) {}

    /**
     * @notice Mint a new SHAH GOLD NFT to `to` with `tokenURI`.
     * @param to Recipient address
     * @param uri IPFS/HTTPS metadata URI
     */
    function mint(address to, string memory uri) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
}
