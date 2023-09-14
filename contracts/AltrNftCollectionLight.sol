// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AltrNftCollectionLight
 * @author Lucidao Developer
 * @dev Contract for minting and managing ERC-721 NFT in the context of generating a light digitisation certificate for a real object.
 * It allows for the minting of NFTs, setting of token URI, managing the NFTs' minting role.
 * @dev This contract inherits from ERC721URIStorage, ERC721Enumerable, ERC721Burnable, AccessControl, ReentrancyGuard contracts.
 * @dev The contract is controlled by an admin and an oracle.
 */
contract AltrNftCollectionLight is ERC721URIStorage, ERC721Enumerable, ERC721Burnable, AccessControl, ReentrancyGuard {
	using Counters for Counters.Counter;

	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	Counters.Counter private _tokenIdCounter;

	/**
	 * @dev Constructor function that initializes the AltrNftCollection contract
	 * @param name_ The name of the token
	 * @param symbol_ The symbol of the token
	 * @param oracleAddress_ The address of the oracle contract
	 * @param adminAddress_ The address of the admin
	 */
	constructor(string memory name_, string memory symbol_, address oracleAddress_, address adminAddress_) ERC721(name_, symbol_) {
		require(oracleAddress_ != address(0) && adminAddress_ != address(0), "AltrNftCollection: cannot be null address");

		_grantRole(DEFAULT_ADMIN_ROLE, adminAddress_);
		_grantRole(MINTER_ROLE, oracleAddress_);

		_tokenIdCounter.increment();
	}

	/**
	 * @dev Allows the minter role to mint a new NFT, assigns the tokenURI
	 * @param to The receiver of the NFT that is being minted
	 * @param uri The URI of the NFT that is being minted
	 */
	function safeMint(address to, string memory uri) external nonReentrant onlyRole(MINTER_ROLE) {
		uint256 tokenId = _tokenIdCounter.current();
		_tokenIdCounter.increment();
		_safeMint(to, tokenId);
		_setTokenURI(tokenId, uri);
	}

	/**
	 * @dev Allows the minter to burn nfts.
	 * @param tokenId The tokenId of the NFT that is being burned
	 */
	function burn(uint256 tokenId) public override onlyRole(MINTER_ROLE) {
		_burn(tokenId);
	}

	/**
	 * @dev Allows anyone to get the URI of a specific NFT
	 * @param tokenId The tokenId of the NFT for which the URI is being retrieved
	 * @return The URI of the NFT
	 */
	function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
		return super.tokenURI(tokenId);
	}

	/**
	 * @dev Allows anyone to check if the contract supports an interface
	 * @param interfaceId The interfaceId being checked for support
	 * @return True if the contract supports the interface, false otherwise
	 */
	function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl) returns (bool) {
		return super.supportsInterface(interfaceId);
	}

	/**
	 * @dev internal function that is executed before a token transfer
	 * @param from The current owner of the token
	 * @param to The address to which the token is being transferred
	 * @param tokenId The tokenId of the NFT that is being transferred
	 * @param batchSize The number of tokens being transferred in the batch
	 */
	function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal virtual override(ERC721, ERC721Enumerable) {
		super._beforeTokenTransfer(from, to, tokenId, batchSize);
	}

	/**
	 * @dev internal function that burns a token
	 * @param tokenId The tokenId of the NFT that is being burned
	 */
	function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
		super._burn(tokenId);
	}

	/**
	 * @dev internal pure function that returns the base URI for the NFTs
	 * @return the base URI
	 */
	function _baseURI() internal pure override returns (string memory) {
		return "ipfs://";
	}
}
